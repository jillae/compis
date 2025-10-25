
// Bokadirekt Auto-Booking Configuration API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, BokadirektAutoBookingMode } from '@prisma/client';

// GET auto-booking config
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinicId = session.user.clinicId;
    
    if (!clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        bokadirektAutoBookingMode: true,
        autoBookingPreferredServices: true,
        autoBookingPreferredStaff: true,
        autoBookingMaxDaysAhead: true,
        autoBookingNotifyEmail: true,
        bokadirektEnabled: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Get auto-booking config error:', error);
    return NextResponse.json(
      { error: 'Failed to get config' },
      { status: 500 }
    );
  }
}

// PUT - Update auto-booking config
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const clinicId = session.user.clinicId;
    
    if (!clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    const body = await request.json();
    const {
      bokadirektAutoBookingMode,
      autoBookingPreferredServices,
      autoBookingPreferredStaff,
      autoBookingMaxDaysAhead,
      autoBookingNotifyEmail,
    } = body;

    // Validate mode
    if (bokadirektAutoBookingMode && !Object.values(BokadirektAutoBookingMode).includes(bokadirektAutoBookingMode)) {
      return NextResponse.json(
        { error: 'Invalid booking mode' },
        { status: 400 }
      );
    }

    // If NOTIFY mode, require email
    if (bokadirektAutoBookingMode === BokadirektAutoBookingMode.NOTIFY && !autoBookingNotifyEmail) {
      return NextResponse.json(
        { error: 'Email required for NOTIFY mode' },
        { status: 400 }
      );
    }

    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        bokadirektAutoBookingMode,
        autoBookingPreferredServices,
        autoBookingPreferredStaff,
        autoBookingMaxDaysAhead,
        autoBookingNotifyEmail,
      },
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Update auto-booking config error:', error);
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}
