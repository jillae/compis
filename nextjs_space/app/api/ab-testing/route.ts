
// A/B Testing API - List and Create Tests

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createABTest } from '@/lib/ab-testing';
import { UserRole } from '@prisma/client';

// GET - List all A/B tests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    // SuperAdmin sees all tests, others see clinic-specific
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      where.clinicId = session.user.clinicId;
    }

    const tests = await prisma.aBTest.findMany({
      where,
      include: {
        variants: true,
        _count: {
          select: {
            conversions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error('AB Testing API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

// POST - Create new A/B test
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can create tests
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, targetPage, variantA, variantB, trafficSplit, conversionGoal } = body;

    if (!name || !targetPage || !variantA || !variantB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const test = await createABTest({
      name,
      description,
      targetPage,
      variantA,
      variantB,
      trafficSplit,
      conversionGoal,
      clinicId: session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.clinicId,
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error('Create AB test error:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}
