
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        hasCompletedProductTour: true,
        isBetaUser: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching tour status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour status' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { hasCompletedProductTour: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating tour status:', error)
    return NextResponse.json(
      { error: 'Failed to update tour status' },
      { status: 500 }
    )
  }
}
