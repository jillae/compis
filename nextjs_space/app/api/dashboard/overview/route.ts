
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause = clinicId ? { clinicId } : {};

    // Get total bookings
    const totalBookings = await prisma.booking.count({
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get completed bookings
    const completedBookings = await prisma.booking.count({
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['completed', 'COMPLETED'] },
      },
    });

    // Get cancelled bookings
    const cancelledBookings = await prisma.booking.count({
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['cancelled', 'CANCELLED'] },
      },
    });

    // Get no-show bookings
    const noShowBookings = await prisma.booking.count({
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['no_show', 'NO_SHOW'] },
      },
    });

    // Calculate total revenue
    const bookingsWithRevenue = await prisma.booking.aggregate({
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['completed', 'COMPLETED'] },
      },
      _sum: {
        price: true,
      },
    });

    const totalRevenue = bookingsWithRevenue._sum.price || 0;

    // Get online booking percentage
    const onlineBookings = await prisma.booking.count({
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        isOnlineBooking: true,
      },
    });

    const onlineBookingPercentage = totalBookings > 0
      ? Math.round((onlineBookings / totalBookings) * 100)
      : 0;

    // Get top services
    const topServices = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        serviceId: { not: null },
      },
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Enrich top services with service details
    const topServicesWithDetails = await Promise.all(
      topServices.map(async (service: any) => {
        const serviceDetails = await prisma.service.findUnique({
          where: { id: service.serviceId! },
          select: { name: true, category: true },
        });
        return {
          ...service,
          ...serviceDetails,
        };
      })
    );

    // Get bookings per day for chart
    const bookingsPerDay = await prisma.booking.groupBy({
      by: ['scheduledTime'],
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Group by date (without time)
    const bookingsByDate = bookingsPerDay.reduce((acc: any, booking: any) => {
      const date = booking.scheduledTime.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += booking._count.id;
      return acc;
    }, {});

    const bookingsTrend = Object.entries(bookingsByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // Get staff performance
    const staffPerformance = await prisma.booking.groupBy({
      by: ['staffId'],
      where: {
        ...whereClause,
        scheduledTime: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['completed', 'COMPLETED'] },
        staffId: { not: null },
      },
      _count: {
        id: true,
      },
      _sum: {
        price: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 10,
    });

    // Enrich staff performance with staff details
    const staffPerformanceWithDetails = await Promise.all(
      staffPerformance.map(async (staff: any) => {
        const staffDetails = await prisma.staff.findUnique({
          where: { id: staff.staffId! },
          select: { name: true, role: true },
        });
        return {
          ...staff,
          ...staffDetails,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          completedBookings,
          cancelledBookings,
          noShowBookings,
          totalRevenue: Number(totalRevenue),
          onlineBookingPercentage,
          completionRate: totalBookings > 0
            ? Math.round((completedBookings / totalBookings) * 100)
            : 0,
          cancellationRate: totalBookings > 0
            ? Math.round((cancelledBookings / totalBookings) * 100)
            : 0,
          noShowRate: totalBookings > 0
            ? Math.round((noShowBookings / totalBookings) * 100)
            : 0,
        },
        topServices: topServicesWithDetails,
        bookingsTrend,
        staffPerformance: staffPerformanceWithDetails,
      },
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
