export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, getClinicFilter, unauthorizedResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Authentication & Multi-tenant Security
    const session = await getAuthSession();
    const clinicFilter = getClinicFilter(session);

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all relevant data for AI analysis
    const bookings = await prisma.booking.findMany({
      where: {
        ...clinicFilter,
        scheduledTime: { gte: startDate, lte: endDate },
      },
      include: {
        service: true,
        staff: true,
      },
    });

    // Calculate insights
    const insights = {
      revenueOpportunity: await calculateRevenueOpportunity(bookings, days),
      peakTimeOptimization: await calculatePeakTimeOptimization(bookings),
      customerRetention: await calculateCustomerRetention(bookings, startDate),
      serviceRecommendations: await calculateServiceRecommendations(bookings),
      staffingEfficiency: await calculateStaffingEfficiency(bookings),
    };

    return NextResponse.json({ success: true, data: insights });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to calculate AI insights');
  }
}

async function calculateRevenueOpportunity(bookings: any[], days: number) {
  const cancelled = bookings.filter((b) => b.status === 'cancelled' || b.status === 'CANCELLED');
  const noShows = bookings.filter((b) => b.status === 'no_show' || b.status === 'NO_SHOW');
  
  const cancelledRevenue = cancelled.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const noShowRevenue = noShows.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  
  const totalLostRevenue = Math.round(cancelledRevenue + noShowRevenue);
  const recoverablePotential = totalLostRevenue * 0.35; // 35% recovery rate with reminders
  const monthlyPotential = Math.round((recoverablePotential / days) * 30);

  const cancellationRate = bookings.length > 0 ? (cancelled.length / bookings.length) * 100 : 0;
  const noShowRate = bookings.length > 0 ? (noShows.length / bookings.length) * 100 : 0;

  return {
    title: 'Revenue Recovery Opportunity',
    priority: 'high',
    impact: monthlyPotential,
    description: `Du har förlorat ${totalLostRevenue.toLocaleString('sv-SE')} kr på avbokningar och no-shows de senaste ${days} dagarna.`,
    recommendation: `Implementera automatiska påminnelser 24h innan bokning. Detta kan minska avbokningar med 30-40% och potentiellt återvinna ${monthlyPotential.toLocaleString('sv-SE')} kr per månad.`,
    metrics: {
      cancellationRate: cancellationRate.toFixed(1) + '%',
      noShowRate: noShowRate.toFixed(1) + '%',
      lostRevenue: totalLostRevenue,
      monthlyRecoveryPotential: monthlyPotential,
    },
  };
}

async function calculatePeakTimeOptimization(bookings: any[]) {
  // Group bookings by hour and weekday
  const hourlyDistribution: Record<number, number> = {};
  const weekdayDistribution: Record<number, number> = {};
  
  bookings.forEach((booking) => {
    const date = new Date(booking.scheduledTime);
    const hour = date.getHours();
    const weekday = date.getDay();
    
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    weekdayDistribution[weekday] = (weekdayDistribution[weekday] || 0) + 1;
  });

  // Find peak hours
  const peakHours = Object.entries(hourlyDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Find busiest weekdays
  const weekdayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];
  const busiestDays = Object.entries(weekdayDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([day]) => weekdayNames[parseInt(day)]);

  // Calculate revenue by hour
  const hourlyRevenue: Record<number, number> = {};
  bookings.forEach((booking) => {
    const hour = new Date(booking.scheduledTime).getHours();
    hourlyRevenue[hour] = (hourlyRevenue[hour] || 0) + (Number(booking.price) || 0);
  });

  const topRevenueHour = Object.entries(hourlyRevenue)
    .sort(([, a], [, b]) => b - a)[0];

  return {
    title: 'Peak Time Optimization',
    priority: 'medium',
    impact: 0,
    description: `Dina mest lönsamma tider är ${peakHours.join(', ')}:00 och mest bokade dagar är ${busiestDays.join(', ')}.`,
    recommendation: `Överväg att öka personalstyrkan under toppbelastning kl ${peakHours[0]}:00-${peakHours[0] + 2}:00 och erbjuda kampanjer under lågtrafik för att jämna ut kapacitetsutnyttjandet.`,
    metrics: {
      peakHours: peakHours.map(h => `${h}:00`).join(', '),
      busiestDays: busiestDays.join(', '),
      topRevenueHour: topRevenueHour ? `${topRevenueHour[0]}:00` : 'N/A',
    },
  };
}

