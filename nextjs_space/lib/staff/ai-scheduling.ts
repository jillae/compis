
/**
 * AI-Driven Staff Scheduling
 * 
 * Analyze booking history and predict optimal staffing needs
 * Generates intelligent schedule recommendations
 */

import { prisma } from '../db';
import { startOfWeek, endOfWeek, format, addDays, parseISO, startOfDay } from 'date-fns';
import { sv } from 'date-fns/locale';

export interface StaffingRecommendation {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // Monday, Tuesday, etc
  timeSlot: string; // HH:00-HH:00
  recommendedStaff: number;
  predictedBookings: number;
  confidence: number; // 0-100
  reasoning: string;
}

export interface ScheduleSuggestion {
  staffId: string;
  staffName: string;
  suggestedShifts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}

export interface WeeklyScheduleRecommendation {
  weekStart: string;
  weekEnd: string;
  staffingRecommendations: StaffingRecommendation[];
  scheduleSuggestions: ScheduleSuggestion[];
  insights: {
    peakHours: string[];
    lowActivityHours: string[];
    optimalStaffCount: number;
    projectedRevenue: number;
  };
}

/**
 * Analyze booking patterns for the past N weeks
 */
async function analyzeBookingPatterns(
  clinicId: string,
  weeksToAnalyze = 8
): Promise<Map<string, Map<number, number>>> {
  // Get historical bookings
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeksToAnalyze * 7);

  const bookings = await prisma.booking.findMany({
    where: {
      customerId: {
        in: (await prisma.customer.findMany({
          where: { clinic: { id: clinicId } },
          select: { id: true },
        })).map((c) => c.id),
      },
      startTime: {
        gte: startDate,
      },
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
    },
    select: {
      startTime: true,
    },
  });

  // Map: dayOfWeek -> hourOfDay -> count
  const patterns = new Map<string, Map<number, number>>();

  bookings.forEach((booking) => {
    if (!booking.startTime) return;
    
    const dayOfWeek = format(booking.startTime, 'EEEE', { locale: sv });
    const hour = booking.startTime.getHours();

    if (!patterns.has(dayOfWeek)) {
      patterns.set(dayOfWeek, new Map());
    }

    const hourMap = patterns.get(dayOfWeek)!;
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  return patterns;
}

/**
 * Generate staffing recommendations for a specific week
 */
export async function generateWeeklyRecommendations(
  clinicId: string,
  weekStartDate: Date
): Promise<WeeklyScheduleRecommendation> {
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });

  // Analyze historical patterns
  const patterns = await analyzeBookingPatterns(clinicId);

  const staffingRecommendations: StaffingRecommendation[] = [];
  const peakHours: string[] = [];
  const lowActivityHours: string[] = [];

  // Generate recommendations for each day
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const dayName = format(date, 'EEEE', { locale: sv });
    const hourPattern = patterns.get(dayName) || new Map();

    // Analyze each hour (9 AM - 6 PM)
    for (let hour = 9; hour < 18; hour++) {
      const bookingsThisHour = hourPattern.get(hour) || 0;
      const avgBookingsPerWeek = bookingsThisHour / 8; // Over 8 weeks

      // Confidence based on sample size
      const confidence = Math.min(100, (bookingsThisHour / 8) * 20);

      // Staff recommendation: 1 staff per 3 bookings + 1 baseline
      const recommendedStaff = Math.max(1, Math.ceil(avgBookingsPerWeek / 3) + 1);

      const timeSlot = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;

      // Determine reasoning
      let reasoning = '';
      if (avgBookingsPerWeek >= 5) {
        reasoning = 'Hög aktivitet - extra bemanning rekommenderas';
        peakHours.push(`${dayName} ${timeSlot}`);
      } else if (avgBookingsPerWeek <= 1) {
        reasoning = 'Låg aktivitet - minimal bemanning';
        lowActivityHours.push(`${dayName} ${timeSlot}`);
      } else {
        reasoning = 'Normal aktivitet - standard bemanning';
      }

      staffingRecommendations.push({
        date: format(date, 'yyyy-MM-dd'),
        dayOfWeek: dayName,
        timeSlot,
        recommendedStaff,
        predictedBookings: Math.round(avgBookingsPerWeek),
        confidence: Math.round(confidence),
        reasoning,
      });
    }
  }

  // Generate schedule suggestions for each staff member
  const staff = await prisma.staff.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      weeklyHours: true,
    },
  });

  const scheduleSuggestions: ScheduleSuggestion[] = [];

  staff.forEach((staffMember) => {
    const targetHours = staffMember.weeklyHours || 40;
    const shiftsPerWeek = Math.ceil(targetHours / 8); // 8-hour shifts

    const suggestedShifts: ScheduleSuggestion['suggestedShifts'] = [];

    // Prioritize peak hours for scheduling
    const peakRecommendations = staffingRecommendations
      .filter((r) => r.predictedBookings >= 3)
      .sort((a, b) => b.predictedBookings - a.predictedBookings)
      .slice(0, shiftsPerWeek * 2); // Get top peak times

    // Assign shifts evenly across the week
    const daysToSchedule = Math.min(5, shiftsPerWeek); // Max 5 days/week
    for (let i = 0; i < daysToSchedule; i++) {
      const recommendation = peakRecommendations[i];
      if (!recommendation) break;

      const startHour = recommendation.timeSlot.split('-')[0];
      
      suggestedShifts.push({
        date: recommendation.date,
        startTime: `${recommendation.date}T${startHour}:00:00Z`,
        endTime: `${recommendation.date}T${parseInt(startHour.split(':')[0]) + 8}:00:00Z`,
        reason: `${recommendation.reasoning} (${recommendation.predictedBookings} bokningar förväntade)`,
      });
    }

    scheduleSuggestions.push({
      staffId: staffMember.id,
      staffName: staffMember.name,
      suggestedShifts,
    });
  });

  // Calculate insights
  const totalPredictedBookings = staffingRecommendations.reduce(
    (sum, r) => sum + r.predictedBookings,
    0
  );
  const optimalStaffCount = Math.ceil(totalPredictedBookings / (5 * 8 * 3)); // 3 bookings per staff per hour, 8 hours, 5 days

  // Estimate revenue (assume average booking price)
  const avgBookingPrice = await prisma.booking.aggregate({
    where: {
      customerId: {
        in: (await prisma.customer.findMany({
          where: { clinic: { id: clinicId } },
          select: { id: true },
        })).map((c) => c.id),
      },
      status: { in: ['COMPLETED', 'completed'] },
    },
    _avg: {
      price: true,
    },
  });

  const projectedRevenue = Math.round(
    totalPredictedBookings * Number(avgBookingPrice._avg.price || 0)
  );

  return {
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
    staffingRecommendations,
    scheduleSuggestions,
    insights: {
      peakHours: peakHours.slice(0, 5), // Top 5 peak hours
      lowActivityHours: lowActivityHours.slice(0, 5), // Top 5 low hours
      optimalStaffCount,
      projectedRevenue,
    },
  };
}

