/**
 * GET /api/loyalty/cards/[id]  – Hämta ett specifikt lojalitetskort med transaktionshistorik
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getAuthSession,
  getClinicFilter,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/multi-tenant-security';

interface Params {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);

    const card = await prisma.loyaltyCard.findFirst({
      where: {
        id: params.id,
        program: clinicFilter,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            earnRule: true,
            redeemRule: true,
            tierRules: true,
            backgroundColor: true,
            logoUrl: true,
          },
        },
        walletPasses: {
          where: { isActive: true },
          select: {
            id: true,
            passType: true,
            qrCode: true,
            serialNumber: true,
            passUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kort hittades inte' },
        { status: 404 }
      );
    }

    // Fetch transaction history separately
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: {
        customerId: card.customerId,
        ...clinicFilter,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        type: true,
        stamps: true,
        points: true,
        description: true,
        createdAt: true,
      },
    });

    // Fetch redemptions
    const redemptions = await prisma.redemption.findMany({
      where: {
        customerId: card.customerId,
        ...clinicFilter,
      },
      include: {
        reward: {
          select: { id: true, name: true, valueSEK: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      card,
      transactions,
      redemptions,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
