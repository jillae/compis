export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily revenue trend
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledTime: { gte: startDate, lte: endDate },
        status: { in: ['completed', 'COMPLETED'] },
      },
      select: {
        scheduledTime: true,
        price: true,
      },
    });

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    const dailyBookings: Record<string, number> = {};
    
    bookings.forEach((booking) => {
      const date = booking.scheduledTime.toISOString().split('T')[0];
      const price = booking.price ? Number(booking.price) : 0;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + price;
      dailyBookings[date] = (dailyBookings[date] || 0) + 1;
    });

    // Create sorted array
    const revenueTrend = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue),
        bookings: dailyBookings[date] || 0,
      }));

    // Get hourly booking pattern
    const allBookings = await prisma.booking.findMany({
      where: {
        scheduledTime: { gte: startDate, lte: endDate },
      },
      select: {
        scheduledTime: true,
      },
    });

    const hourlyPattern: Record<number, number> = {};
    allBookings.forEach((booking) => {
      const hour = new Date(booking.scheduledTime).getHours();
      hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
    });

    const bookingPattern = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      bookings: hourlyPattern[hour] || 0,
    }));

    // Get weekday distribution
    const weekdayPattern: Record<number, { bookings: number; revenue: number }> = {};
    bookings.forEach((booking) => {
      const weekday = new Date(booking.scheduledTime).getDay();
      const price = booking.price ? Number(booking.price) : 0;
      if (!weekdayPattern[weekday]) {
        weekdayPattern[weekday] = { bookings: 0, revenue: 0 };
      }
      weekdayPattern[weekday].bookings += 1;
      weekdayPattern[weekday].revenue += price;
    });

    const weekdayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    const weekdayDistribution = Array.from({ length: 7 }, (_, day) => ({
      day: weekdayNames[day],
      bookings: weekdayPattern[day]?.bookings || 0,
      revenue: Math.round(weekdayPattern[day]?.revenue || 0),
    }));

    // Get service category breakdown
    const serviceBookings = await prisma.booking.findMany({
      where: {
        scheduledTime: { gte: startDate, lte: endDate },
        status: { in: ['completed', 'COMPLETED'] },
        serviceId: { not: null },
      },
      include: {
        service: {
          select: {
            category: true,
          },
        },
      },
    });

    const categoryStats: Record<string, { bookings: number; revenue: number }> = {};
    serviceBookings.forEach((booking) => {
      const category = booking.service?.category || 'Other';
      const price = booking.price ? Number(booking.price) : 0;
      if (!categoryStats[category]) {
        categoryStats[category] = { bookings: 0, revenue: 0 };
      }
      categoryStats[category].bookings += 1;
      categoryStats[category].revenue += price;
    });

    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      bookings: stats.bookings,
      revenue: Math.round(stats.revenue),
    }));

    return NextResponse.json({
      success: true,
      data: {
        revenueTrend,
        bookingPattern,
        weekdayDistribution,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
