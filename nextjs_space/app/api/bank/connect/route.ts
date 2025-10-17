
// DEPRECATED: This endpoint was for GoCardless. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid. Please use /api/bank/plaid endpoints instead.',
      message: 'Use Plaid Link to connect bank accounts. Visit /settings/bank to connect via Plaid.'
    },
    { status: 410 } // 410 Gone
  )
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid. Please use /api/bank/plaid endpoints instead.',
      message: 'Use Plaid Link to connect bank accounts. Visit /settings/bank to connect via Plaid.'
    },
    { status: 410 }
  )
}
