
/**
 * Superadmin STT Provider Statistics API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Get usage stats per provider
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.display_name,
        COUNT(l.*) as total_requests,
        COUNT(CASE WHEN l.success = true THEN 1 END) as successful_requests,
        COUNT(CASE WHEN l.success = false THEN 1 END) as failed_requests,
        ROUND(AVG(CASE WHEN l.success = true THEN l.processing_time_seconds END)::numeric, 2) as avg_processing_time,
        ROUND(SUM(l.audio_duration_seconds)::numeric, 2) as total_audio_duration
      FROM stt_provider_config p
      LEFT JOIN stt_provider_usage_logs l ON l.provider_id = p.id
        AND l.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY p.id, p.display_name
      ORDER BY p.priority_order
    `;

    // Get recent failures
    const recentFailures = await prisma.$queryRaw<any[]>`
      SELECT 
        p.display_name,
        l.error_message,
        l.created_at
      FROM stt_provider_usage_logs l
      JOIN stt_provider_config p ON p.id = l.provider_id
      WHERE l.success = false
        AND l.created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY l.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      stats,
      recentFailures
    });

  } catch (error: any) {
    console.error('[SA STT Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
