
// API: Initialize bank connection with GoCardless
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GoCardlessClient from '@/lib/integrations/gocardless-client'

export async function POST(req: NextRequest) {
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

    // Only SA or ADMIN can connect bank
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { institutionId } = body

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID required' },
        { status: 400 }
      )
    }

    // Check if GoCardless is enabled and has access token
    if (!user.clinic.gocardlessEnabled || !user.clinic.gocardlessAccessToken) {
      return NextResponse.json(
        { error: 'GoCardless not configured. Please add access token in settings.' },
        { status: 400 }
      )
    }

    const client = new GoCardlessClient(user.clinic.gocardlessAccessToken)

    // Step 2: Create requisition with proper redirect URL
    // Redirect URL: User returns here after bank authorization
    const redirectUrl = `${process.env.NEXTAUTH_URL}/api/bank/callback`
    const reference = `clinic_${user.clinic.id}_${Date.now()}`

    const requisition = await client.createRequisition({
      institutionId,
      redirectUrl,
      reference,
    })

    // Save requisition to database
    const bankConnection = await prisma.bankConnection.create({
      data: {
        clinicId: user.clinic.id,
        requisitionId: requisition.id,
        institutionId,
        institutionName: institutionId, // Will be updated later
        status: 'PENDING',
        redirectUrl,
        reference,
        agreementId: requisition.agreement,
      },
    })

    return NextResponse.json({
      success: true,
      bankConnection,
      authLink: requisition.link, // User should be redirected here
    })
  } catch (error: any) {
    console.error('Error connecting bank:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect bank' },
      { status: 500 }
    )
  }
}

// GET: Check bank connection status
export async function GET(req: NextRequest) {
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

    const connections = await prisma.bankConnection.findMany({
      where: { clinicId: user.clinic.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ connections })
  } catch (error: any) {
    console.error('Error fetching bank connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    )
  }
}
