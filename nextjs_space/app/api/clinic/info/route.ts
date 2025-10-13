
/**
 * Clinic Info API
 * Returns basic clinic information for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        id: true,
        name: true,
        tier: true,
        subscriptionStatus: true,
        bokadirektEnabled: true,
        metaEnabled: true,
      },
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    return NextResponse.json(clinic)
  } catch (error: any) {
    console.error('Clinic info API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clinic info' },
      { status: 500 }
    )
  }
}
