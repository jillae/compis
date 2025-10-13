
/**
 * Meta Campaign Metrics Endpoint
 * Returns aggregated Meta campaign performance data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMetaCampaignSummary, getCapacityBasedBudgetRecommendation } from '@/lib/meta-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Get campaign summary
    const summary = await getMetaCampaignSummary(session.user.clinicId, days)
    
    // Get budget recommendation
    const budgetRecommendation = await getCapacityBasedBudgetRecommendation(session.user.clinicId)

    return NextResponse.json({
      summary,
      budgetRecommendation,
    })
  } catch (error: any) {
    console.error('Meta metrics API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
