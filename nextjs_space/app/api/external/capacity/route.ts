/**
 * Flow External API — Capacity Data for Marknadscentral
 * 
 * GET /api/external/capacity?clinicId=xxx&weeks=2
 * 
 * Returns current week + future weeks capacity data.
 * Marknadscentral uses this to show when the clinic is underbooked
 * and should trigger marketing campaigns.
 * 
 * Auth: X-FLOW-API-KEY header
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-FLOW-API-KEY, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-FLOW-API-KEY');
  const validKey = process.env.FLOW_EXTERNAL_API_KEY;
  if (!validKey || !apiKey) return false;
  return apiKey === validKey;
}

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const weeksAhead = Math.min(8, parseInt(searchParams.get('weeks') || '2'));

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    // Week start (Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() + mondayOffset);

    // End of forecast period
    const forecastEnd = new Date(weekStart);
    forecastEnd.setDate(forecastEnd.getDate() + weeksAhead * 7);
    forecastEnd.setHours(23, 59, 59, 999);

    // Active staff count for capacity calculation
    const activeStaff = await prisma.staff.count({
      where: { clinicId, isActive: true },
    });
    const slotsPerStaffPerDay = 8;
    const totalSlotsPerDay = activeStaff * slotsPerStaffPerDay;

    // All bookings in the forecast period (excluding cancelled)
    const bookings = await prisma.booking.findMany({
      where: {
        clinicId,
        scheduledTime: { gte: weekStart, lte: forecastEnd },
        status: { notIn: ['CANCELLED', 'cancelled'] },
      },
      select: { scheduledTime: true },
    });

    // Group by date
    const bookingsByDate = new Map<string, number>();
    for (const b of bookings) {
      const dateKey = b.scheduledTime.toISOString().split('T')[0];
      bookingsByDate.set(dateKey, (bookingsByDate.get(dateKey) || 0) + 1);
    }

    // Build weekly data
    const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    const weeks = [];

    for (let w = 0; w < weeksAhead; w++) {
      const wStart = new Date(weekStart);
      wStart.setDate(wStart.getDate() + w * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 4); // Mon-Fri

      const days = [];
      let weekBooked = 0;
      let weekTotal = 0;

      for (let d = 0; d < 5; d++) {
        const date = new Date(wStart);
        date.setDate(date.getDate() + d);
        const dateKey = date.toISOString().split('T')[0];
        const booked = bookingsByDate.get(dateKey) || 0;
        const pct = totalSlotsPerDay > 0 ? Math.round((booked / totalSlotsPerDay) * 100) : 0;

        weekBooked += booked;
        weekTotal += totalSlotsPerDay;

        days.push({
          date: dateKey,
          dayName: dayNames[date.getDay()],
          booked,
          total: totalSlotsPerDay,
          utilization: Math.min(100, pct),
          available: Math.max(0, totalSlotsPerDay - booked),
          status: pct >= 95 ? 'FULL' : pct >= 75 ? 'GOOD' : pct >= 50 ? 'MEDIUM' : 'LOW',
          isPast: date < todayStart,
        });
      }

      const weekPct = weekTotal > 0 ? Math.round((weekBooked / weekTotal) * 100) : 0;

      weeks.push({
        weekNumber: getISOWeek(wStart),
        startDate: wStart.toISOString().split('T')[0],
        endDate: wEnd.toISOString().split('T')[0],
        booked: weekBooked,
        total: weekTotal,
        utilization: Math.min(100, weekPct),
        available: Math.max(0, weekTotal - weekBooked),
        days,
      });
    }

    // Today's snapshot
    const todayKey = todayStart.toISOString().split('T')[0];
    const todayBooked = bookingsByDate.get(todayKey) || 0;

    // Marketing signals: days needing campaigns
    const lowDays = [];
    for (const week of weeks) {
      for (const day of week.days) {
        if (!day.isPast && day.utilization < 50) {
          lowDays.push({ date: day.date, dayName: day.dayName, utilization: day.utilization, available: day.available });
        }
      }
    }

    const response = {
      success: true,
      generatedAt: now.toISOString(),
      clinic: { id: clinic.id, name: clinic.name },
      staffCount: activeStaff,
      slotsPerDay: totalSlotsPerDay,
      today: {
        date: todayKey,
        booked: todayBooked,
        total: totalSlotsPerDay,
        utilization: totalSlotsPerDay > 0 ? Math.min(100, Math.round((todayBooked / totalSlotsPerDay) * 100)) : 0,
      },
      weeks,
      marketingSignals: {
        lowCapacityDays: lowDays,
        avgUtilization: weeks.length > 0 ? Math.round(weeks.reduce((s, w) => s + w.utilization, 0) / weeks.length) : 0,
        needsCampaign: lowDays.length > 0,
        urgency: lowDays.length >= 3 ? 'HIGH' : lowDays.length >= 1 ? 'MEDIUM' : 'LOW',
      },
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('[External Capacity API]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Helper: ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7) + 1;
}
