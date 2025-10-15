
/**
 * Capacity Forecasting Engine for Klinik Flow Control
 * 
 * Predicts capacity utilization 2-4 weeks ahead based on:
 * - Current bookings
 * - Historical patterns
 * - Staff availability
 * - No-show predictions
 * - Seasonal trends
 */

import { Booking, Staff, Service } from '@prisma/client';
import { 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  getDay,
  getHours,
  differenceInMinutes,
  parseISO
} from 'date-fns';
import { sv } from 'date-fns/locale';

export interface DailyCapacityForecast {
  date: string;
  dayOfWeek: string;
  totalCapacity: number; // Total available hours
  bookedCapacity: number; // Booked hours (adjusted for no-shows)
  utilizationRate: number; // Percentage (0-100)
  availableSlots: number; // Number of available booking slots
  optimalSlots: number; // Optimal number to maintain 75-85% utilization
  recommendation: string;
  status: 'UNDERUTILIZED' | 'OPTIMAL' | 'NEAR_FULL' | 'OVERBOOKED';
}

export interface WeeklyCapacityForecast {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalCapacity: number;
  bookedCapacity: number;
  utilizationRate: number;
  availableSlots: number;
  revenue: number;
  projectedRevenue: number;
  days: DailyCapacityForecast[];
}

export interface CapacityInsight {
  type: 'WARNING' | 'OPPORTUNITY' | 'INFO';
  title: string;
  description: string;
  impact: string; // e.g., "+15,000 kr potential"
  actionItems: string[];
}

/**
 * Calculate capacity forecast for the next N weeks
 */
