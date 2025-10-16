
// API: Switch display mode for current clinic
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DisplayMode } from '@prisma/client'

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
      activeDisplayMode: user.clinic.activeDisplayMode,
    })
  } catch (error: any) {
    console.error('Error fetching display mode:', error)
    return NextResponse.json(
      { error: 'Failed to fetch display mode' },
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

    // Only ADMIN can change display mode
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { displayMode } = body

    if (!displayMode || !['FULL', 'OPERATIONS', 'KIOSK', 'CAMPAIGNS'].includes(displayMode)) {
      return NextResponse.json({ error: 'Invalid display mode' }, { status: 400 })
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: { activeDisplayMode: displayMode as DisplayMode },
    })

    return NextResponse.json({
      success: true,
      activeDisplayMode: updatedClinic.activeDisplayMode,
    })
  } catch (error: any) {
    console.error('Error updating display mode:', error)
    return NextResponse.json(
      { error: 'Failed to update display mode' },
      { status: 500 }
    )
  }
}
