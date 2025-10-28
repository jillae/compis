
// A/B Testing API - Get, Update, Delete Test

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startABTest, stopABTest } from '@/lib/ab-testing';
import { UserRole } from '@prisma/client';

// GET - Get test details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const test = await prisma.aBTest.findUnique({
      where: { id: params.id },
      include: {
        variants: true,
        conversions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('Get AB test error:', error);
    return NextResponse.json({ error: 'Failed to get test' }, { status: 500 });
  }
}

// PATCH - Update test (start, stop, pause)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    let test;
    if (action === 'start') {
      test = await startABTest(params.id);
    } else if (action === 'stop') {
      test = await stopABTest(params.id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error('Update AB test error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

// DELETE - Delete test
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.aBTest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete AB test error:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