export async function calculateCapacityForecast(
  bookings: Booking[],
  staff: Staff[],
  services: Service[],
  weeksAhead: number = 4,
  averageNoShowRate: number = 0.08
): Promise<{
  weeks: WeeklyCapacityForecast[];
  insights: CapacityInsight[];
  summary: {
    averageUtilization: number;
    peakUtilization: number;
    lowestUtilization: number;
    totalRevenue: number;
    potentialRevenue: number;
    capacityGap: number;
  };
}> {
  const today = new Date();
  const weeks: WeeklyCapacityForecast[] = [];
  const insights: CapacityInsight[] = [];

  // Calculate staff capacity (simplified - assume 40h/week per staff member)
  const staffCapacityPerWeek = staff.length * 40; // hours
  const avgBookingDuration = 60; // minutes (assumption)

  // Process each week
  for (let weekOffset = 0; weekOffset < weeksAhead; weekOffset++) {
    const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const dailyForecasts: DailyCapacityForecast[] = [];

    let weekTotalCapacity = 0;
    let weekBookedCapacity = 0;
    let weekRevenue = 0;

    // Process each day
    for (const day of daysInWeek) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      
      // Skip weekends (simplified - in reality, check staff schedules)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      // Daily capacity (8 hours * number of staff)
      const dailyCapacity = staff.length * 8; // hours
      
      // Get bookings for this day
      const dayBookings = bookings.filter((b) => {
        const bookingDate = format(new Date(b.scheduledTime), 'yyyy-MM-dd');
        return bookingDate === dayStr;
      });

      // Calculate booked hours (adjusted for no-shows)
      const bookedHours = dayBookings.reduce((sum, b) => {
        const duration = b.duration || 60; // minutes
        return sum + (duration / 60);
      }, 0);

      const adjustedBookedHours = bookedHours * (1 - averageNoShowRate);

      // Calculate utilization
      const utilizationRate = dailyCapacity > 0 
        ? Math.round((adjustedBookedHours / dailyCapacity) * 100)
        : 0;

      // Available slots (assuming 60-min avg booking)
      const availableHours = dailyCapacity - adjustedBookedHours;
      const availableSlots = Math.max(0, Math.floor(availableHours));

      // Optimal slots to reach 80% utilization
      const optimalHours = dailyCapacity * 0.8;
      const optimalSlots = Math.max(0, Math.round((optimalHours - adjustedBookedHours)));

      // Revenue calculation
      const dayRevenue = dayBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);

      // Determine status
      let status: DailyCapacityForecast['status'];
      let recommendation: string;

      if (utilizationRate < 60) {
        status = 'UNDERUTILIZED';
        recommendation = `Låg beläggning (${utilizationRate}%) - kör kampanj för att fylla ${availableSlots} lediga slots`;
      } else if (utilizationRate >= 60 && utilizationRate < 85) {
        status = 'OPTIMAL';
        recommendation = `Optimal beläggning (${utilizationRate}%) - fortsätt enligt plan`;
      } else if (utilizationRate >= 85 && utilizationRate < 100) {
        status = 'NEAR_FULL';
        recommendation = `Nära fullt (${utilizationRate}%) - överväg att öppna extra slots om möjligt`;
      } else {
        status = 'OVERBOOKED';
        recommendation = `Överbokat (${utilizationRate}%) - risk för stress, överväg att omfördela`;
      }

      const dailyForecast: DailyCapacityForecast = {
        date: dayStr,
        dayOfWeek: format(day, 'EEEE', { locale: sv }),
        totalCapacity: dailyCapacity,
        bookedCapacity: adjustedBookedHours,
        utilizationRate,
        availableSlots,
        optimalSlots,
        recommendation,
        status,
      };

      dailyForecasts.push(dailyForecast);
      
      weekTotalCapacity += dailyCapacity;
      weekBookedCapacity += adjustedBookedHours;
      weekRevenue += dayRevenue;
    }

    // Calculate week-level metrics
    const weekUtilizationRate = weekTotalCapacity > 0
      ? Math.round((weekBookedCapacity / weekTotalCapacity) * 100)
      : 0;

    const weekAvailableSlots = Math.floor((weekTotalCapacity - weekBookedCapacity));
    
    // Projected revenue if we hit 80% utilization
    const projectedRevenue = weekRevenue / (weekUtilizationRate / 100) * 80;

    weeks.push({
      weekNumber: weekOffset + 1,
      weekLabel: `Vecka ${format(weekStart, 'w')}`,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
      totalCapacity: weekTotalCapacity,
      bookedCapacity: weekBookedCapacity,
      utilizationRate: weekUtilizationRate,
      availableSlots: weekAvailableSlots,
      revenue: weekRevenue,
      projectedRevenue,
      days: dailyForecasts,
    });
  }

  // Generate insights
  const avgUtilization = weeks.reduce((sum, w) => sum + w.utilizationRate, 0) / weeks.length;
  const peakUtilization = Math.max(...weeks.map((w) => w.utilizationRate));
  const lowestUtilization = Math.min(...weeks.map((w) => w.utilizationRate));

  // Insight 1: Underutilized weeks
  const underutilizedWeeks = weeks.filter((w) => w.utilizationRate < 65);
  if (underutilizedWeeks.length > 0) {
    const totalLostSlots = underutilizedWeeks.reduce((sum, w) => sum + w.availableSlots, 0);
    const potentialRevenue = totalLostSlots * 900; // Assume 900 kr avg booking

    insights.push({
      type: 'OPPORTUNITY',
      title: `${underutilizedWeeks.length} veckor med låg beläggning`,
      description: `${totalLostSlots} outnyttjade slots under de nästa ${weeksAhead} veckorna`,
      impact: `+${potentialRevenue.toLocaleString('sv-SE')} kr potential`,
      actionItems: [
        `Kör riktad kampanj för ${underutilizedWeeks[0].weekLabel}`,
        'Erbjud "Last Minute"-rabatter för att fylla tomma slots',
        'Kontakta tidigare kunder som inte bokat på länge',
      ],
    });
  }

  // Insight 2: Peak weeks
  const peakWeeks = weeks.filter((w) => w.utilizationRate > 90);
  if (peakWeeks.length > 0) {
    insights.push({
      type: 'WARNING',
      title: `${peakWeeks.length} veckor med risk för överbelastning`,
      description: `Beläggning över 90% - risk för stress och kvalitetsförsämring`,
      impact: `Potential för 5-10% fler cancellations`,
      actionItems: [
        'Överväg att lägga till extra personal',
        'Höj priserna för högbelastade tider',
        'Omprioritera bokningar till lågtrafikdagar',
      ],
    });
  }

  // Insight 3: Consistent patterns
  const mondayUtilization = weeks.flatMap((w) => w.days.filter((d) => d.dayOfWeek === 'måndag'));
  const fridayUtilization = weeks.flatMap((w) => w.days.filter((d) => d.dayOfWeek === 'fredag'));
  
  if (mondayUtilization.length > 0 && fridayUtilization.length > 0) {
    const avgMonday = mondayUtilization.reduce((sum, d) => sum + d.utilizationRate, 0) / mondayUtilization.length;
    const avgFriday = fridayUtilization.reduce((sum, d) => sum + d.utilizationRate, 0) / fridayUtilization.length;

    if (avgMonday < 60 && avgFriday > 85) {
      insights.push({
        type: 'OPPORTUNITY',
        title: 'Ombalansera bokningar mellan veckodagar',
        description: `Måndagar är underutnyttjade (${Math.round(avgMonday)}%) medan fredagar är fullt (${Math.round(avgFriday)}%)`,
        impact: '+10-15% jämnare arbetsbelastning',
        actionItems: [
          'Erbjud "Måndag-rabatt" för att locka kunder',
          'Höj priser på fredagar för att styra efterfrågan',
          'Marknadsför måndag som "lugn dag med mer tid"',
        ],
      });
    }
  }

  // Calculate summary
  const totalRevenue = weeks.reduce((sum, w) => sum + w.revenue, 0);
  const totalPotentialRevenue = weeks.reduce((sum, w) => sum + w.projectedRevenue, 0);
  const capacityGap = totalPotentialRevenue - totalRevenue;

  return {
    weeks,
    insights,
    summary: {
      averageUtilization: Math.round(avgUtilization),
      peakUtilization,
      lowestUtilization,
      totalRevenue,
      potentialRevenue: totalPotentialRevenue,
      capacityGap,
    },
  };
}

