/**
 * Clinic Display Mode API
 *
 * GET  /api/clinic/display-mode  — Returns the current activeDisplayMode and tier
 * PUT  /api/clinic/display-mode  — Updates activeDisplayMode (ADMIN / SUPER_ADMIN only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DisplayMode } from '@prisma/client'

const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN']

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        id: true,
        activeDisplayMode: true,
        tier: true,
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    return NextResponse.json({
      activeDisplayMode: clinic.activeDisplayMode,
      tier: clinic.tier,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[display-mode] GET error:', message)
    return NextResponse.json(
      { error: 'Failed to fetch display mode' },
      { status: 500 }
    )
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.user.role as string
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden: only ADMIN or SUPER_ADMIN can change display mode' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { mode } = body as { mode?: string }

    if (!mode || !Object.values(DisplayMode).includes(mode as DisplayMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${Object.values(DisplayMode).join(', ')}` },
        { status: 400 }
      )
    }

    const updated = await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: { activeDisplayMode: mode as DisplayMode },
      select: {
        id: true,
        activeDisplayMode: true,
        tier: true,
      },
    })

    return NextResponse.json({
      activeDisplayMode: updated.activeDisplayMode,
      tier: updated.tier,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[display-mode] PUT error:', message)
    return NextResponse.json(
      { error: 'Failed to update display mode' },
      { status: 500 }
    )
  }
}
