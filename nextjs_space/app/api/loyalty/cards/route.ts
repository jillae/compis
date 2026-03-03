/**
 * GET  /api/loyalty/cards  – Lista lojalitetskort (med filter)
 * POST /api/loyalty/cards  – Skapa ett nytt kort för en kund
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

export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const level = searchParams.get('level');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      program: clinicFilter,
      ...(programId ? { programId } : {}),
      ...(customerId ? { customerId } : {}),
      ...(level ? { level } : {}),
      isActive: true,
    };

    if (search) {
      where.customer = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [cards, total] = await Promise.all([
      prisma.loyaltyCard.findMany({
        where,
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
            select: { id: true, name: true, backgroundColor: true, earnRule: true },
          },
          walletPasses: {
            where: { isActive: true },
            select: { id: true, passType: true, qrCode: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loyaltyCard.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      cards,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

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
    const { customerId, programId } = body;

    if (!customerId || !programId) {
      return NextResponse.json(
        { success: false, error: 'customerId och programId krävs' },
        { status: 400 }
      );
    }

    // Verify program belongs to clinic
    const program = await prisma.loyaltyProgram.findFirst({
      where: { id: programId, ...clinicFilter },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte' },
        { status: 404 }
      );
    }

    // Prevent duplicate cards
    const existing = await prisma.loyaltyCard.findUnique({
      where: { customerId_programId: { customerId, programId } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Kunden har redan ett kort för detta program' },
        { status: 409 }
      );
    }

    // Create card + wallet pass in one transaction
    const qrCode = `KF-${randomBytes(8).toString('hex').toUpperCase()}`;
    const serialNumber = `SN-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const card = await prisma.loyaltyCard.create({
      data: {
        customerId,
        programId,
        stamps: 0,
        points: 0,
        level: 'bronze',
        isActive: true,
        walletPasses: {
          create: {
            passType: 'google',
            serialNumber,
            qrCode,
            isActive: true,
          },
        },
      },
      include: {
        customer: {
          select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true },
        },
        program: {
          select: { id: true, name: true, earnRule: true, tierRules: true },
        },
        walletPasses: true,
      },
    });

    return NextResponse.json({ success: true, card }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
