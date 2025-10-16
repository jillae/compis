

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        subscriptionStatus: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ clinics });
  } catch (error) {
    console.error('Error fetching clinics:', error);
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
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if clinic with this email already exists
    const existingClinic = await prisma.clinic.findFirst({
      where: { email: body.email }
    });

    if (existingClinic) {
      return NextResponse.json({ error: 'Clinic with this email already exists' }, { status: 400 });
    }

    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        tier: body.tier || 'BASIC',
        subscriptionStatus: body.subscriptionStatus || 'TRIAL',
        bokadirektApiKey: body.bokadirektApiKey,
        bokadirektEnabled: body.bokadirektEnabled ?? true,
        metaEnabled: body.metaEnabled ?? false,
        corexEnabled: body.corexEnabled ?? false,
        dynamicPricingEnabled: body.dynamicPricingEnabled ?? false,
        retentionAutopilotEnabled: body.retentionAutopilotEnabled ?? false,
        aiActionsEnabled: body.aiActionsEnabled ?? true,
        // Set trial end date to 14 days from now if status is TRIAL
        trialEndsAt: body.subscriptionStatus === 'TRIAL' 
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
          : null,
      }
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

