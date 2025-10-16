
// API: Configure module visibility per display mode (ADMIN only)
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

    const configs = await prisma.displayModeConfig.findMany({
      where: { clinicId: user.clinic.id },
      orderBy: [{ displayMode: 'asc' }, { moduleKey: 'asc' }],
    })

    return NextResponse.json({ configs })
  } catch (error: any) {
    console.error('Error fetching display mode config:', error)
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

    // Only ADMIN can configure display modes
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { displayMode, moduleKey, isVisibleToStaff, isVisibleToAdmin } = body

    if (!displayMode || !moduleKey) {
      return NextResponse.json(
        { error: 'Missing displayMode or moduleKey' },
        { status: 400 }
      )
    }

    const config = await prisma.displayModeConfig.upsert({
      where: {
        clinicId_displayMode_moduleKey: {
          clinicId: user.clinic.id,
          displayMode: displayMode as DisplayMode,
          moduleKey,
        },
      },
      update: {
        isVisibleToStaff: isVisibleToStaff ?? true,
        isVisibleToAdmin: isVisibleToAdmin ?? true,
      },
      create: {
        clinicId: user.clinic.id,
        displayMode: displayMode as DisplayMode,
        moduleKey,
        isVisibleToStaff: isVisibleToStaff ?? true,
        isVisibleToAdmin: isVisibleToAdmin ?? true,
      },
    })

    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    console.error('Error updating display mode config:', error)
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    )
  }
}
