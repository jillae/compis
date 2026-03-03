/**
 * POST /api/loyalty/redeem
 * 
 * Löser in en belöning för en kund.
 * Body: { cardId: string, rewardId: string }
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
    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;
    const body = await request.json();
    const { cardId, rewardId } = body;

    if (!cardId || !rewardId) {
      return NextResponse.json(
        { success: false, error: 'cardId och rewardId krävs' },
        { status: 400 }
      );
    }

    // Hämta kortet
    const card = await prisma.loyaltyCard.findFirst({
      where: {
        id: cardId,
        program: clinicFilter,
        isActive: true,
      },
      include: {
        program: true,
        customer: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Kort hittades inte eller är inaktivt' },
        { status: 404 }
      );
    }

    // Hämta belöningen
    const reward = await prisma.reward.findFirst({
      where: {
        id: rewardId,
        programId: card.programId,
        isActive: true,
      },
    });

    if (!reward) {
      return NextResponse.json(
        { success: false, error: 'Belöning hittades inte' },
        { status: 404 }
      );
    }

    // Kontrollera att kunden har tillräckligt med stämplar/poäng
    if (reward.requiredStamps && card.stamps < reward.requiredStamps) {
      return NextResponse.json(
        {
          success: false,
          error: `Kunden har ${card.stamps} stämplar men behöver ${reward.requiredStamps}`,
        },
        { status: 400 }
      );
    }

    if (reward.requiredPoints && card.points < reward.requiredPoints) {
      return NextResponse.json(
        {
          success: false,
          error: `Kunden har ${card.points} poäng men behöver ${reward.requiredPoints}`,
        },
        { status: 400 }
      );
    }

    // Kontrollera max inlösningar
    if (reward.maxRedemptions) {
      const existingRedemptions = await prisma.redemption.count({
        where: {
          customerId: card.customerId,
          rewardId,
          status: { in: ['verified', 'used'] },
        },
      });

      if (existingRedemptions >= reward.maxRedemptions) {
        return NextResponse.json(
          { success: false, error: 'Max antal inlösningar för denna belöning har nåtts' },
          { status: 400 }
        );
      }
    }

    const verificationCode = randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = reward.expiresDays
      ? new Date(Date.now() + reward.expiresDays * 24 * 60 * 60 * 1000)
      : undefined;

    const effectiveClinicId = clinicId ?? card.program.clinicId;

    // Genomför inlösen atomärt
    const [redemption] = await prisma.$transaction([
      prisma.redemption.create({
        data: {
          customerId: card.customerId,
          rewardId,
          valueSEK: reward.valueSEK,
          verificationCode,
          status: 'verified',
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          expiresAt,
          clinicId: effectiveClinicId,
        },
        include: {
          reward: {
            select: { id: true, name: true, description: true, valueSEK: true },
          },
        },
      }),
      // Dra av stämplar/poäng
      prisma.loyaltyCard.update({
        where: { id: cardId },
        data: {
          stamps: reward.requiredStamps
            ? { decrement: reward.requiredStamps }
            : card.stamps,
          points: reward.requiredPoints
            ? { decrement: reward.requiredPoints }
            : card.points,
        },
      }),
      // Öka räknaren på belöningen
      prisma.reward.update({
        where: { id: rewardId },
        data: { totalRedeemed: { increment: 1 } },
      }),
      // Skapa transaktion
      prisma.loyaltyTransaction.create({
        data: {
          customerId: card.customerId,
          type: 'reward_redeemed',
          stamps: -(reward.requiredStamps ?? 0),
          points: -(reward.requiredPoints ?? 0),
          description: `Inlösen: ${reward.name}`,
          clinicId: effectiveClinicId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      redemption,
      verificationCode,
      message: `Belöning "${reward.name}" inlöst`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
