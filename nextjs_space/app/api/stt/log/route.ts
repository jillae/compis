
/**
 * STT Usage Logging API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function POST(req: NextRequest) {
  try {
    // 🔒 Authentication & Authorization
    const session = await getAuthSession();

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

    // Verify user has access to this clinic
    if (session.user.role !== 'SUPER_ADMIN' && session.user.clinicId !== clinicId) {
      return forbiddenResponse();
    }

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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to log STT usage');
  }
}
