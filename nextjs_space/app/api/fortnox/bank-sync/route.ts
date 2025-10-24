
/**
 * Fortnox Bank Sync API
 * Syncs bank transactions from Fortnox and matches them with Sales
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { fetchFortnoxBankTransactions } from "@/lib/integrations/fortnox-client";

/**
 * POST - Sync bank transactions from Fortnox
 */
export async function POST(request: NextRequest) {
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

  // Only SuperAdmin, Admin can sync
  if (
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.ADMIN
  ) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Check if Fortnox is enabled
    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: {
        id: true,
        fortnoxEnabled: true,
      },
    });

    if (!clinic?.fortnoxEnabled) {
      return NextResponse.json(
        { error: "Fortnox integration not enabled for this clinic" },
        { status: 400 }
      );
    }

    // Parse request body for date range
    const body = await request.json().catch(() => ({}));
    const fromDate = body.fromDate || undefined;
    const toDate = body.toDate || undefined;

    // Fetch transactions from Fortnox
    const fortnoxTransactions = await fetchFortnoxBankTransactions(
      clinic.id,
      fromDate,
      toDate
    );

    // Log sync start
    console.log("[Fortnox Bank Sync] Starting sync", {
      clinicId: clinic.id,
      fromDate,
      toDate,
      transactionCount: fortnoxTransactions.length,
    });

    // Upsert transactions to database
    let created = 0;
    let updated = 0;
    let matched = 0;

    for (const transaction of fortnoxTransactions) {
      const transactionDate = new Date(transaction.Date);
      const amount = parseFloat(transaction.Amount.toString());

      // Create unique external ID
      const externalId = `${transaction.Date}_${amount}_${transaction.Description?.substring(0, 20) || ""}`;

      // Check if transaction already exists
      const existing = await prisma.bankTransaction.findFirst({
        where: {
          source: "fortnox",
          externalId,
          clinicId: clinic.id,
        },
      });

      if (existing) {
        // Update existing
        await prisma.bankTransaction.update({
          where: { id: existing.id },
          data: {
            amount,
            description: transaction.Description || null,
            reference: transaction.Reference || null,
            currency: transaction.Currency || "SEK",
            transactionDate,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        // Create new
        await prisma.bankTransaction.create({
          data: {
            clinicId: clinic.id,
            source: "fortnox",
            externalId,
            transactionDate,
            amount,
            description: transaction.Description || null,
            reference: transaction.Reference || null,
            currency: transaction.Currency || "SEK",
            matchStatus: "unmatched",
          },
        });
        created++;
      }
    }

    // Auto-match transactions with Sales (±3 days, exact amount match)
    // Only match incoming transactions (amount > 0)
    const unmatchedTransactions = await prisma.bankTransaction.findMany({
      where: {
        clinicId: clinic.id,
        source: "fortnox",
        matchStatus: "unmatched",
        amount: { gt: 0 }, // Only incoming payments
      },
    });

    for (const transaction of unmatchedTransactions) {
      // Find Sales within ±3 days with exact amount match
      const fromDateMatch = new Date(transaction.transactionDate);
      fromDateMatch.setDate(fromDateMatch.getDate() - 3);
      const toDateMatch = new Date(transaction.transactionDate);
      toDateMatch.setDate(toDateMatch.getDate() + 3);

      const matchingSales = await prisma.sale.findMany({
        where: {
          clinicId: clinic.id,
          receiptType: 0, // Only sales, not refunds
          totalAmount: transaction.amount,
          receiptDate: {
            gte: fromDateMatch,
            lte: toDateMatch,
          },
        },
        orderBy: {
          receiptDate: "asc",
        },
      });

      // Match to first available sale
      if (matchingSales.length > 0) {
        const sale = matchingSales[0];
        await prisma.bankTransaction.update({
          where: { id: transaction.id },
          data: {
            matchedToSaleId: sale.id,
            matchStatus: "matched",
          },
        });
        matched++;
      }
    }

    // Log sync completion
    console.log("[Fortnox Bank Sync] Sync completed", {
      clinicId: clinic.id,
      fromDate,
      toDate,
      total: fortnoxTransactions.length,
      created,
      updated,
      matched,
    });

    return NextResponse.json({
      success: true,
      results: {
        total: fortnoxTransactions.length,
        created,
        updated,
        matched,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to sync bank transactions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to sync bank transactions", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch saved bank transactions
 */
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

    const where: any = {
      clinicId: user.clinicId,
      source: "fortnox",
    };

    if (from || to) {
      where.transactionDate = {};
      if (from) where.transactionDate.gte = new Date(from);
      if (to) where.transactionDate.lte = new Date(to);
    }

    // Fetch transactions
    const transactions = await prisma.bankTransaction.findMany({
      where,
      include: {
        matchedSale: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch bank transactions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to fetch bank transactions", details: errorMessage },
      { status: 500 }
    );
  }
}
