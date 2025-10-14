export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Service Analytics API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Get clinicId from session for multi-tenant isolation
    const clinicId = (session.user as any).clinicId;
    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'No clinic associated with user' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get service performance metrics - FILTERED BY CLINICID
    const servicePerformance = await prisma.service.findMany({
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
      },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        duration: true,
        bookings: {
          where: {
            bookedAt: { gte: startDate },
            clinicId: clinicId, // SECURITY: Multi-tenant isolation
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
      const completedBookings = service.bookings.filter((b: any) => b.status === 'completed').length;
      const cancelledBookings = service.bookings.filter((b: any) => b.status === 'cancelled').length;
      const totalRevenue = service.bookings
        .filter((b: any) => b.status === 'completed')
        .reduce((sum: number, b: any) => sum + (Number(b.price) || 0), 0);
      
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

      // Calculate capacity utilization
      // Assuming 8-hour work day = 480 minutes
      const totalMinutesBooked = service.bookings
        .filter((b: any) => b.status === 'completed')
        .reduce((sum: number, b: any) => sum + (b.duration || service.duration || 0), 0);
      
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

    // Category breakdown - FILTERED BY CLINICID
    const categoryPerformance = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
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
    const totalRevenue = servicesWithMetrics.reduce((sum: number, s: any) => sum + s.totalRevenue, 0);
    const serviceOptimization = servicesWithMetrics.map((service) => {
      const revenueContribution = totalRevenue > 0 ? (service.totalRevenue / totalRevenue) * 100 : 0;
      
      let recommendation = '';
      
      // Priority 1: High performers
      if (revenueContribution > 25) {
        recommendation = 'Toppresterande tjänst! Överväg att utöka kapacitet eller lansera liknande tjänster för att maximera intäkterna.';
      } 
      // Priority 2: High cancellation
      else if (service.cancellationRate > 20) {
        recommendation = 'Hög avbokningsgrad. Undersök orsaker - kan vara pris, tillgänglighet eller kundkommunikation som behöver förbättras.';
      } 
      // Priority 3: Good revenue but low completion
      else if (service.totalRevenue > 0 && service.completionRate < 70) {
        recommendation = 'Bra intäktspotential men låg genomförandegrad. Förbättra påminnelser och kundengagemang för att minska no-shows.';
      }
      // Priority 4: Low capacity utilization
      else if (service.capacityUtilization < 40 && service.totalBookings > 0) {
        recommendation = 'Låg kapacitetsutnyttjande. Testa kampanjer, paketpriser eller rabatterbjudanden för att öka efterfrågan.';
      } 
      // Priority 5: No bookings
      else if (service.totalBookings === 0) {
        recommendation = 'Inga bokningar ännu. Utvärdera efterfrågan, marknadsföring och synlighet. Överväg att justera pris eller tjänstebeskrivning.';
      }
      // Priority 6: Medium performers that could be optimized
      else if (service.totalBookings > 5 && revenueContribution > 5 && revenueContribution < 15) {
        recommendation = 'Stabil tjänst med potential. Små justeringar i pris eller marknadsföring kan ge stor effekt på intäkterna.';
      }
      // Priority 7: Low average booking value
      else if (service.totalBookings > 0 && service.averageBookingValue < 500) {
        recommendation = 'Lågt genomsnittsvärde per bokning. Överväg att höja priset eller erbjuda premium-alternativ för högre intäkter.';
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
