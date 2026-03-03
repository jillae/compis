/**
 * GET  /api/loyalty/programs  – Hämta alla lojalitetsprogram för kliniken
 * POST /api/loyalty/programs  – Skapa ett nytt lojalitetsprogram
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
    const activeOnly = searchParams.get('active') === 'true';

    const programs = await prisma.loyaltyProgram.findMany({
      where: {
        ...clinicFilter,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        loyaltyCards: {
          where: { isActive: true },
          select: { id: true },
        },
        rewards: {
          where: { isActive: true },
          select: { id: true, name: true, requiredStamps: true, requiredPoints: true },
        },
        _count: {
          select: { loyaltyCards: true, rewards: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, programs });
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

    const {
      name,
      description,
      code,
      earnRule,
      redeemRule,
      tierRules,
      startDate,
      endDate,
      validDays,
      stampsExpireDays,
      pointsExpireDays,
      backgroundColor,
      logoUrl,
      welcomeSms,
      reminderSms,
      sendWelcomeSms,
      isActive,
      isDraft,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Namn är obligatoriskt' },
        { status: 400 }
      );
    }

    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;
    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'Ingen klinik kopplad till användaren' },
        { status: 400 }
      );
    }

    const program = await prisma.loyaltyProgram.create({
      data: {
        name,
        description,
        code,
        earnRule: earnRule ?? { type: 'per_booking', value: 1 },
        redeemRule: redeemRule ?? { 10: 'free_addon' },
        tierRules,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        validDays: validDays ?? [1, 2, 3, 4, 5],
        stampsExpireDays,
        pointsExpireDays,
        backgroundColor,
        logoUrl,
        welcomeSms,
        reminderSms,
        sendWelcomeSms: sendWelcomeSms ?? false,
        isActive: isActive ?? false,
        isDraft: isDraft ?? true,
        clinicId,
      },
    });

    return NextResponse.json({ success: true, program }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
