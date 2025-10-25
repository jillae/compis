
/**
 * SuperAdmin Meta Configuration API
 * GET: Get all clinics with Meta settings
 * POST: Update Meta Pixel ID for a clinic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all clinics with Meta settings
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        metaPixelId: true,
        metaAccessToken: true,
        metaAdAccountId: true,
        metaAppId: true,
        metaAppSecret: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ clinics });
  } catch (error) {
    console.error('Failed to fetch Meta configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { clinicId, metaPixelId, metaAccessToken, metaAdAccountId } = body;

    if (!clinicId) {
      return NextResponse.json(
        { error: 'Clinic ID is required' },
        { status: 400 }
      );
    }

    // Update clinic Meta settings
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        metaPixelId: metaPixelId || null,
        metaAccessToken: metaAccessToken || null,
        metaAdAccountId: metaAdAccountId || null,
      },
      select: {
        id: true,
        name: true,
        metaPixelId: true,
        metaAccessToken: true,
        metaAdAccountId: true,
      },
    });

    return NextResponse.json({
      success: true,
      clinic,
      message: 'Meta configuration updated successfully',
    });
  } catch (error) {
    console.error('Failed to update Meta configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
