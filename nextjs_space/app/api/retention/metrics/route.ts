
/**
 * Retention Metrics API
 * Returns aggregated retention analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRetentionMetrics } from '@/lib/retention-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await getRetentionMetrics(session.user.clinicId)

    return NextResponse.json({
      success: true,
      metrics,
    })
  } catch (error: any) {
    console.error('Retention metrics API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch retention metrics' },
      { status: 500 }
    )
  }
}
