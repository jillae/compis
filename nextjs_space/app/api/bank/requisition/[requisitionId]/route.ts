
// API: Get requisition details by ID

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GoCardlessClient from '@/lib/integrations/gocardless-client'

export async function GET(
  req: NextRequest,
  { params }: { params: { requisitionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    })

    if (!user?.clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    const { requisitionId } = params

    // Find requisition in database
    const connection = await prisma.bankConnection.findUnique({
      where: { requisitionId },
      include: { clinic: true },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Requisition not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (connection.clinicId !== user.clinic.id && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!connection.clinic.gocardlessAccessToken) {
      return NextResponse.json(
        { error: 'GoCardless not configured' },
        { status: 400 }
      )
    }

    // Fetch latest data from GoCardless
    const client = new GoCardlessClient(connection.clinic.gocardlessAccessToken)
    const requisition = await client.getRequisition(requisitionId)

    // Update database if accounts are now available
    if (requisition.accounts.length > 0 && connection.status === 'PENDING') {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          accountIds: requisition.accounts,
          status: 'ACTIVE',
        },
      })
    }

    return NextResponse.json({
      ...connection,
      accountIds: requisition.accounts,
      requisitionStatus: requisition.status,
    })
  } catch (error: any) {
    console.error('Error fetching requisition:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requisition' },
      { status: 500 }
    )
  }
}
