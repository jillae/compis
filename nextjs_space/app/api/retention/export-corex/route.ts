
/**
 * Export At-Risk Customers for Corex
 * API endpoint for Corex to fetch customers needing re-engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exportAtRiskCustomersForCorex } from '@/lib/retention-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const minRiskScore = parseInt(searchParams.get('minRiskScore') || '60')

    const customers = await exportAtRiskCustomersForCorex(
      session.user.clinicId,
      minRiskScore
    )

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
      integration: 'corex',
      message: 'Ready for Corex omnichannel engagement',
    })
  } catch (error: any) {
    console.error('Corex export API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export customers for Corex' },
      { status: 500 }
    )
  }
}
