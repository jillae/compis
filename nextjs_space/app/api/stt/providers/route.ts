
/**
 * STT Providers API - Get active providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
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
    console.error('[STT Providers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
