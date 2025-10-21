
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { subMonths, addMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { getAuthSession, getClinicFilter, unauthorizedResponse, errorResponse } from '@/lib/multi-tenant-security';

export const dynamic = 'force-dynamic';

interface SimulatorParams {
  bookingsPerDay?: number;
  avgBookingValue?: number;
  newCustomersPerMonth?: number;
  retentionRate?: number;
  noShowRate?: number;
}

export async function POST(req: NextRequest) {
  try {
    // 🔒 Authentication & Multi-tenant Security
    const session = await getAuthSession();
    const clinicFilter = getClinicFilter(session);

    const params: SimulatorParams = await req.json();

    // Get historical data for baseline (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6);
    
    const [
      historicalBookings,
      totalCustomers,
      completedBookings,
      noShows
    ] = await Promise.all([
      prisma.booking.findMany({
        where: {
          ...clinicFilter,
          startTime: {
            gte: sixMonthsAgo,
          },
          status: {
            not: 'cancelled',
          },
        },
        select: {
          startTime: true,
          price: true,
          status: true,
        },
      }),
      prisma.customer.count({ where: clinicFilter }),
      prisma.booking.count({
        where: {
          ...clinicFilter,
          startTime: { gte: sixMonthsAgo },
          status: 'completed',
        },
      }),
      prisma.booking.count({
        where: {
          ...clinicFilter,
          startTime: { gte: sixMonthsAgo },
          status: 'no_show',
        },
      }),
    ]);

    // Calculate current metrics
    const totalBookings = historicalBookings.length;
    const daysSinceStart = Math.ceil((new Date().getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
    const currentBookingsPerDay = totalBookings / daysSinceStart;
    
    // Calculate average value (use a default if we don't have price data)
    const totalRevenue = historicalBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
    const bookingsWithPrice = historicalBookings.filter((b: any) => b.price && b.price > 0).length;
    const currentAvgValue = bookingsWithPrice > 0 
      ? totalRevenue / bookingsWithPrice 
      : 850; // Default average value for beauty/health clinics in SEK
    
    const currentNoShowRate = totalBookings > 0 ? (noShows / totalBookings) * 100 : 0;

    // Get monthly breakdown for historical trend
    const monthlyData = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: new Date(),
    }).map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthBookings = historicalBookings.filter((b: any) => {
        const bookingDate = new Date(b.startTime);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      const revenue = monthBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
      
      return {
        month: format(month, 'MMM yyyy'),
        bookings: monthBookings.length,
        revenue: revenue,
      };
    });

    // Use provided params or fall back to current metrics
    const targetBookingsPerDay = params.bookingsPerDay ?? currentBookingsPerDay;
    const targetAvgValue = params.avgBookingValue ?? currentAvgValue;
    const targetNoShowRate = params.noShowRate ?? currentNoShowRate;
    const targetNewCustomers = params.newCustomersPerMonth ?? (Math.ceil(totalCustomers / 6) || 20);
    const targetRetention = params.retentionRate ?? 70;

    // Safety check: ensure targetAvgValue is valid
    const safeAvgValue = isNaN(targetAvgValue) || targetAvgValue <= 0 ? 850 : targetAvgValue;
    const safeBaselineAvgValue = isNaN(currentAvgValue) || currentAvgValue <= 0 ? 850 : currentAvgValue;

    // Calculate 12-month projections
    const projections = eachMonthOfInterval({
      start: new Date(),
      end: addMonths(new Date(), 12),
    }).map((month, index) => {
      // Days in month
      const daysInMonth = Math.ceil((endOfMonth(month).getTime() - startOfMonth(month).getTime()) / (1000 * 60 * 60 * 24));
      
      // Projected bookings (accounting for no-shows)
      const projectedBookings = Math.round(targetBookingsPerDay * daysInMonth * (1 - targetNoShowRate / 100));
      
      // Projected revenue (use safe value)
      const projectedRevenue = Math.round(projectedBookings * safeAvgValue);
      
      // Growth effect (if we're improving metrics over time)
      const growthMultiplier = 1 + (index * 0.02); // 2% compound growth per month
      
      return {
        month: format(month, 'MMM yyyy'),
        bookings: Math.round(projectedBookings * Math.min(growthMultiplier, 1.24)), // Cap at 24% growth
        revenue: Math.round(projectedRevenue * Math.min(growthMultiplier, 1.24)),
      };
    });

    // Calculate baseline (if we continue current trajectory)
    const baselineProjections = eachMonthOfInterval({
      start: new Date(),
      end: addMonths(new Date(), 12),
    }).map((month) => {
      const daysInMonth = Math.ceil((endOfMonth(month).getTime() - startOfMonth(month).getTime()) / (1000 * 60 * 60 * 24));
      const baselineBookings = Math.round(currentBookingsPerDay * daysInMonth * (1 - currentNoShowRate / 100));
      const baselineRevenue = Math.round(baselineBookings * safeBaselineAvgValue);
      
      return {
        month: format(month, 'MMM yyyy'),
        bookings: baselineBookings,
        revenue: baselineRevenue,
      };
    });

    // Calculate totals
    const totalProjectedRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
    const totalBaselineRevenue = baselineProjections.reduce((sum, p) => sum + p.revenue, 0);
    const potentialGain = totalProjectedRevenue - totalBaselineRevenue;

    return NextResponse.json({
      currentMetrics: {
        bookingsPerDay: currentBookingsPerDay.toFixed(1),
        avgBookingValue: safeBaselineAvgValue.toFixed(0),
        noShowRate: currentNoShowRate.toFixed(1),
        customersPerMonth: Math.ceil(totalCustomers / 6) || 20,
      },
      historical: monthlyData,
      baseline: baselineProjections,
      optimized: projections,
      summary: {
        totalProjectedRevenue,
        totalBaselineRevenue,
        potentialGain,
        percentageIncrease: ((potentialGain / totalBaselineRevenue) * 100).toFixed(1),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to calculate projections');
  }
}
