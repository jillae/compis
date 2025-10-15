
/**
 * At-Risk Customers API
 * Returns customers at risk of churning
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAtRiskCustomers } from '@/lib/retention-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const minDays = parseInt(searchParams.get('minDays') || '60')
    const minRiskScore = parseInt(searchParams.get('minRiskScore') || '50')

    const atRiskCustomers = await getAtRiskCustomers(
      session.user.clinicId,
      minDays,
      minRiskScore
    )

    return NextResponse.json({
      success: true,
      count: atRiskCustomers.length,
      customers: atRiskCustomers,
    })
  } catch (error: any) {
    console.error('At-risk API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch at-risk customers' },
      { status: 500 }
    )
  }
}
