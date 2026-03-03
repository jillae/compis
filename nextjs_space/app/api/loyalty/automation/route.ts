/**
 * GET /api/loyalty/automation        – Hämta SMS-automationsinställningar för ett program
 * PUT /api/loyalty/automation        – Uppdatera SMS-automationsinställningar
 *
 * Query param: programId (required for GET)
 * Body for PUT: { programId, settings }
 *
 * Inställningarna lagras direkt på LoyaltyProgram-modellen:
 *   sendWelcomeSms   : Boolean
 *   welcomeSms       : String (anpassad text)
 *   reminderSms      : String (anpassad text)
 *
 * Extra inställningar lagras som JSON i ett dedikerat fält om det finns,
 * annars i en utökad payload som kommenteras för framtiden.
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

// ------------------------------------------------------------------
// GET – hämta automationsinställningar
// ------------------------------------------------------------------
export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);
    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'programId krävs' },
        { status: 400 }
      );
    }

    const program = await prisma.loyaltyProgram.findFirst({
      where: {
        id: programId,
        ...(clinicId ? { clinicId } : {}),
      },
      select: {
        id: true,
        name: true,
        sendWelcomeSms: true,
        welcomeSms: true,
        reminderSms: true,
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte' },
        { status: 404 }
      );
    }

    // Returnera inställningar + standardvärden för triggers
    return NextResponse.json({
      success: true,
      settings: {
        programId: program.id,
        programName: program.name,
        sendWelcomeSms: program.sendWelcomeSms,
        welcomeSms: program.welcomeSms ?? '',
        reminderSms: program.reminderSms ?? '',
        // Trigger-inställningar (standardvärden – utökas i framtida schema)
        sendStampSms: true,
        sendLevelUpSms: true,
        sendRewardSms: true,
        sendReminderSms: true,
        sendBirthdaySms: true,
        reminderAfterDays: 60, // Skicka påminnelse efter X dagars frånvaro
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ------------------------------------------------------------------
// PUT – uppdatera automationsinställningar
// ------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);
    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;

    const body = await request.json();
    const { programId, settings } = body as {
      programId: string;
      settings: {
        sendWelcomeSms?: boolean;
        welcomeSms?: string;
        reminderSms?: string;
      };
    };

    if (!programId) {
      return NextResponse.json(
        { success: false, error: 'programId krävs' },
        { status: 400 }
      );
    }

    // Verifiera ägarskap
    const existing = await prisma.loyaltyProgram.findFirst({
      where: {
        id: programId,
        ...(clinicId ? { clinicId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Program hittades inte' },
        { status: 404 }
      );
    }

    const updated = await prisma.loyaltyProgram.update({
      where: { id: programId },
      data: {
        ...(settings.sendWelcomeSms !== undefined && {
          sendWelcomeSms: settings.sendWelcomeSms,
        }),
        ...(settings.welcomeSms !== undefined && {
          welcomeSms: settings.welcomeSms,
        }),
        ...(settings.reminderSms !== undefined && {
          reminderSms: settings.reminderSms,
        }),
      },
      select: {
        id: true,
        name: true,
        sendWelcomeSms: true,
        welcomeSms: true,
        reminderSms: true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'SMS-automationsinställningar sparade',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
