
// DEPRECATED: This endpoint was for GoCardless settings. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Use /api/settings/plaid for Plaid settings instead.'
    },
    { status: 410 } // 410 Gone
  )
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Use /api/settings/plaid for Plaid settings instead.'
    },
    { status: 410 }
  )
}
