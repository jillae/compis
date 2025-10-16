
// API: Configure GoCardless access token (SA only)
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Only SUPER_ADMIN can view token status (not the actual token)
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      gocardlessEnabled: user.clinic.gocardlessEnabled,
      hasAccessToken: !!user.clinic.gocardlessAccessToken,
    })
  } catch (error: any) {
    console.error('Error fetching GoCardless config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    )
  }
}

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

    // Only SUPER_ADMIN can configure GoCardless
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { accessToken, enabled } = body

    const updateData: any = {}

    if (accessToken !== undefined) {
      updateData.gocardlessAccessToken = accessToken
    }

    if (enabled !== undefined) {
      updateData.gocardlessEnabled = enabled
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      gocardlessEnabled: updatedClinic.gocardlessEnabled,
      hasAccessToken: !!updatedClinic.gocardlessAccessToken,
    })
  } catch (error: any) {
    console.error('Error updating GoCardless config:', error)
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    )
  }
}
