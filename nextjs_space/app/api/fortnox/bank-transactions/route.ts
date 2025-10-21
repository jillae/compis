
/**
 * Fortnox Bank Transactions API
 * Fetch bank transactions from Fortnox
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { fetchFortnoxBankTransactions } from "@/lib/integrations/fortnox-client";

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

  // Only SuperAdmin, Owner, and Manager can view bank transactions
  if (
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.STAFF
  ) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Check if Fortnox is enabled for this clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: {
        fortnoxEnabled: true,
      },
    });

    if (!clinic?.fortnoxEnabled) {
      return NextResponse.json(
        { error: "Fortnox integration not enabled for this clinic" },
        { status: 400 }
      );
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    // Fetch transactions
    const transactions = await fetchFortnoxBankTransactions(
      user.clinicId,
      fromDate,
      toDate
    );

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
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
