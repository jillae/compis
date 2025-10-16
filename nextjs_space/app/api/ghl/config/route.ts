
/**
 * GoHighLevel Configuration API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        ghlEnabled: true,
        ghlApiKey: true,
        ghlLocationId: true,
        ghlLastSync: true
      }
    });

    return NextResponse.json({
      success: true,
      config: {
        enabled: clinic?.ghlEnabled || false,
        hasApiKey: !!clinic?.ghlApiKey,
        hasLocationId: !!clinic?.ghlLocationId,
        lastSync: clinic?.ghlLastSync
      }
    });

  } catch (error) {
    console.error('GHL config fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GHL config' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled, apiKey, locationId } = await req.json();

    await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: {
        ghlEnabled: enabled,
        ghlApiKey: apiKey || undefined,
        ghlLocationId: locationId || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'GHL configuration updated'
    });

  } catch (error) {
    console.error('GHL config update error:', error);
    return NextResponse.json(
      { error: 'Failed to update GHL config' },
      { status: 500 }
    );
  }
}
