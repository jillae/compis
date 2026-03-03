/**
 * GET  /api/loyalty/public?qrCode=xxx  – Hämta kortinfo via QR-kod (publik, ingen auth)
 * POST /api/loyalty/public             – Registrera kund med email/telefon för ett program
 * 
 * Dessa endpoints är publika och kräver ingen inloggning.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qrCode = searchParams.get('qrCode');

  if (!qrCode) {
    return NextResponse.json(
      { success: false, error: 'qrCode krävs' },
      { status: 400 }
    );
  }

  try {
    const walletPass = await prisma.walletPass.findUnique({
      where: { qrCode },
      include: {
        card: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                description: true,
                backgroundColor: true,
                logoUrl: true,
                earnRule: true,
                redeemRule: true,
                tierRules: true,
                clinic: {
                  select: { name: true },
                },
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!walletPass || !walletPass.isActive) {
      return NextResponse.json(
        { success: false, error: 'Ogiltig eller inaktiv QR-kod' },
        { status: 404 }
      );
    }

    const { card } = walletPass;

    return NextResponse.json({
      success: true,
      card: {
        id: card.id,
        stamps: card.stamps,
        points: card.points,
        level: card.level,
        expiresAt: card.expiresAt?.toISOString(),
        lastEarnedAt: card.lastEarnedAt?.toISOString(),
      },
      program: card.program,
      customerName:
        card.customer.name ??
        [card.customer.firstName, card.customer.lastName].filter(Boolean).join(' ') ??
        null,
      qrCode,
    });
  } catch (error) {
    console.error('[Public Loyalty API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Serverfel' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, programCode, programId } = body;

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'E-post eller telefon krävs' },
        { status: 400 }
      );
    }

    if (!programCode && !programId) {
      return NextResponse.json(
        { success: false, error: 'programCode eller programId krävs' },
        { status: 400 }
      );
    }

    // Hitta programmet
    const program = await prisma.loyaltyProgram.findFirst({
      where: {
        ...(programCode ? { code: programCode } : {}),
        ...(programId ? { id: programId } : {}),
        isActive: true,
      },
      include: {
        clinic: {
          select: { id: true, name: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte eller är inaktivt' },
        { status: 404 }
      );
    }

    // Hitta eller skapa kund
    const customerQuery: { clinicId: string; email?: string; phone?: string } = {
      clinicId: program.clinicId,
    };

    if (email) customerQuery.email = email;
    else if (phone) customerQuery.phone = phone;

    let customer = await prisma.customer.findFirst({ where: customerQuery });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          clinicId: program.clinicId,
          email: email || undefined,
          phone: phone || undefined,
          name: email ?? phone ?? 'Okänd kund',
        },
      });
    }

    // Kolla om kunden redan har ett kort
    const existingCard = await prisma.loyaltyCard.findUnique({
      where: {
        customerId_programId: {
          customerId: customer.id,
          programId: program.id,
        },
      },
      include: {
        walletPasses: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (existingCard) {
      // Returnera befintligt kort
      const qrCode =
        existingCard.walletPasses[0]?.qrCode ??
        `KF-${randomBytes(8).toString('hex').toUpperCase()}`;

      return NextResponse.json({
        success: true,
        message: 'Du är redan registrerad i detta program!',
        card: {
          id: existingCard.id,
          stamps: existingCard.stamps,
          points: existingCard.points,
          level: existingCard.level,
        },
        qrCode,
        passUrl: `${process.env.NEXTAUTH_URL ?? ''}/loyalty/${qrCode}`,
      });
    }

    // Skapa nytt kort + wallet pass
    const qrCode = `KF-${randomBytes(8).toString('hex').toUpperCase()}`;
    const serialNumber = `SN-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
    const passUrl = `${baseUrl}/loyalty/${qrCode}`;

    const card = await prisma.loyaltyCard.create({
      data: {
        customerId: customer.id,
        programId: program.id,
        stamps: 0,
        points: 0,
        level: 'bronze',
        isActive: true,
        walletPasses: {
          create: {
            passType: 'google',
            serialNumber,
            qrCode,
            passUrl,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Välkommen! Ditt lojalitetskort är skapat.',
        card: {
          id: card.id,
          stamps: card.stamps,
          points: card.points,
          level: card.level,
        },
        qrCode,
        passUrl,
        programName: program.name,
        clinicName: program.clinic.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Public Loyalty API Error]', error);
    return NextResponse.json(
      { success: false, error: 'Serverfel' },
      { status: 500 }
    );
  }
}