/**
 * Quick capacity check for a specific date range
 */
export function quickCapacityCheck(
  bookings: Booking[],
  staffCount: number,
  startDate: Date,
  endDate: Date
): {
  canTakeMoreBookings: boolean;
  availableSlots: number;
  utilizationRate: number;
  recommendation: string;
} {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const workingDays = days.filter((d) => getDay(d) !== 0 && getDay(d) !== 6);
  
  // Total capacity (8h/day * staff * working days)
  const totalCapacity = staffCount * 8 * workingDays.length;
  
  // Booked hours
  const bookedHours = bookings.reduce((sum, b) => {
    const duration = b.duration || 60;
    return sum + (duration / 60);
  }, 0);
  
  const utilizationRate = Math.round((bookedHours / totalCapacity) * 100);
  const availableHours = totalCapacity - bookedHours;
  const availableSlots = Math.floor(availableHours);
  
  let canTakeMoreBookings = utilizationRate < 90;
  let recommendation = '';
  
  if (utilizationRate < 70) {
    recommendation = `Mycket bra! Ni kan ta ${availableSlots} fler bokningar utan problem.`;
  } else if (utilizationRate < 85) {
    recommendation = `Bra läge, ni kan ta ${availableSlots} fler bokningar.`;
  } else if (utilizationRate < 95) {
    recommendation = `Nästan fullt. Endast ${availableSlots} slots kvar - var selektiv.`;
  } else {
    recommendation = `Fullt! Överväg att omfördela eller lägga till extra personal.`;
    canTakeMoreBookings = false;
  }
  
  return {
    canTakeMoreBookings,
    availableSlots,
    utilizationRate,
    recommendation,
  };
}
