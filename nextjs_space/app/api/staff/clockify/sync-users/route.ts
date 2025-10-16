
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import ClockifyClient from '@/lib/integrations/clockify-client';

/**
 * POST /api/staff/clockify/sync-users
 * 
 * Sync users from Clockify workspace to Flow Staff table
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Ej autentiserad' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Saknar behörighet' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clinicId } = body;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId krävs' },
        { status: 400 }
      );
    }

    // Get Clockify integration
    const integration = await prisma.clockifyIntegration.findUnique({
      where: { clinicId },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Clockify är inte anslutet för denna klinik' },
        { status: 400 }
      );
    }

    // Get users from Clockify
    const clockify = new ClockifyClient(integration.apiKey);
    const clockifyUsers = await clockify.getUsers(integration.workspaceId);

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const clockifyUser of clockifyUsers) {
      try {
        // Check if staff already exists with this Clockify user ID
        const existingStaff = await prisma.staff.findFirst({
          where: {
            clinicId,
            clockifyUserId: clockifyUser.id,
          },
        });

        if (existingStaff) {
          // Update existing staff
          await prisma.staff.update({
            where: { id: existingStaff.id },
            data: {
              name: clockifyUser.name,
              email: clockifyUser.email,
              clockifyWorkspaceId: integration.workspaceId,
            },
          });
        } else {
          // Create new staff
          await prisma.staff.create({
            data: {
              clinicId,
              name: clockifyUser.name,
              email: clockifyUser.email,
              clockifyUserId: clockifyUser.id,
              clockifyWorkspaceId: integration.workspaceId,
              isActive: clockifyUser.status === 'ACTIVE',
              employmentType: 'FULLTIME', // Default
              weeklyHours: 40, // Default
            },
          });
        }

        synced++;
      } catch (err: any) {
        console.error('[Clockify Sync User] Error:', err);
        failed++;
        errors.push(`${clockifyUser.name}: ${err.message}`);
      }
    }

    // Update last sync timestamp
    await prisma.clockifyIntegration.update({
      where: { clinicId },
      data: {
        lastSyncAt: new Date(),
        syncErrors: errors.length > 0 ? errors : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      synced,
      failed,
      total: clockifyUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[Clockify Sync Users] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Något gick fel' },
      { status: 500 }
    );
  }
}
