

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify staff belongs to clinic
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    })

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, message: 'Staff not found' },
        { status: 404 }
      )
    }

    const staff = await prisma.staff.update({
      where: { id: params.id },
      data: {
        name,
        role,
        email,
        phone,
        weeklyHours,
      },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.clinicId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify staff belongs to clinic
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    })

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, message: 'Staff not found' },
        { status: 404 }
      )
    }

    await prisma.staff.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

