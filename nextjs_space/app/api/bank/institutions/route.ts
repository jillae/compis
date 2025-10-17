
// DEPRECATED: This endpoint was for GoCardless institutions. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Plaid automatically handles bank selection. Use Plaid Link to connect. Visit /settings/bank.'
    },
    { status: 410 } // 410 Gone
  )
}
