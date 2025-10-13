
/**
 * Meta API Sync Endpoint
 * Syncs campaign metrics from Meta Marketing API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncMetaCampaignMetrics } from '@/lib/meta-service'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sync Meta campaign data
    const result = await syncMetaCampaignMetrics(session.user.clinicId)

    return NextResponse.json({
      success: true,
      message: 'Meta sync complete',
      campaigns: result.campaigns,
    })
  } catch (error: any) {
    console.error('Meta sync API error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
