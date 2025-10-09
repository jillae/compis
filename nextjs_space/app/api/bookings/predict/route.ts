
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { predictNoShowRisk, getHighRiskBookings, calculateRevenueAtRisk } from '@/lib/no-show-prediction'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/predict
 * Get high-risk bookings or predict specific booking
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')
    const days = parseInt(searchParams.get('days') || '14')
    const action = searchParams.get('action') || 'high-risk'

    if (bookingId) {
      // Predict specific booking
      const prediction = await predictNoShowRisk(bookingId)
      if (!prediction) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }
      return NextResponse.json(prediction)
    }

    if (action === 'revenue-at-risk') {
      // Calculate revenue at risk
      const metrics = await calculateRevenueAtRisk(days)
      return NextResponse.json(metrics)
    }

    // Get all high-risk bookings
    const highRiskBookings = await getHighRiskBookings(days)
    return NextResponse.json({
      bookings: highRiskBookings,
      count: highRiskBookings.length
    })
  } catch (error) {
    console.error('Prediction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
