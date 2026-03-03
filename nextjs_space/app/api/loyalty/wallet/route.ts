/**
 * POST /api/loyalty/wallet
 * 
 * Genererar en wallet pass URL för en kund.
 * Body: { cardId: string, passType?: "apple" | "google" }
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
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);
    const body = await request.json();
    const { cardId, passType = 'google' } = body;

    if (!cardId) {
      return NextResponse.json(
        { success: false, error: 'cardId krävs' },
        { status: 400 }
      );
    }

    // Verify card belongs to clinic
    const card = await prisma.loyaltyCard.findFirst({
      where: {
        id: cardId,
        program: clinicFilter,
        isActive: true,
      },
      include: {
        customer: {
          select: { id: true, name: true, firstName: true, lastName: true, email: true },
        },
        program: {
          select: { id: true, name: true, backgroundColor: true, logoUrl: true },
        },
        walletPasses: {
          where: { passType, isActive: true },
          take: 1,
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kort hittades inte' },
        { status: 404 }
      );
    }

    // Return existing pass if one exists
    if (card.walletPasses.length > 0) {
      const existingPass = card.walletPasses[0];
      return NextResponse.json({
        success: true,
        walletPass: existingPass,
        qrCode: existingPass.qrCode,
        passUrl: existingPass.passUrl,
        message: 'Befintligt wallet-pass returnerat',
      });
    }

    // Create new wallet pass
    const qrCode = `KF-${randomBytes(8).toString('hex').toUpperCase()}`;
    const serialNumber = `SN-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    // For MVP: construct a URL that the customer can visit to see their card
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
    const passUrl = `${baseUrl}/loyalty/${qrCode}`;

    const walletPass = await prisma.walletPass.create({
      data: {
        cardId,
        passType,
        serialNumber,
        qrCode,
        passUrl,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      walletPass,
      qrCode,
      passUrl,
      message: `Wallet-pass (${passType}) skapat`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
