/**
 * GET    /api/loyalty/programs/[id]  – Hämta ett specifikt program
 * PUT    /api/loyalty/programs/[id]  – Uppdatera programmet
 * DELETE /api/loyalty/programs/[id]  – Ta bort programmet
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

    const program = await prisma.loyaltyProgram.findFirst({
      where: { id: params.id, ...clinicFilter },
      include: {
        loyaltyCards: {
          include: {
            customer: {
              select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true },
            },
            walletPasses: {
              select: { id: true, passType: true, qrCode: true, isActive: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        rewards: {
          orderBy: { requiredStamps: 'asc' },
        },
        _count: {
          select: { loyaltyCards: true, rewards: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, program });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);

    const existing = await prisma.loyaltyProgram.findFirst({
      where: { id: params.id, ...clinicFilter },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte' },
        { status: 404 }
      );
    }

    const body = await request.json();

    const program = await prisma.loyaltyProgram.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        code: body.code ?? existing.code,
        earnRule: body.earnRule ?? existing.earnRule,
        redeemRule: body.redeemRule ?? existing.redeemRule,
        tierRules: body.tierRules ?? existing.tierRules,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
        validDays: body.validDays ?? existing.validDays,
        stampsExpireDays: body.stampsExpireDays ?? existing.stampsExpireDays,
        pointsExpireDays: body.pointsExpireDays ?? existing.pointsExpireDays,
        backgroundColor: body.backgroundColor ?? existing.backgroundColor,
        logoUrl: body.logoUrl ?? existing.logoUrl,
        welcomeSms: body.welcomeSms ?? existing.welcomeSms,
        reminderSms: body.reminderSms ?? existing.reminderSms,
        sendWelcomeSms: body.sendWelcomeSms ?? existing.sendWelcomeSms,
        isActive: body.isActive ?? existing.isActive,
        isDraft: body.isDraft ?? existing.isDraft,
      },
    });

    return NextResponse.json({ success: true, program });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);

    const existing = await prisma.loyaltyProgram.findFirst({
      where: { id: params.id, ...clinicFilter },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte' },
        { status: 404 }
      );
    }

    await prisma.loyaltyProgram.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true, message: 'Program borttaget' });
  } catch (error) {
    return errorResponse(error);
  }
}
