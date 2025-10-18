
/**
 * STT Usage Logging API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinicId,
      providerId,
      audio_duration_seconds,
      processing_time_seconds,
      success,
      fallback_used,
      error_message
    } = body;

    await prisma.$executeRaw`
      INSERT INTO stt_provider_usage_logs 
      (id, clinic_id, provider_id, audio_duration_seconds, processing_time_seconds, success, fallback_used, error_message, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${clinicId},
        ${providerId},
        ${audio_duration_seconds || null},
        ${processing_time_seconds || null},
        ${success},
        ${fallback_used},
        ${error_message || null},
        NOW()
      )
    `;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[STT Log API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to log usage' },
      { status: 500 }
    );
  }
}
