/**
 * POST /api/loyalty/sms/test
 *
 * Skickar ett test-SMS för lojalitetsprogrammet.
 * Används från programinställningarna för att verifiera SMS-flöde.
 *
 * Body:
 *   programId  : string  – ID för lojalitetsprogrammet
 *   type       : 'welcome' | 'stamp' | 'level_up' | 'reward' | 'reminder' | 'birthday'
 *   phone      : string  – Testmottagarens mobilnummer
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { smsService } from '@/lib/sms/sms-service';
import {
  getAuthSession,
  getClinicFilter,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/multi-tenant-security';

type SMSTestType =
  | 'welcome'
  | 'stamp'
  | 'level_up'
  | 'reward'
  | 'reminder'
  | 'birthday';

export async function POST(request: NextRequest) {
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
    const { programId, type, phone } = body as {
      programId: string;
      type: SMSTestType;
      phone: string;
    };

    if (!programId || !type || !phone) {
      return NextResponse.json(
        { success: false, error: 'programId, type och phone krävs' },
        { status: 400 }
      );
    }

    // Verifiera att programmet tillhör kliniken
    const program = await prisma.loyaltyProgram.findFirst({
      where: {
        id: programId,
        ...(clinicId ? { clinicId } : {}),
      },
      include: {
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Lojalitetsprogram hittades inte' },
        { status: 404 }
      );
    }

    const clinicName = program.clinic.name;
    const programName = program.name;
    const effectiveClinicId = program.clinicId;

    const testMessages: Record<SMSTestType, string> = {
      welcome: `[TEST] Välkommen till ${clinicName}s lojalitetsprogram! Du har registrerats med ${programName}. Samla stämplar och få belöningar! 🎉`,
      stamp: `[TEST] Tack för besöket! Du har nu 5 av 10 stämplar på ${programName}. 5 kvar till belöning!`,
      level_up: `[TEST] Grattis! Du har nått Silver-nivå på ${programName}! 🌟 Fortsätt samla för ännu fler förmåner.`,
      reward: `[TEST] Du har en belöning att hämta: Gratis behandling! Visa ditt kort vid nästa besök hos ${clinicName}. 🎁`,
      reminder: `[TEST] Vi saknar dig på ${clinicName}! Det var 60 dagar sedan ditt senaste besök. Boka in dig snart! 😊`,
      birthday: `[TEST] Grattis på dagen! 🎂 Som present från oss på ${clinicName} får du dubbla stämplar vid ditt nästa besök. Varmt välkommen!`,
    };

    const message = testMessages[type];
    if (!message) {
      return NextResponse.json(
        { success: false, error: `Okänd SMS-typ: ${type}` },
        { status: 400 }
      );
    }

    const result = await smsService.sendEnhanced({
      clinicId: effectiveClinicId,
      to: phone,
      message,
      skipConsentCheck: true,
      skipRateLimitCheck: true,
      category: 'transactional',
    });

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Test-SMS skickat!'
        : `Misslyckades: ${result.error}`,
      provider: result.provider,
      messageId: result.messageId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
