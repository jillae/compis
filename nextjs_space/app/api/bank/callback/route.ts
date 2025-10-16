
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
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings/bank?error=missing_ref`)
    }

    // Find the requisition in database
    const connection = await prisma.bankConnection.findUnique({
      where: { requisitionId: ref },
      include: { clinic: true },
    })

    if (!connection) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/bank?error=connection_not_found`
      )
    }

    if (!connection.clinic.gocardlessAccessToken) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/settings/bank?error=no_token`
      )
    }

    const client = new GoCardlessClient(connection.clinic.gocardlessAccessToken)

    // Get updated requisition with account IDs
    const requisition = await client.getRequisition(ref)

    // Update connection with account IDs
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        accountIds: requisition.accounts,
        status: 'ACTIVE',
      },
    })

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/bank?success=connected`
    )
  } catch (error: any) {
    console.error('Error handling bank callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/bank?error=callback_failed`
    )
  }
}