/**
 * Check for understaffing warnings
 */
export async function checkUnderstaffingWarnings(
  clinicId: string,
  date: Date
): Promise<Array<{
  time: string;
  predictedBookings: number;
  scheduledStaff: number;
  warning: string;
}>> {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  // Get scheduled staff for this day
  const schedules = await prisma.staffSchedule.findMany({
    where: {
      clinicId,
      shiftDate: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Get bookings for this day
  const bookings = await prisma.booking.findMany({
    where: {
      customerId: {
        in: (await prisma.customer.findMany({
          where: { clinic: { id: clinicId } },
          select: { id: true },
        })).map((c) => c.id),
      },
      startTime: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        in: ['CONFIRMED'],
      },
    },
    select: {
      startTime: true,
    },
  });

  const warnings: Array<{
    time: string;
    predictedBookings: number;
    scheduledStaff: number;
    warning: string;
  }> = [];

  // Check each hour
  for (let hour = 9; hour < 18; hour++) {
    const hourBookings = bookings.filter(
      (b) => b.startTime && b.startTime.getHours() === hour
    ).length;

    const hourStaff = schedules.filter(
      (s) =>
        s.startTime.getHours() <= hour &&
        s.endTime.getHours() > hour
    ).length;

    // Warning if bookings per staff > 3
    if (hourStaff > 0 && hourBookings / hourStaff > 3) {
      warnings.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        predictedBookings: hourBookings,
        scheduledStaff: hourStaff,
        warning: `Underbemanning! ${hourBookings} bokningar men bara ${hourStaff} personal schemalagd`,
      });
    }
  }

  return warnings;
}
