
// Voice TTS Test API
// POST: Test TTS with sample text

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { generateSpeechWithFallback } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, clinicId } = body;

    const targetClinicId = clinicId || session.user.clinicId;

    if (!targetClinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    if (!text) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.clinicId !== targetClinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get voice configuration
    const config = await prisma.voiceConfiguration.findUnique({
      where: { clinicId: targetClinicId },
    });

    if (!config) {
      return NextResponse.json({ error: 'Voice configuration not found' }, { status: 404 });
    }

    // Generate speech
    const result = await generateSpeechWithFallback(
      text,
      config.primaryProvider,
      {
        openaiApiKey: config.openaiApiKey || undefined,
        openaiVoice: config.openaiVoice,
        openaiModel: config.openaiModel,
        openaiSpeed: config.openaiSpeed,
        openaiFormat: config.openaiFormat,
        elevenlabsApiKey: config.elevenlabsApiKey || undefined,
        elevenlabsVoiceId: config.elevenlabsVoiceId || undefined,
        elevenlabsSpeed: config.elevenlabsSpeed,
        elevenlabsFormat: config.elevenlabsFormat,
      },
      config.enableFallback,
      config.fallbackTimeoutMs
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'TTS generation failed' },
        { status: 500 }
      );
    }

    // Return audio as base64
    const audioBase64 = result.audioBuffer?.toString('base64');

    return NextResponse.json({
      success: true,
      provider: result.provider,
      latencyMs: result.latencyMs,
      audioBase64,
      format: config.primaryProvider === 'OPENAI' ? config.openaiFormat : config.elevenlabsFormat,
    });
  } catch (error: any) {
    console.error('POST /api/voice/test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
