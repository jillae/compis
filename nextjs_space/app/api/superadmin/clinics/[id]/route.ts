
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            bookings: true,
            services: true,
            staff: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        bookings: {
          select: {
            id: true,
            revenue: true,
            status: true,
            startTime: true,
          },
          orderBy: {
            startTime: 'desc'
          },
          take: 10 // Latest 10 bookings
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
          },
          take: 10
        }
      }
    });

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Calculate revenue stats
    const allBookings = await prisma.booking.findMany({
      where: { clinicId: params.id },
      select: { revenue: true }
    });
    
    const totalRevenue = allBookings.reduce((sum, b) => sum + Number(b.revenue), 0);

    return NextResponse.json({
      ...clinic,
      totalRevenue,
    });
  } catch (error) {
    console.error('Error fetching clinic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const clinic = await prisma.clinic.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        phone: body.phone,
        email: body.email,
        website: body.website,
        tier: body.tier,
        subscriptionStatus: body.subscriptionStatus,
        isActive: body.isActive,
        bokadirektEnabled: body.bokadirektEnabled,
        metaEnabled: body.metaEnabled,
        corexEnabled: body.corexEnabled,
        dynamicPricingEnabled: body.dynamicPricingEnabled,
        retentionAutopilotEnabled: body.retentionAutopilotEnabled,
        aiActionsEnabled: body.aiActionsEnabled,
      }
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Error updating clinic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.clinic.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
