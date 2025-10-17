
// DEPRECATED: This endpoint was for GoCardless access token. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Plaid credentials are configured via environment variables. See /superadmin/plaid for settings.'
    },
    { status: 410 } // 410 Gone
  )
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Plaid credentials are configured via environment variables. See /superadmin/plaid for settings.'
    },
    { status: 410 }
  )
}
