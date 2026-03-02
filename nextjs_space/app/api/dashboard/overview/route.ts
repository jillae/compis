/**
 * Dashboard Overview API
 * 
 * Single endpoint to feed the Drift-mode + Strategi-mode dashboard with real data.
 * GET /api/dashboard/overview
 * 
 * Returns:
 *   - staff: active staff with today's check-in status & next booking
 *   - weekCapacity: this week's daily capacity (booked/total per day)
 *   - alerts: auto-generated operational alerts
 *   - kpis: current month's KPIs with trends
 *   - staffPerformance: per-staff revenue & booking stats (current month)
 *   - todaySnapshot: today's quick numbers
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, getClinicFilter, unauthorizedResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const clinicFilter = getClinicFilter(session);
    const clinicId = session.user.clinicId;

    // Date boundaries
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // This week (Mon-Sun)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Previous month (for trends)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ===== STAFF =====
    const staffMembers = await prisma.staff.findMany({
      where: { ...clinicFilter, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        weeklyHours: true,
      },
      orderBy: { name: 'asc' },
    });

    // Check-in status (today's time entries)
    const todayTimeEntries = await prisma.staffTimeEntry.findMany({
      where: {
        staffId: { in: staffMembers.map(s => s.id) },
        date: { gte: todayStart, lte: todayEnd },
      },
      select: { staffId: true, clockIn: true, clockOut: true },
    });
    const checkedInSet = new Set(
      todayTimeEntries.filter(e => e.clockIn && !e.clockOut).map(e => e.staffId)
    );

    // Next booking per staff (today, after now)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        ...clinicFilter,
        staffId: { in: staffMembers.map(s => s.id) },
        scheduledTime: { gte: now, lte: todayEnd },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      orderBy: { scheduledTime: 'asc' },
      select: { staffId: true, scheduledTime: true },
    });

    // Build next-booking map (first upcoming per staff)
    const nextBookingMap = new Map<string, Date>();
    for (const b of upcomingBookings) {
      if (b.staffId && !nextBookingMap.has(b.staffId)) {
        nextBookingMap.set(b.staffId, b.scheduledTime);
      }
    }

    const staff = staffMembers.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role || 'Personal',
      avatar: s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      checked_in: checkedInSet.has(s.id),
      next_booking: nextBookingMap.has(s.id)
        ? nextBookingMap.get(s.id)!.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
        : null,
    }));

    // ===== WEEK CAPACITY =====
    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
    const dayShort = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

    const weekBookings = await prisma.booking.findMany({
      where: {
        ...clinicFilter,
        scheduledTime: { gte: weekStart, lte: weekEnd },
        status: { notIn: ['CANCELLED', 'cancelled'] },
      },
      select: { scheduledTime: true },
    });

    // Count bookings per day
    const bookingsByDay = new Map<number, number>();
    for (const b of weekBookings) {
      const day = b.scheduledTime.getDay();
      bookingsByDay.set(day, (bookingsByDay.get(day) || 0) + 1);
    }

    const activeStaffCount = staffMembers.length;
    const slotsPerStaffPerDay = 8; // ~8 bookings per staff per day capacity
    const totalSlotsPerDay = activeStaffCount * slotsPerStaffPerDay;

    const weekCapacity = [];
    for (let i = 0; i < 5; i++) { // Mon-Fri
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dayIndex = d.getDay();
      const booked = bookingsByDay.get(dayIndex) || 0;
      const pct = totalSlotsPerDay > 0 ? Math.min(100, Math.round((booked / totalSlotsPerDay) * 100)) : 0;

      weekCapacity.push({
        label: dayNames[dayIndex],
        short: dayShort[dayIndex],
        booked,
        total: totalSlotsPerDay,
        pct,
        isToday: d.toDateString() === now.toDateString(),
      });
    }

    // ===== TODAY SNAPSHOT =====
    const [todayTotal, todayCompleted, todayCancelled, todayNoShow] = await Promise.all([
      prisma.booking.count({
        where: { ...clinicFilter, scheduledTime: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.booking.count({
        where: { ...clinicFilter, scheduledTime: { gte: todayStart, lte: todayEnd }, status: { in: ['COMPLETED', 'completed'] } },
      }),
      prisma.booking.count({
        where: { ...clinicFilter, scheduledTime: { gte: todayStart, lte: todayEnd }, status: { in: ['CANCELLED', 'cancelled'] } },
      }),
      prisma.booking.count({
        where: { ...clinicFilter, scheduledTime: { gte: todayStart, lte: todayEnd }, status: { in: ['NO_SHOW', 'no_show'] } },
      }),
    ]);

    // ===== KPIs (Current Month vs Previous) =====
    const [
      monthBookings, prevMonthBookings,
      monthRevenue, prevMonthRevenue,
      monthCompleted, monthTotal,
      monthNewCustomers, prevMonthNewCustomers,
    ] = await Promise.all([
      prisma.booking.count({ where: { ...clinicFilter, scheduledTime: { gte: monthStart, lte: monthEnd } } }),
      prisma.booking.count({ where: { ...clinicFilter, scheduledTime: { gte: prevMonthStart, lte: prevMonthEnd } } }),
      prisma.booking.aggregate({
        where: { ...clinicFilter, scheduledTime: { gte: monthStart, lte: monthEnd }, status: { in: ['COMPLETED', 'completed'] } },
        _sum: { price: true },
      }),
      prisma.booking.aggregate({
        where: { ...clinicFilter, scheduledTime: { gte: prevMonthStart, lte: prevMonthEnd }, status: { in: ['COMPLETED', 'completed'] } },
        _sum: { price: true },
      }),
      prisma.booking.count({ where: { ...clinicFilter, scheduledTime: { gte: monthStart, lte: monthEnd }, status: { in: ['COMPLETED', 'completed'] } } }),
      prisma.booking.count({ where: { ...clinicFilter, scheduledTime: { gte: monthStart, lte: monthEnd }, status: { notIn: ['CANCELLED', 'cancelled'] } } }),
      prisma.customer.count({ where: { ...clinicFilter, createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.customer.count({ where: { ...clinicFilter, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
    ]);

    const currentRevenue = Number(monthRevenue._sum.price || 0);
    const previousRevenue = Number(prevMonthRevenue._sum.price || 0);
    const revenueChange = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;
    const bookingsChange = prevMonthBookings > 0 ? Math.round(((monthBookings - prevMonthBookings) / prevMonthBookings) * 100) : 0;
    const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 1000) / 10 : 0;
    const avgRevenuePerBooking = monthCompleted > 0 ? Math.round(currentRevenue / monthCompleted) : 0;
    const newCustomerChange = monthNewCustomers - prevMonthNewCustomers;

    const monthName = now.toLocaleDateString('sv-SE', { month: 'long' });

    const kpis = [
      {
        label: `Intäkter (${monthName})`,
        value: `${Math.round(currentRevenue).toLocaleString('sv-SE')} kr`,
        change: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
        positive: revenueChange >= 0,
      },
      {
        label: 'Bokningar',
        value: monthBookings.toString(),
        change: `${bookingsChange >= 0 ? '+' : ''}${bookingsChange}%`,
        positive: bookingsChange >= 0,
      },
      {
        label: 'Genomförandegrad',
        value: `${completionRate}%`,
        change: null,
        positive: completionRate >= 85,
      },
      {
        label: 'Nya kunder',
        value: monthNewCustomers.toString(),
        change: `${newCustomerChange >= 0 ? '+' : ''}${newCustomerChange}`,
        positive: newCustomerChange >= 0,
      },
      {
        label: 'Snittintäkt/bokning',
        value: `${avgRevenuePerBooking} kr`,
        change: null,
        positive: true,
      },
    ];

    // ===== STAFF PERFORMANCE (This Month) =====
    const staffBookingsMonth = await prisma.booking.groupBy({
      by: ['staffId'],
      where: {
        ...clinicFilter,
        scheduledTime: { gte: monthStart, lte: monthEnd },
        staffId: { not: null },
      },
      _count: { id: true },
      _sum: { price: true },
    });

    const completedByStaff = await prisma.booking.groupBy({
      by: ['staffId'],
      where: {
        ...clinicFilter,
        scheduledTime: { gte: monthStart, lte: monthEnd },
        staffId: { not: null },
        status: { in: ['COMPLETED', 'completed'] },
      },
      _count: { id: true },
    });
    const completedMap = new Map(completedByStaff.map(s => [s.staffId!, s._count.id]));

    const staffNameMap = new Map(staffMembers.map(s => [s.id, { name: s.name, role: s.role }]));

    const staffPerformance = staffBookingsMonth
      .filter(s => s.staffId && staffNameMap.has(s.staffId))
      .map(s => {
        const info = staffNameMap.get(s.staffId!);
        const completed = completedMap.get(s.staffId!) || 0;
        const total = s._count.id;
        return {
          name: info?.name || 'Okänd',
          role: info?.role || 'Personal',
          revenue: `${Math.round(Number(s._sum.price || 0)).toLocaleString('sv-SE')} kr`,
          bookings: total,
          completion: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
      .sort((a, b) => parseInt(b.revenue.replace(/\D/g, '')) - parseInt(a.revenue.replace(/\D/g, '')));

    // ===== ALERTS (Auto-generated) =====
    const alerts: Array<{ type: string; title: string; description: string }> = [];

    // Check for gaps tomorrow
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    const tomorrowBookings = await prisma.booking.count({
      where: {
        ...clinicFilter,
        scheduledTime: { gte: tomorrow, lte: tomorrowEnd },
        status: { notIn: ['CANCELLED', 'cancelled'] },
      },
    });
    const tomorrowPct = totalSlotsPerDay > 0 ? Math.round((tomorrowBookings / totalSlotsPerDay) * 100) : 0;
    if (tomorrowPct < 60 && totalSlotsPerDay > 0) {
      const gaps = totalSlotsPerDay - tomorrowBookings;
      const dayName = dayNames[tomorrow.getDay()];
      alerts.push({
        type: 'warning',
        title: `Luckor imorgon (${dayName})`,
        description: `${gaps} lediga tider imorgon (${tomorrowPct}% belagt). Överväg SMS-utskick.`,
      });
    }

    // Staff not checked in today (after 09:00)
    if (now.getHours() >= 9) {
      const notCheckedIn = staffMembers.filter(s => !checkedInSet.has(s.id));
      if (notCheckedIn.length > 0) {
        const names = notCheckedIn.map(s => s.name).slice(0, 3).join(', ');
        const extra = notCheckedIn.length > 3 ? ` +${notCheckedIn.length - 3} till` : '';
        alerts.push({
          type: 'error',
          title: 'Ej instämplad personal',
          description: `${names}${extra} har inte stämplat in idag. Kontrollera närvaro.`,
        });
      }
    }

    // Low-capacity day this week
    const lowDays = weekCapacity.filter(d => d.pct < 50 && !d.isToday);
    if (lowDays.length > 0) {
      const dayList = lowDays.map(d => `${d.label} (${d.pct}%)`).join(', ');
      alerts.push({
        type: 'info',
        title: 'Låg beläggning denna vecka',
        description: `${dayList}. Kampanj rekommenderas.`,
      });
    }

    // High no-show rate
    const recentNoShows = await prisma.booking.count({
      where: {
        ...clinicFilter,
        scheduledTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), lte: now },
        status: { in: ['NO_SHOW', 'no_show'] },
      },
    });
    const recentTotal = await prisma.booking.count({
      where: {
        ...clinicFilter,
        scheduledTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), lte: now },
      },
    });
    if (recentTotal > 0 && (recentNoShows / recentTotal) > 0.1) {
      alerts.push({
        type: 'warning',
        title: 'Hög no-show frekvens',
        description: `${recentNoShows} uteblivna besök senaste 7 dagarna (${Math.round((recentNoShows / recentTotal) * 100)}%). Överväg SMS-påminnelser.`,
      });
    }

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      staff,
      weekCapacity,
      todaySnapshot: {
        total: todayTotal,
        completed: todayCompleted,
        cancelled: todayCancelled,
        noShow: todayNoShow,
        remaining: todayTotal - todayCompleted - todayCancelled - todayNoShow,
        staffCheckedIn: checkedInSet.size,
        staffTotal: staffMembers.length,
      },
      kpis,
      staffPerformance,
      alerts,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to fetch dashboard overview');
  }
}
