export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Forecast Analytics API - Simple linear trend forecasting
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
    const forecastDays = parseInt(searchParams.get('forecastDays') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get historical daily revenue and bookings - FILTERED BY CLINICID
    const historicalData = await prisma.booking.findMany({
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
        bookedAt: { gte: startDate },
        status: 'completed',
      },
      select: {
        bookedAt: true,
        price: true,
      },
      orderBy: {
        bookedAt: 'asc',
      },
    });

    // Group by day
    const dailyData = new Map<string, { revenue: number; bookings: number }>();
    
    historicalData.forEach((booking) => {
      const date = booking.bookedAt.toISOString().split('T')[0];
      const existing = dailyData.get(date) || { revenue: 0, bookings: 0 };
      dailyData.set(date, {
        revenue: existing.revenue + (Number(booking.price) || 0),
        bookings: existing.bookings + 1,
      });
    });

    // Convert to array and sort
    const dailyArray = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        bookings: data.bookings,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple linear regression for forecasting
    function linearRegression(data: number[]) {
      const n = data.length;
      const sumX = data.reduce((sum, _, i) => sum + i, 0);
      const sumY = data.reduce((sum, val) => sum + val, 0);
      const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
      const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return { slope, intercept };
    }

    // Calculate trends
    const revenueValues = dailyArray.map((d) => d.revenue);
    const bookingsValues = dailyArray.map((d) => d.bookings);

    const revenueTrend = linearRegression(revenueValues);
    const bookingsTrend = linearRegression(bookingsValues);

    // Generate forecast
    const lastDataPoint = dailyArray.length;
    const forecast = [];

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);

      const predictedRevenue = revenueTrend.slope * (lastDataPoint + i) + revenueTrend.intercept;
      const predictedBookings = bookingsTrend.slope * (lastDataPoint + i) + bookingsTrend.intercept;

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predictedRevenue: Math.max(0, Math.round(predictedRevenue)),
        predictedBookings: Math.max(0, Math.round(predictedBookings)),
      });
    }

    // Calculate growth rate
    const avgRevenueFirst7Days = dailyArray.slice(0, 7).reduce((sum, d) => sum + d.revenue, 0) / 7;
    const avgRevenueLast7Days = dailyArray.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / 7;
    const revenueGrowthRate = avgRevenueFirst7Days > 0 
      ? ((avgRevenueLast7Days - avgRevenueFirst7Days) / avgRevenueFirst7Days) * 100 
      : 0;

    const avgBookingsFirst7Days = dailyArray.slice(0, 7).reduce((sum, d) => sum + d.bookings, 0) / 7;
    const avgBookingsLast7Days = dailyArray.slice(-7).reduce((sum, d) => sum + d.bookings, 0) / 7;
    const bookingsGrowthRate = avgBookingsFirst7Days > 0 
      ? ((avgBookingsLast7Days - avgBookingsFirst7Days) / avgBookingsFirst7Days) * 100 
      : 0;

    // Total predicted revenue for forecast period
    const totalForecastRevenue = forecast.reduce((sum, f) => sum + f.predictedRevenue, 0);
    const totalForecastBookings = forecast.reduce((sum, f) => sum + f.predictedBookings, 0);

    // Confidence score (simplified - based on data consistency)
    const revenueStdDev = Math.sqrt(
      revenueValues.reduce((sum, val) => {
        const mean = revenueValues.reduce((s, v) => s + v, 0) / revenueValues.length;
        return sum + Math.pow(val - mean, 2);
      }, 0) / revenueValues.length
    );
    const revenueMean = revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length;
    const coefficientOfVariation = revenueMean > 0 ? (revenueStdDev / revenueMean) * 100 : 100;
    
    // Lower CV = higher confidence
    const confidenceScore = Math.max(0, Math.min(100, 100 - coefficientOfVariation));

    return NextResponse.json({
      success: true,
      data: {
        historical: dailyArray,
        forecast,
        summary: {
          totalForecastRevenue,
          totalForecastBookings,
          revenueGrowthRate: Math.round(revenueGrowthRate * 10) / 10,
          bookingsGrowthRate: Math.round(bookingsGrowthRate * 10) / 10,
          confidenceScore: Math.round(confidenceScore),
          trendDirection: revenueTrend.slope > 0 ? 'increasing' : 'decreasing',
        },
      },
    });
  } catch (error) {
    console.error('[API /analytics/forecast] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch forecast',
      },
      { status: 500 }
    );
  }
}
