
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Service Analytics API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get service performance metrics
    const servicePerformance = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        duration: true,
        bookings: {
          where: {
            bookedAt: { gte: startDate },
          },
          select: {
            id: true,
            status: true,
            price: true,
            duration: true,
            bookedAt: true,
          },
        },
      },
    });

    // Calculate metrics for each service
    const servicesWithMetrics = servicePerformance.map((service) => {
      const totalBookings = service.bookings.length;
      const completedBookings = service.bookings.filter((b) => b.status === 'completed').length;
      const cancelledBookings = service.bookings.filter((b) => b.status === 'cancelled').length;
      const totalRevenue = service.bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

      // Calculate capacity utilization
      // Assuming 8-hour work day = 480 minutes
      const totalMinutesBooked = service.bookings
        .filter((b) => b.status === 'completed')
        .reduce((sum, b) => sum + (b.duration || service.duration || 0), 0);
      
      const availableMinutes = days * 480; // days * 8 hours * 60 minutes
      const capacityUtilization = (totalMinutesBooked / availableMinutes) * 100;

      return {
        id: service.id,
        name: service.name,
        category: service.category,
        price: service.price,
        duration: service.duration,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        completionRate: Math.round(completionRate * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        averageBookingValue: Math.round(averageBookingValue),
        capacityUtilization: Math.round(capacityUtilization * 10) / 10,
      };
    });

    // Sort by revenue
    const topPerformers = [...servicesWithMetrics]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Sort by lowest performance (need improvement)
    const underperformers = [...servicesWithMetrics]
      .filter((s) => s.totalBookings > 0)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5);

    // Category breakdown
    const categoryPerformance = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        bookedAt: { gte: startDate },
        status: 'completed',
      },
      _sum: {
        price: true,
      },
      _count: {
        id: true,
      },
    });

    const categoriesMap = new Map<string, { revenue: number; bookings: number }>();
    
    for (const booking of categoryPerformance) {
      if (!booking.serviceId) continue;
      
      const service = await prisma.service.findUnique({
        where: { id: booking.serviceId },
        select: { category: true },
      });
      
      if (service) {
        const existing = categoriesMap.get(service.category) || { revenue: 0, bookings: 0 };
        categoriesMap.set(service.category, {
          revenue: existing.revenue + (Number(booking._sum.price) || 0),
          bookings: existing.bookings + booking._count.id,
        });
      }
    }

    const categoryBreakdown = Array.from(categoriesMap.entries()).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      bookings: data.bookings,
      averageValue: Math.round(data.revenue / data.bookings),
    }));

    // Service mix optimization suggestions
    const totalRevenue = servicesWithMetrics.reduce((sum, s) => sum + s.totalRevenue, 0);
    const serviceOptimization = servicesWithMetrics.map((service) => {
      const revenueContribution = totalRevenue > 0 ? (service.totalRevenue / totalRevenue) * 100 : 0;
      
      let recommendation = '';
      if (revenueContribution > 30) {
        recommendation = 'High performer - consider expanding capacity or similar services';
      } else if (service.cancellationRate > 25) {
        recommendation = 'High cancellation rate - investigate reasons and improve';
      } else if (service.capacityUtilization < 30 && service.totalBookings > 0) {
        recommendation = 'Low utilization - consider promotions or bundling';
      } else if (service.totalBookings === 0) {
        recommendation = 'No bookings - evaluate demand and marketing';
      }

      return {
        ...service,
        revenueContribution: Math.round(revenueContribution * 10) / 10,
        recommendation,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        allServices: servicesWithMetrics,
        topPerformers,
        underperformers,
        categoryBreakdown,
        optimization: serviceOptimization.filter((s) => s.recommendation),
      },
    });
  } catch (error) {
    console.error('[API /analytics/services] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch service analytics',
      },
      { status: 500 }
    );
  }
}
