
// DEPRECATED: This endpoint was for GoCardless callback. Use Plaid instead.
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. GoCardless integration has been replaced with Plaid.',
      message: 'Please use Plaid Link for bank connections. Visit /settings/bank.'
    },
    { status: 410 } // 410 Gone
  )
}
