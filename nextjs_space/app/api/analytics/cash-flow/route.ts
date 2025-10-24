
/**
 * Cash Flow Analytics API
 * Compares Sales (expected revenue) with Bank Transactions (actual incoming cash)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's clinic
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      clinicId: true,
      role: true,
    },
  });

  if (!user?.clinicId) {
    return NextResponse.json({ error: "No clinic associated with user" }, { status: 400 });
  }

  try {
    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required query parameters: from, to (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Fetch Sales (expected revenue) - only actual sales, not refunds
    const sales = await prisma.sale.findMany({
      where: {
        clinicId: user.clinicId,
        receiptType: 0, // Only sales, not refunds
        receiptDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        bankTransactions: true,
      },
      orderBy: {
        receiptDate: "desc",
      },
    });

    // Fetch Bank Transactions (actual incoming cash) - only incoming payments
    const bankTransactions = await prisma.bankTransaction.findMany({
      where: {
        clinicId: user.clinicId,
        source: "fortnox",
        amount: { gt: 0 }, // Only incoming payments
        transactionDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        matchedSale: {
          select: {
            id: true,
            receiptNumber: true,
            receiptDate: true,
            totalAmount: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    // Calculate summary statistics
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalIncoming = bankTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );
    const gap = totalSales - totalIncoming;
    const gapPercentage = totalSales > 0 ? (gap / totalSales) * 100 : 0;

    const matchedCount = bankTransactions.filter((t) => t.matchStatus === "matched").length;
    const pendingCount = sales.filter((s) => s.bankTransactions.length === 0).length;
    const unmatchedCount = bankTransactions.filter((t) => t.matchStatus === "unmatched").length;

    // Generate daily chart data
    const chartData: Record<
      string,
      { date: string; sales: number; bankIncome: number; gap: number }
    > = {};

    // Add sales to chart
    for (const sale of sales) {
      const dateKey = sale.receiptDate.toISOString().split("T")[0];
      if (!chartData[dateKey]) {
        chartData[dateKey] = { date: dateKey, sales: 0, bankIncome: 0, gap: 0 };
      }
      chartData[dateKey].sales += Number(sale.totalAmount);
    }

    // Add bank transactions to chart
    for (const transaction of bankTransactions) {
      const dateKey = transaction.transactionDate.toISOString().split("T")[0];
      if (!chartData[dateKey]) {
        chartData[dateKey] = { date: dateKey, sales: 0, bankIncome: 0, gap: 0 };
      }
      chartData[dateKey].bankIncome += Number(transaction.amount);
    }

    // Calculate gap for each day
    const chartDataArray = Object.values(chartData)
      .map((day) => ({
        ...day,
        gap: day.sales - day.bankIncome,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Return comprehensive analytics
    return NextResponse.json({
      success: true,
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalIncoming: Math.round(totalIncoming * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        gapPercentage: Math.round(gapPercentage * 100) / 100,
        matchedCount,
        pendingCount,
        unmatchedCount,
      },
      chartData: chartDataArray,
      sales: sales.slice(0, 10), // Latest 10 sales
      bankTransactions: bankTransactions.slice(0, 10), // Latest 10 transactions
    });
  } catch (error: unknown) {
    console.error("Failed to fetch cash flow analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch cash flow analytics", details: errorMessage },
      { status: 500 }
    );
  }
}
