

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const staff = await prisma.staff.findMany({
      where: { clinicId: session.user.clinicId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, role, email, phone, weeklyHours } = body

    if (!name || !role) {
      return NextResponse.json(
        { success: false, message: 'Name and role are required' },
        { status: 400 }
      )
    }

    const staff = await prisma.staff.create({
      data: {
        clinicId: session.user.clinicId,
        name,
        role,
        email,
        phone,
        weeklyHours: weeklyHours || null,
      },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

