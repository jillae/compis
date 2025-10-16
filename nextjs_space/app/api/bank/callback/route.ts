
// API: Handle GoCardless callback after user authorization
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GoCardlessClient from '@/lib/integrations/gocardless-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ref = searchParams.get('ref') // requisition ID

    if (!ref) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings/bank/callback?error=missing_ref`)
    }

    // Find the requisition in database
    const connection = await prisma.bankConnection.findUnique({
      where: { requisitionId: ref },
      include: { clinic: true },
    })

    if (!connection) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/bank/callback?error=connection_not_found`
      )
    }

    if (!connection.clinic.gocardlessAccessToken) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/bank/callback?error=no_token`
      )
    }

    const client = new GoCardlessClient(connection.clinic.gocardlessAccessToken)

    // Step 6: Get updated requisition with account IDs
    const requisition = await client.getRequisition(ref)

    // Step 7: Extract account_id from response.accounts[0].id
    const accountIds = requisition.accounts || []
    
    if (accountIds.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/bank/callback?error=no_accounts`
      )
    }

    // Update connection with account IDs and mark as ACTIVE
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        accountIds,
        status: 'ACTIVE',
      },
    })

    // Step 8: Flow complete - redirect with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/bank/callback?ref=${ref}&success=connected`
    )
  } catch (error: any) {
    console.error('Error handling bank callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/bank/callback?error=callback_failed`
    )
  }
}
