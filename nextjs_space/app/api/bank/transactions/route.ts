
// DEPRECATED: This endpoint was for GoCardless transactions. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Use /api/bank/plaid/transactions instead.',
      message: 'Plaid provides better transaction data. Use /api/bank/plaid endpoints.'
    },
    { status: 410 } // 410 Gone
  )
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Use /api/bank/plaid/sync instead.',
      message: 'Plaid provides better transaction syncing. Use /api/bank/plaid/sync.'
    },
    { status: 410 }
  )
}
