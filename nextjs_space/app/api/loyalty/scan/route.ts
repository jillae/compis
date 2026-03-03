/**
 * POST /api/loyalty/scan
 * 
 * Personal skannar kundens QR-kod från Wallet.
 * Lägger till stämpel/poäng och kontrollerar tier-uppgradering.
 * 
 * Body: { qrCode: string, note?: string }
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
import { loyaltySMSAutomation } from '@/lib/loyalty/sms-automation';
import { notifyLoyaltyMilestone } from '@/lib/notifications/campaign-reminders';

function computeTier(stamps: number, points: number, tierRules: unknown): string {
  if (!tierRules || typeof tierRules !== 'object') return 'bronze';
  
  const rules = tierRules as Record<string, number>;
  const total = stamps + points;
  
  const tiers = Object.entries(rules)
    .map(([tier, threshold]) => ({ tier, threshold }))
    .sort((a, b) => b.threshold - a.threshold);
  
  for (const { tier, threshold } of tiers) {
    if (total >= threshold) return tier;
  }
  
  return 'bronze';
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
    const { qrCode, note } = body;

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR-kod krävs' },
        { status: 400 }
      );
    }

    // 1. Hitta WalletPass via qrCode
    const walletPass = await prisma.walletPass.findUnique({
      where: { qrCode },
      include: {
        card: {
          include: {
            program: true,
            customer: {
              select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!walletPass || !walletPass.isActive) {
      return NextResponse.json(
        { success: false, error: 'QR-koden är ogiltig eller inaktiv' },
        { status: 404 }
      );
    }

    const { card } = walletPass;
    const { program } = card;

    // 2. Verifiera att programmet tillhör kliniken
    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;
    if (clinicId && program.clinicId !== clinicId) {
      return NextResponse.json(
        { success: false, error: 'Otillåten åtkomst' },
        { status: 403 }
      );
    }

    if (!card.isActive) {
      return NextResponse.json(
        { success: false, error: 'Kortet är inaktivt' },
        { status: 400 }
      );
    }

    // 3. Tillämpa earnRule
    const earnRule = program.earnRule as Record<string, unknown>;
    const earnType = (earnRule.type as string) ?? 'per_booking';
    let stampsToAdd = 0;
    let pointsToAdd = 0;

    if (earnType === 'per_booking' || earnType === 'stamp') {
      stampsToAdd = (earnRule.value as number) ?? 1;
    } else if (earnType === 'points') {
      pointsToAdd = (earnRule.value as number) ?? 10;
    } else if (earnType === 'hybrid') {
      stampsToAdd = (earnRule.stamps as number) ?? 1;
      pointsToAdd = (earnRule.points as number) ?? 5;
    } else {
      stampsToAdd = 1; // Standard: en stämpel per besök
    }

    const newStamps = card.stamps + stampsToAdd;
    const newPoints = card.points + pointsToAdd;

    // 4. Kontrollera tier-uppgradering
    const tierRules = program.tierRules;
    const newLevel = computeTier(newStamps, newPoints, tierRules);
    const tierUpgraded = newLevel !== card.level;

    // 5. Uppdatera kort + skapa transaktion (atomic)
    const [updatedCard] = await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: card.id },
        data: {
          stamps: newStamps,
          points: newPoints,
          level: newLevel,
          lastEarnedAt: new Date(),
        },
        include: {
          customer: {
            select: { id: true, name: true, firstName: true, lastName: true },
          },
          program: {
            select: { id: true, name: true, earnRule: true, tierRules: true, redeemRule: true },
          },
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          customerId: card.customerId,
          type: stampsToAdd > 0 ? 'stamp_earned' : 'points_earned',
          stamps: stampsToAdd,
          points: pointsToAdd,
          description: note ?? `Skannad av personal – ${stampsToAdd > 0 ? `+${stampsToAdd} stämpel` : `+${pointsToAdd} poäng`}`,
          clinicId: program.clinicId,
        },
      }),
      prisma.walletPass.update({
        where: { id: walletPass.id },
        data: { lastUpdatedAt: new Date() },
      }),
    ]);

    // 6. Kontrollera om kunden kan lösa in en belöning
    const availableRewards = await prisma.reward.findMany({
      where: {
        programId: program.id,
        isActive: true,
        OR: [
          { requiredStamps: { lte: newStamps } },
          { requiredPoints: { lte: newPoints } },
        ],
      },
      orderBy: { requiredStamps: 'asc' },
    });

    // 7. Skicka SMS-notiser asynkront (fire-and-forget, blockerar ej svaret)
    void (async () => {
      try {
        // Stämpelbekräftelse
        await loyaltySMSAutomation.sendStampConfirmation(
          card.id,
          stampsToAdd,
          newStamps
        );

        // Nivå-uppgradering
        if (tierUpgraded) {
          await loyaltySMSAutomation.sendLevelUp(card.id, card.level, newLevel);

          // Notis till personal om milstolpen
          const customerName =
            card.customer?.firstName ??
            card.customer?.name ??
            'Kund';
          await notifyLoyaltyMilestone(
            program.clinicId,
            customerName,
            newLevel,
            card.id
          );
        }

        // Belöning tillgänglig
        if (availableRewards.length > 0) {
          await loyaltySMSAutomation.sendRewardAvailable(
            card.id,
            availableRewards[0].name
          );
        }
      } catch (smsErr) {
        // Logga men bryt inte flödet – SMS är icke-kritiskt
        console.error('[LoyaltySMS] Kunde inte skicka SMS efter skanning:', smsErr);
      }
    })();

    return NextResponse.json({
      success: true,
      card: updatedCard,
      stampsAdded: stampsToAdd,
      pointsAdded: pointsToAdd,
      tierUpgraded,
      newLevel,
      availableRewards,
      message: tierUpgraded
        ? `✨ Grattis! Kunden uppgraderades till ${newLevel}!`
        : `+${stampsToAdd > 0 ? `${stampsToAdd} stämpel` : `${pointsToAdd} poäng`} tillagd`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