async function calculateCustomerRetention(bookings: any[], startDate: Date) {
  // Get unique customers
  const customerIds = [...new Set(bookings.map((b) => b.customerId).filter(Boolean))];
  
  // Calculate repeat rate
  const customerBookingCount: Record<string, number> = {};
  bookings.forEach((booking) => {
    if (booking.customerId) {
      customerBookingCount[booking.customerId] = (customerBookingCount[booking.customerId] || 0) + 1;
    }
  });

  const repeatCustomers = Object.values(customerBookingCount).filter(count => count > 1).length;
  const repeatRate = customerIds.length > 0 ? (repeatCustomers / customerIds.length) * 100 : 0;

  // Get customers who haven't booked recently
  const recentCustomers = await prisma.customer.findMany({
    include: {
      bookings: {
        orderBy: { scheduledTime: 'desc' },
        take: 1,
      },
    },
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const atRiskCustomers = recentCustomers.filter((customer) => {
    const lastBooking = customer.bookings[0];
    return lastBooking && new Date(lastBooking.scheduledTime) < thirtyDaysAgo;
  });

  const potentialImpact = Math.round(atRiskCustomers.length * 500); // Estimated average booking value
  const potentialRevenue = Math.round(atRiskCustomers.length * 0.175 * 500);

  return {
    title: 'Customer Retention Strategy',
    priority: 'medium',
    impact: potentialImpact,
    description: `${atRiskCustomers.length} kunder har inte bokat på 30+ dagar. Din repeat rate är ${repeatRate.toFixed(0)}%.`,
    recommendation: `Skicka personaliserade erbjudanden till inaktiva kunder. En win-back kampanj kan återaktivera 15-20% av dessa kunder och generera ca ${potentialRevenue.toLocaleString('sv-SE')} kr i extra intäkter.`,
    metrics: {
      totalCustomers: customerIds.length,
      repeatRate: repeatRate.toFixed(1) + '%',
      atRiskCustomers: atRiskCustomers.length,
      potentialRevenue: potentialRevenue,
    },
  };
}

async function calculateServiceRecommendations(bookings: any[]) {
  // Analyze service performance
  const serviceStats: Record<string, { count: number; revenue: number; name: string }> = {};
  
  bookings.forEach((booking) => {
    if (booking.service) {
      const serviceId = booking.service.id;
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = { count: 0, revenue: 0, name: booking.service.name };
      }
      serviceStats[serviceId].count += 1;
      serviceStats[serviceId].revenue += Number(booking.price) || 0;
    }
  });

  // Find underperforming services
  const avgBookingsPerService = Object.values(serviceStats).reduce((sum, s) => sum + s.count, 0) / Object.keys(serviceStats).length;
  const underperforming = Object.entries(serviceStats)
    .filter(([, stats]) => stats.count < avgBookingsPerService * 0.5)
    .sort(([, a], [, b]) => a.count - b.count)
    .slice(0, 3);

  // Find top performers
  const topPerformers = Object.entries(serviceStats)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 3);

  const topServiceRevenue = Math.round(topPerformers[0]?.[1].revenue || 0);

  return {
    title: 'Service Portfolio Optimization',
    priority: 'low',
    impact: 0,
    description: `${underperforming.length} tjänster har låg efterfrågan. Fokusera på dina toppförsäljare för maximal lönsamhet.`,
    recommendation: topPerformers.length > 0 
      ? `Dina mest lönsamma tjänster är "${topPerformers[0][1].name}" (${topServiceRevenue.toLocaleString('sv-SE')} kr). Överväg att skapa paketlösningar runt dessa för att öka genomsnittligt ordervärde.`
      : 'Analysera vilka tjänster som ger högst marginal och främja dessa mer aktivt.',
    metrics: {
      topService: topPerformers[0]?.[1].name || 'N/A',
      topServiceRevenue: topServiceRevenue,
      underperformingCount: underperforming.length,
    },
  };
}

async function calculateStaffingEfficiency(bookings: any[]) {
  // Calculate revenue per staff member
  const staffStats: Record<string, { count: number; revenue: number; name: string }> = {};
  
  bookings
    .filter((b) => b.status === 'completed' || b.status === 'COMPLETED')
    .forEach((booking) => {
      if (booking.staff) {
        const staffId = booking.staff.id;
        if (!staffStats[staffId]) {
          staffStats[staffId] = { count: 0, revenue: 0, name: booking.staff.name };
        }
        staffStats[staffId].count += 1;
        staffStats[staffId].revenue += Number(booking.price) || 0;
      }
    });

  const staffArray = Object.values(staffStats);
  const avgRevenue = staffArray.length > 0 ? staffArray.reduce((sum, s) => sum + s.revenue, 0) / staffArray.length : 0;
  
  const topPerformer = staffArray.sort((a, b) => b.revenue - a.revenue)[0];
  const revenueGap = topPerformer ? topPerformer.revenue - avgRevenue : 0;
  
  const totalRevenue = Math.round(staffArray.reduce((sum, s) => sum + s.revenue, 0));
  const topPerformerRevenue = Math.round(topPerformer?.revenue || 0);

  return {
    title: 'Staff Performance Insights',
    priority: 'low',
    impact: Math.round(revenueGap * 0.1), // Small impact from optimization
    description: `${staffArray.length} medarbetare har genererat ${totalRevenue.toLocaleString('sv-SE')} kr totalt.`,
    recommendation: topPerformer 
      ? `${topPerformer.name} är din toppförsäljare med ${topPerformerRevenue.toLocaleString('sv-SE')} kr. Analysera deras metoder och dela best practices med teamet för att höja genomsnittet.`
      : 'Följ upp individuell prestanda regelbundet för att identifiera förbättringsområden.',
    metrics: {
      totalStaff: staffArray.length,
      topPerformer: topPerformer?.name || 'N/A',
      topPerformerRevenue: topPerformerRevenue,
      averageRevenue: Math.round(avgRevenue),
    },
  };
}
