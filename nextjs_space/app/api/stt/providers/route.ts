
/**
 * STT Providers API - Get active providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, unauthorizedResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function GET(req: NextRequest) {
  try {
    // 🔒 Authentication required
    await getAuthSession();

    const providers = await prisma.$queryRaw<any[]>`
      SELECT * FROM stt_provider_config 
      WHERE is_active = true 
      ORDER BY priority_order ASC
    `;

    return NextResponse.json({
      success: true,
      providers
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to fetch STT providers');
  }
}
