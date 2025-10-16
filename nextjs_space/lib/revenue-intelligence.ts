
import { prisma } from '@/lib/db';
import { addDays, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, differenceInDays } from 'date-fns';
import { InsightPeriod, BookingStatus, Prisma } from '@prisma/client';

export interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  newRevenue: number;
  expansionRevenue: number;
  churnedRevenue: number;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  churnedCustomers: number;
  reactivatedCustomers: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  averageRevenuePerUser: number;
  averageBookingValue: number;
  churnRate?: number;
  growthRate?: number;
  utilizationRate?: number;
}

export async function calculateRevenueInsights(
  clinicId: string,
  period: InsightPeriod,
  startDate: Date,
  endDate: Date
): Promise<RevenueMetrics> {
  
  // Get bookings for the period
  const bookings = await prisma.booking.findMany({
    where: {
      clinicId,
      scheduledTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      customer: true,
    },
  });

  // Get previous period for comparison
  const periodLength = differenceInDays(endDate, startDate);
  const prevStartDate = addDays(startDate, -periodLength);
  const prevEndDate = addDays(endDate, -periodLength);

  const prevBookings = await prisma.booking.findMany({
    where: {
      clinicId,
      scheduledTime: {
        gte: prevStartDate,
        lte: prevEndDate,
      },
    },
  });

  // Calculate metrics
  const completedBookings = bookings.filter(b => 
    b.status === BookingStatus.COMPLETED || b.status === 'completed' as any
  );
  
  const cancelledBookings = bookings.filter(b => 
    b.status === BookingStatus.CANCELLED || b.status === 'cancelled' as any
  );
  
  const noShowBookings = bookings.filter(b => 
    b.status === BookingStatus.NO_SHOW || b.status === 'no_show' as any
  );

  const totalRevenue = completedBookings.reduce((sum, b) => 
    sum + (b.revenue?.toNumber() || b.price.toNumber() || 0), 0
  );

  const prevTotalRevenue = prevBookings
    .filter(b => b.status === BookingStatus.COMPLETED || b.status === 'completed' as any)
    .reduce((sum, b) => sum + (b.revenue?.toNumber() || b.price.toNumber() || 0), 0);

  // Get unique customers
  const customerIds = new Set(bookings.map(b => b.customerId));
  const prevCustomerIds = new Set(prevBookings.map(b => b.customerId));

  const newCustomers = Array.from(customerIds).filter(id => !prevCustomerIds.has(id));
  const reactivatedCustomers = Array.from(customerIds).filter(id => {
    // Customer was in previous period but not active recently
    return prevCustomerIds.has(id);
  });

  const churnedCustomers = Array.from(prevCustomerIds).filter(id => !customerIds.has(id));

  // Calculate rates
  const growthRate = prevTotalRevenue > 0 
    ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) 
    : 0;

  const churnRate = prevCustomerIds.size > 0 
    ? (churnedCustomers.length / prevCustomerIds.size) 
    : 0;

  const averageBookingValue = completedBookings.length > 0 
    ? (totalRevenue / completedBookings.length) 
    : 0;

  const averageRevenuePerUser = customerIds.size > 0 
    ? (totalRevenue / customerIds.size) 
    : 0;

  // Calculate utilization (simplified - would need staff schedule data for accuracy)
  // Assuming 8 hour work days, 5 staff members
  const workingHours = periodLength * 8 * 5; // days * hours * staff
  const bookedHours = bookings.reduce((sum, b) => sum + ((b.duration || 60) / 60), 0);
  const utilizationRate = workingHours > 0 ? (bookedHours / workingHours) * 100 : 0;

  return {
    totalRevenue,
    recurringRevenue: totalRevenue * 0.7, // Estimate: 70% recurring
    newRevenue: totalRevenue * 0.2, // Estimate: 20% from new customers
    expansionRevenue: totalRevenue * 0.1, // Estimate: 10% upsells
    churnedRevenue: prevTotalRevenue * churnRate,
    totalCustomers: customerIds.size,
    newCustomers: newCustomers.length,
    activeCustomers: customerIds.size,
    churnedCustomers: churnedCustomers.length,
    reactivatedCustomers: reactivatedCustomers.length,
    totalBookings: bookings.length,
    completedBookings: completedBookings.length,
    cancelledBookings: cancelledBookings.length,
    noShowBookings: noShowBookings.length,
    averageRevenuePerUser,
    averageBookingValue,
    churnRate,
    growthRate,
    utilizationRate,
  };
}

export async function saveRevenueInsight(
  clinicId: string,
  period: InsightPeriod,
  startDate: Date,
  endDate: Date,
  metrics: RevenueMetrics
) {
  return prisma.revenueInsight.upsert({
    where: {
      clinicId_period_startDate: {
        clinicId,
        period,
        startDate,
      },
    },
    create: {
      clinicId,
      period,
      startDate,
      endDate,
      ...metrics,
    },
    update: {
      ...metrics,
      calculatedAt: new Date(),
    },
  });
}

export async function generateInsightsForClinic(clinicId: string) {
  const now = new Date();
  
  // Generate daily insight
  const dailyStart = startOfDay(now);
  const dailyEnd = endOfDay(now);
  const dailyMetrics = await calculateRevenueInsights(clinicId, InsightPeriod.DAILY, dailyStart, dailyEnd);
  await saveRevenueInsight(clinicId, InsightPeriod.DAILY, dailyStart, dailyEnd, dailyMetrics);

  // Generate weekly insight
  const weeklyStart = startOfWeek(now, { weekStartsOn: 1 });
  const weeklyEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weeklyMetrics = await calculateRevenueInsights(clinicId, InsightPeriod.WEEKLY, weeklyStart, weeklyEnd);
  await saveRevenueInsight(clinicId, InsightPeriod.WEEKLY, weeklyStart, weeklyEnd, weeklyMetrics);

  // Generate monthly insight
  const monthlyStart = startOfMonth(now);
  const monthlyEnd = endOfMonth(now);
  const monthlyMetrics = await calculateRevenueInsights(clinicId, InsightPeriod.MONTHLY, monthlyStart, monthlyEnd);
  await saveRevenueInsight(clinicId, InsightPeriod.MONTHLY, monthlyStart, monthlyEnd, monthlyMetrics);

  return { daily: dailyMetrics, weekly: weeklyMetrics, monthly: monthlyMetrics };
}
