
// Voice Configuration API
// GET: Get voice config for a clinic
// PUT: Update voice config

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, TTSProvider } from '@prisma/client';

// GET - Get voice configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || session.user.clinicId;

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.clinicId !== clinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await prisma.voiceConfiguration.findUnique({
      where: { clinicId },
    });

    if (!config) {
      // Create default config if none exists
      const newConfig = await prisma.voiceConfiguration.create({
        data: {
          clinicId,
          primaryProvider: TTSProvider.OPENAI,
        },
      });
      return NextResponse.json(newConfig);
    }

    // Don't expose API keys in response (security)
    const sanitizedConfig = {
      ...config,
      openaiApiKey: config.openaiApiKey ? '***' : null,
      elevenlabsApiKey: config.elevenlabsApiKey ? '***' : null,
      elksPassword: config.elksPassword ? '***' : null,
    };

    return NextResponse.json(sanitizedConfig);
  } catch (error: any) {
    console.error('GET /api/voice/config error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update voice configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clinicId, ...updateData } = body;

    const targetClinicId = clinicId || session.user.clinicId;

    if (!targetClinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Check permissions - only SuperAdmin or clinic admin can update
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.clinicId !== targetClinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Upsert configuration
    const config = await prisma.voiceConfiguration.upsert({
      where: { clinicId: targetClinicId },
      update: updateData,
      create: {
        clinicId: targetClinicId,
        ...updateData,
      },
    });

    // Don't expose API keys in response
    const sanitizedConfig = {
      ...config,
      openaiApiKey: config.openaiApiKey ? '***' : null,
      elevenlabsApiKey: config.elevenlabsApiKey ? '***' : null,
      elksPassword: config.elksPassword ? '***' : null,
    };

    return NextResponse.json(sanitizedConfig);
  } catch (error: any) {
    console.error('PUT /api/voice/config error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
