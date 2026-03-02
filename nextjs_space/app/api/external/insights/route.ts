/**
 * Flow External API — Insights Endpoint
 * 
 * Exponerar klinikinsikter som JSON för extern konsumtion (t.ex. Marknadscentral).
 * Autentiseras via X-FLOW-API-KEY header (inte NextAuth — server-to-server).
 * 
 * GET /api/external/insights?clinicId=xxx&days=30
 * 
 * Response: {
 *   clinic: { name, id },
 *   period: { startDate, endDate, days },
 *   occupancy: { rate, totalSlots, bookedSlots, trend },
 *   bookings: { total, completed, cancelled, noShows, completionRate, cancellationRate, noShowRate },
 *   revenue: { total, avgPerBooking, topServices, trend },
 *   staff: [{ name, bookings, revenue, utilization }],
 *   insights: [{ type, severity, title, description }]
 * }
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Validate external API key
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-FLOW-API-KEY');
  const validKey = process.env.FLOW_EXTERNAL_API_KEY;
  
  if (!validKey || !apiKey) return false;
  return apiKey === validKey;
}

// CORS headers for cross-origin requests from Marknadscentral
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-FLOW-API-KEY, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, bokadirektId: true }
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Previous period for trend comparison
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const whereClause = { clinicId };
    const dateFilter = {
      scheduledTime: { gte: startDate, lte: endDate }
    };
    const prevDateFilter = {
      scheduledTime: { gte: prevStartDate, lte: prevEndDate }
    };

    // ===== BOOKINGS =====
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      prevTotalBookings
    ] = await Promise.all([
      prisma.booking.count({ where: { ...whereClause, ...dateFilter } }),
      prisma.booking.count({ where: { ...whereClause, ...dateFilter, status: { in: ['completed', 'COMPLETED'] } } }),
      prisma.booking.count({ where: { ...whereClause, ...dateFilter, status: { in: ['cancelled', 'CANCELLED'] } } }),
      prisma.booking.count({ where: { ...whereClause, ...dateFilter, status: { in: ['no_show', 'NO_SHOW'] } } }),
      prisma.booking.count({ where: { ...whereClause, ...prevDateFilter } }),
    ]);

    const bookingsTrend = prevTotalBookings > 0
      ? ((totalBookings - prevTotalBookings) / prevTotalBookings) * 100
      : 0;

    // ===== REVENUE =====
    const [revenueAgg, prevRevenueAgg] = await Promise.all([
      prisma.booking.aggregate({
        where: { ...whereClause, ...dateFilter, status: { in: ['completed', 'COMPLETED'] } },
        _sum: { price: true },
      }),
      prisma.booking.aggregate({
        where: { ...whereClause, ...prevDateFilter, status: { in: ['completed', 'COMPLETED'] } },
        _sum: { price: true },
      }),
    ]);

    const totalRevenue = Number(revenueAgg._sum.price || 0);
    const prevRevenue = Number(prevRevenueAgg._sum.price || 0);
    const revenueTrend = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
    const avgPerBooking = completedBookings > 0
      ? totalRevenue / completedBookings
      : 0;

    // ===== TOP SERVICES =====
    const topServices = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: { ...whereClause, ...dateFilter, status: { in: ['completed', 'COMPLETED'] }, serviceId: { not: null } },
      _count: { id: true },
      _sum: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Fetch service names
    const serviceIds = topServices.map(s => s.serviceId).filter(Boolean) as string[];
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, category: true },
    });
    const serviceMap = new Map(services.map(s => [s.id, s]));

    const topServicesData = topServices.map(s => ({
      name: serviceMap.get(s.serviceId!)?.name || 'Okänd',
      category: serviceMap.get(s.serviceId!)?.category || 'general',
      bookings: s._count.id,
      revenue: Number(s._sum.price || 0),
    }));

    // ===== STAFF UTILIZATION =====
    const staffBookings = await prisma.booking.groupBy({
      by: ['staffId'],
      where: { ...whereClause, ...dateFilter, staffId: { not: null } },
      _count: { id: true },
      _sum: { price: true },
    });

    const staffIds = staffBookings.map(s => s.staffId).filter(Boolean) as string[];
    const staffMembers = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true, role: true, weeklyHours: true },
    });
    const staffMap = new Map(staffMembers.map(s => [s.id, s]));

    // Calculate utilization: (booked hours / available hours) * 100
    // Assume avg booking = 60 min, staff works weeklyHours * (days/7) weeks
    const weeksInPeriod = days / 7;
    const staffData = staffBookings.map(sb => {
      const staff = staffMap.get(sb.staffId!);
      const availableHours = (staff?.weeklyHours || 40) * weeksInPeriod;
      const bookedHours = sb._count.id; // approximate: 1 booking ≈ 1 hour
      const utilization = availableHours > 0 ? Math.min((bookedHours / availableHours) * 100, 100) : 0;

      return {
        name: staff?.name || 'Okänd',
        role: staff?.role || null,
        bookings: sb._count.id,
        revenue: Number(sb._sum.price || 0),
        utilization: Math.round(utilization),
      };
    }).sort((a, b) => b.bookings - a.bookings);

    // ===== OCCUPANCY =====
    // Estimate occupancy: (completed + scheduled bookings) / (staff * workdays * slots_per_day)
    const activeStaff = await prisma.staff.count({ where: { ...whereClause, isActive: true } });
    const workdays = Math.round(days * (5 / 7)); // approx weekdays
    const slotsPerDay = 8; // 8 bookings per staff per day capacity
    const totalSlots = activeStaff * workdays * slotsPerDay;
    const bookedSlots = totalBookings - cancelledBookings;
    const occupancyRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

    const prevBookedSlots = prevTotalBookings; // rough estimate
    const prevOccupancy = totalSlots > 0 ? (prevBookedSlots / totalSlots) * 100 : 0;
    const occupancyTrend = prevOccupancy > 0
      ? occupancyRate - prevOccupancy
      : 0;

    // ===== DAILY TREND (last 30 days) =====
    const dailyBookings = await prisma.booking.groupBy({
      by: ['scheduledTime'],
      where: { ...whereClause, ...dateFilter },
      _count: { id: true },
    });

    // Aggregate by date
    const dailyMap = new Map<string, number>();
    for (const db of dailyBookings) {
      const dateKey = new Date(db.scheduledTime).toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + db._count.id);
    }

    const revenueTrendData: Array<{ date: string; bookings: number }> = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      revenueTrendData.push({ date: key, bookings: dailyMap.get(key) || 0 });
    }

    // ===== GENERATED INSIGHTS =====
    const insights: Array<{ type: string; severity: string; title: string; description: string }> = [];

    // High cancellation rate
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
    if (cancellationRate > 15) {
      insights.push({
        type: 'cancellation',
        severity: 'high',
        title: 'Hög avbokningsfrekvens',
        description: `${cancellationRate.toFixed(1)}% avbokningar senaste ${days} dagarna. Branschsnitt ligger på 10-12%. Överväg påminnelser via SMS 24h innan.`,
      });
    }

    // No-show rate
    const noShowRate = totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0;
    if (noShowRate > 5) {
      insights.push({
        type: 'no_show',
        severity: 'high',
        title: 'Högt antal uteblivna besök',
        description: `${noShowRate.toFixed(1)}% no-shows. Kostnaden uppskattas till ${Math.round(noShowBookings * avgPerBooking)} kr i förlorad intäkt.`,
      });
    }

    // Low occupancy
    if (occupancyRate < 60) {
      insights.push({
        type: 'occupancy',
        severity: 'medium',
        title: 'Låg beläggning',
        description: `Beläggningen ligger på ${occupancyRate.toFixed(0)}%. Det finns utrymme att öka med ${Math.round(totalSlots * 0.75 - bookedSlots)} bokningar till 75% beläggning.`,
      });
    }

    // Revenue trend
    if (revenueTrend < -10) {
      insights.push({
        type: 'revenue',
        severity: 'high',
        title: 'Intäkterna minskar',
        description: `Intäkterna har minskat med ${Math.abs(revenueTrend).toFixed(1)}% jämfört med föregående period. Nuvarande: ${Math.round(totalRevenue).toLocaleString('sv-SE')} kr.`,
      });
    } else if (revenueTrend > 10) {
      insights.push({
        type: 'revenue',
        severity: 'positive',
        title: 'Intäkterna ökar',
        description: `Intäkterna har ökat med ${revenueTrend.toFixed(1)}% jämfört med föregående period. Bra trend!`,
      });
    }

    // Staff utilization imbalance
    if (staffData.length >= 2) {
      const maxUtil = Math.max(...staffData.map(s => s.utilization));
      const minUtil = Math.min(...staffData.map(s => s.utilization));
      if (maxUtil - minUtil > 30) {
        const overloaded = staffData.find(s => s.utilization === maxUtil);
        const underloaded = staffData.find(s => s.utilization === minUtil);
        insights.push({
          type: 'staff_balance',
          severity: 'medium',
          title: 'Ojämn arbetsfördelning',
          description: `${overloaded?.name} har ${maxUtil}% beläggning medan ${underloaded?.name} har ${minUtil}%. Överväg omfördelning.`,
        });
      }
    }

    // ===== RESPONSE =====
    const response = {
      success: true,
      generatedAt: new Date().toISOString(),
      clinic: {
        id: clinic.id,
        name: clinic.name,
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days,
      },
      occupancy: {
        rate: Math.round(occupancyRate * 10) / 10,
        totalSlots,
        bookedSlots,
        trend: Math.round(occupancyTrend * 10) / 10,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        noShows: noShowBookings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 1000) / 10 : 0,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        noShowRate: Math.round(noShowRate * 10) / 10,
        trend: Math.round(bookingsTrend * 10) / 10,
      },
      revenue: {
        total: Math.round(totalRevenue),
        avgPerBooking: Math.round(avgPerBooking),
        trend: Math.round(revenueTrend * 10) / 10,
        topServices: topServicesData,
      },
      staff: staffData,
      dailyTrend: revenueTrendData,
      insights,
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('[External Insights API]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
