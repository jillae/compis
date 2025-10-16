
// Diagnostic endpoint to fix clinic association
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    })

    // Get all clinics
    const allClinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
      },
    })

    // Get Arch Clinic
    const archClinic = await prisma.clinic.findFirst({
      where: {
        OR: [
          { name: { contains: 'Arch', mode: 'insensitive' } },
          { id: 'arch-clinic' },
        ],
      },
    })

    return NextResponse.json({
      currentUser: {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        clinicId: user?.clinicId,
        clinicName: user?.clinic?.name,
      },
      archClinic: archClinic ? {
        id: archClinic.id,
        name: archClinic.name,
        tier: archClinic.tier,
      } : null,
      allClinics,
    })
  } catch (error: any) {
    console.error('Error checking clinic:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Find or create Arch Clinic
    let archClinic = await prisma.clinic.findFirst({
      where: {
        OR: [
          { name: { contains: 'Arch', mode: 'insensitive' } },
          { id: 'arch-clinic' },
        ],
      },
    })

    if (!archClinic) {
      // Create Arch Clinic
      archClinic = await prisma.clinic.create({
        data: {
          id: 'arch-clinic',
          name: 'Arch Clinic',
          tier: 'INTERNAL',
        },
      })
    }

    // Associate user with Arch Clinic and make them SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        clinicId: archClinic.id,
        role: 'SUPER_ADMIN',
      },
      include: { clinic: true },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        clinicId: updatedUser.clinicId,
        clinicName: updatedUser.clinic?.name,
      },
    })
  } catch (error: any) {
    console.error('Error fixing clinic:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
