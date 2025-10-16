
// API: Save GoCardless Access Token for clinic

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Only ADMIN or SUPER_ADMIN can configure
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { accessToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    // Update clinic with GoCardless configuration
    const updatedClinic = await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: {
        gocardlessAccessToken: accessToken,
        gocardlessEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'GoCardless access token saved',
    })
  } catch (error: any) {
    console.error('Error saving access token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save access token' },
      { status: 500 }
    )
  }
}

// GET: Check if access token is configured
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

    return NextResponse.json({
      configured: !!user.clinic.gocardlessAccessToken,
      enabled: user.clinic.gocardlessEnabled,
    })
  } catch (error: any) {
    console.error('Error checking access token:', error)
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    )
  }
}
