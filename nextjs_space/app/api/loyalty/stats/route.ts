/**
 * GET /api/loyalty/stats
 * 
 * Statistik för lojalitetsprogrammet.
 * Query params: programId? (filter by program)
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
    const programId = searchParams.get('programId');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const cardWhere: Record<string, unknown> = {
      program: clinicFilter,
      isActive: true,
      ...(programId ? { programId } : {}),
    };

    const txWhere: Record<string, unknown> = {
      ...clinicFilter,
    };

    // Parallel queries för prestanda
    const [
      totalActiveCards,
      totalPrograms,
      stampsTodayResult,
      redemptionsThisMonth,
      redemptionsLastMonth,
      levelDistribution,
      recentTransactions,
      topPrograms,
    ] = await Promise.all([
      // Totalt aktiva kort
      prisma.loyaltyCard.count({ where: cardWhere }),

      // Totalt program
      prisma.loyaltyProgram.count({
        where: { ...clinicFilter, isActive: true },
      }),

      // Stämplar idag
      prisma.loyaltyTransaction.aggregate({
        where: {
          ...txWhere,
          type: 'stamp_earned',
          createdAt: { gte: startOfToday },
        },
        _sum: { stamps: true },
      }),

      // Inlösningar denna månad
      prisma.redemption.count({
        where: {
          ...clinicFilter,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Inlösningar förra månaden (för jämförelse)
      prisma.redemption.count({
        where: {
          ...clinicFilter,
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      // Nivåfördelning
      prisma.loyaltyCard.groupBy({
        by: ['level'],
        where: cardWhere,
        _count: true,
      }),

      // Senaste aktivitet
      prisma.loyaltyTransaction.findMany({
        where: {
          ...txWhere,
          ...(programId ? {} : {}),
        },
        include: {
          customer: {
            select: { id: true, name: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Top program efter antal kort
      prisma.loyaltyProgram.findMany({
        where: { ...clinicFilter, isActive: true },
        include: {
          _count: { select: { loyaltyCards: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const stampsTodayCount = stampsTodayResult._sum.stamps ?? 0;
    const redemptionGrowth =
      redemptionsLastMonth > 0
        ? Math.round(
            ((redemptionsThisMonth - redemptionsLastMonth) / redemptionsLastMonth) * 100
          )
        : redemptionsThisMonth > 0
        ? 100
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalActiveCards,
        totalPrograms,
        stampsTodayCount,
        redemptionsThisMonth,
        redemptionsLastMonth,
        redemptionGrowth,
        levelDistribution: levelDistribution.map((l) => ({
          level: l.level,
          count: l._count,
        })),
      },
      recentActivity: recentTransactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        stamps: tx.stamps,
        points: tx.points,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
        customerName:
          tx.customer?.name ??
          [tx.customer?.firstName, tx.customer?.lastName].filter(Boolean).join(' ') ??
          'Okänd kund',
      })),
      topPrograms: topPrograms.map((p) => ({
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        isDraft: p.isDraft,
        memberCount: p._count.loyaltyCards,
        backgroundColor: p.backgroundColor,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
