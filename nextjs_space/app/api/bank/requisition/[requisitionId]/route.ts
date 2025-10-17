
// DEPRECATED: This endpoint was for GoCardless requisitions. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { requisitionId: string } }
) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Use Plaid Link to manage bank connections. Visit /settings/bank.'
    },
    { status: 410 } // 410 Gone
  )
}
