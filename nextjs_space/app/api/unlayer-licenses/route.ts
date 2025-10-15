

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, UnlayerPlan, UnlayerLicenseStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all licenses with clinic info
    const licenses = await prisma.unlayerLicense.findMany({
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            tier: true,
            subscriptionStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clinicId, plan, apiKey, projectId, pricePerMonth, expiresAt } = body;

    if (!clinicId || !plan) {
      return NextResponse.json(
        { error: 'Clinic ID and plan are required' },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Check if license already exists
    const existingLicense = await prisma.unlayerLicense.findUnique({
      where: { clinicId },
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: 'License already exists for this clinic' },
        { status: 400 }
      );
    }

    // Create new license
    const license = await prisma.unlayerLicense.create({
      data: {
        clinicId,
        plan,
        apiKey,
        projectId,
        pricePerMonth: pricePerMonth || 0,
        status: UnlayerLicenseStatus.ACTIVE,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

