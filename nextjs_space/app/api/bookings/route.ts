
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // SECURITY: Get clinicId from session for multi-tenant isolation
    const clinicId = (session.user as any).clinicId;
    if (!clinicId) {
      return NextResponse.json(
        { error: 'No clinic associated with user' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // SECURITY: Always filter by clinicId from session
    const where: any = { clinicId }
    
    if (status) {
      where.status = status
    }
    
    if (startDate && endDate) {
      where.scheduledTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        staff: {
          select: {
            name: true,
            specialization: true
          }
        },
        room: {
          select: {
            name: true,
            equipmentType: true
          }
        }
      },
      orderBy: {
        scheduledTime: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.booking.count({ where })

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Bookings API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      customerId, 
      staffId, 
      roomId, 
      treatmentType, 
      scheduledTime, 
      duration, 
      price, 
      bookingChannel,
      notes 
    } = body

    const booking = await prisma.booking.create({
      data: {
        customerId,
        staffId,
        roomId,
        treatmentType,
        scheduledTime: new Date(scheduledTime),
        duration,
        price,
        bookingChannel,
        bookedAt: new Date(),
        notes
      },
      include: {
        customer: true,
        staff: true,
        room: true
      }
    })

    // Update customer stats
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalBookings: {
          increment: 1
        }
      }
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
