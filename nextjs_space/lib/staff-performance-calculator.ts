
/**
 * Staff Performance Calculator
 * Calculates weekly performance metrics for gamification
 * 
 * Wave 3 - Feature 3
 */

import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek, startOfDay, subWeeks } from 'date-fns';

interface StaffWeeklyMetrics {
  staffId: string;
  staffName: string;
  weekStart: Date;
  weekEnd: Date;
  utilization: number;
  revenueGenerated: number;
  totalBookings: number;
  completedBookings: number;
  noShowBookings: number;
  avgTreatmentTime: number;
  avgBookingValue: number;
  rank: number;
  totalStaff: number;
  goalRevenue?: number;
  goalProgress?: number;
}

export class StaffPerformanceCalculator {
  private clinicId: string;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  /**
   * Calculate performance for all staff for a given week
   */
  async calculateWeeklyPerformance(weekOffset: number = 0): Promise<StaffWeeklyMetrics[]> {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Sunday

    // Get all active staff
    const staff = await prisma.staff.findMany({
      where: {
        clinicId: this.clinicId,
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            scheduledTime: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        },
      },
    });

    const metrics: StaffWeeklyMetrics[] = [];

    for (const staffMember of staff) {
      const bookings = staffMember.bookings;
      
      const completedBookings = bookings.filter(b => 
        ['COMPLETED', 'completed'].includes(b.status)
      );
      
      const noShowBookings = bookings.filter(b => 
        ['NO_SHOW', 'no_show'].includes(b.status)
      );

      // Calculate revenue
      const revenueGenerated = completedBookings.reduce((sum, b) => sum + Number(b.price), 0);
      
      // Calculate avg treatment time
      const avgTreatmentTime = completedBookings.length > 0
        ? Math.round(
            completedBookings.reduce((sum, b) => sum + (b.duration || 60), 0) / completedBookings.length
          )
        : 0;

      // Calculate avg booking value
      const avgBookingValue = completedBookings.length > 0
        ? Math.round(revenueGenerated / completedBookings.length)
        : 0;

      // Calculate utilization (hours worked vs hours available)
      const weeklyHours = staffMember.weeklyHours || 40;
      const availableMinutes = weeklyHours * 60;
      const workedMinutes = completedBookings.reduce((sum, b) => sum + (b.duration || 60), 0);
      const utilization = availableMinutes > 0 
        ? Math.round((workedMinutes / availableMinutes) * 100 * 100) / 100 
        : 0;

      // Goal: aim for 60,000 kr/week (example)
      const goalRevenue = 60000;
      const goalProgress = goalRevenue > 0 
        ? Math.min(Math.round((revenueGenerated / goalRevenue) * 100 * 100) / 100, 100)
        : 0;

      metrics.push({
        staffId: staffMember.id,
        staffName: staffMember.name,
        weekStart,
        weekEnd,
        utilization,
        revenueGenerated: Math.round(revenueGenerated),
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        noShowBookings: noShowBookings.length,
        avgTreatmentTime,
        avgBookingValue,
        rank: 0, // Will be calculated below
        totalStaff: staff.length,
        goalRevenue,
        goalProgress,
      });
    }

    // Calculate rankings based on revenue
    metrics.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
    metrics.forEach((metric, index) => {
      metric.rank = index + 1;
    });

    return metrics;
  }

  /**
   * Save weekly performance to database
   */
  async saveWeeklyPerformance(weekOffset: number = 0): Promise<void> {
    const metrics = await this.calculateWeeklyPerformance(weekOffset);

    for (const metric of metrics) {
      // Check if record already exists
      const existing = await prisma.staffPerformance.findUnique({
        where: {
          staffId_weekStart: {
            staffId: metric.staffId,
            weekStart: metric.weekStart,
          },
        },
      });

      if (existing) {
        // Update existing
        await prisma.staffPerformance.update({
          where: {
            staffId_weekStart: {
              staffId: metric.staffId,
              weekStart: metric.weekStart,
            },
          },
          data: {
            utilization: metric.utilization,
            revenueGenerated: metric.revenueGenerated,
            totalBookings: metric.totalBookings,
            completedBookings: metric.completedBookings,
            noShowBookings: metric.noShowBookings,
            avgTreatmentTime: metric.avgTreatmentTime,
            avgBookingValue: metric.avgBookingValue,
            rank: metric.rank,
            totalStaff: metric.totalStaff,
            goalRevenue: metric.goalRevenue,
            goalProgress: metric.goalProgress,
          },
        });
      } else {
        // Create new
        await prisma.staffPerformance.create({
          data: {
            clinicId: this.clinicId,
            staffId: metric.staffId,
            weekStart: metric.weekStart,
            weekEnd: metric.weekEnd,
            utilization: metric.utilization,
            revenueGenerated: metric.revenueGenerated,
            totalBookings: metric.totalBookings,
            completedBookings: metric.completedBookings,
            noShowBookings: metric.noShowBookings,
            avgTreatmentTime: metric.avgTreatmentTime,
            avgBookingValue: metric.avgBookingValue,
            rank: metric.rank,
            totalStaff: metric.totalStaff,
            goalRevenue: metric.goalRevenue,
            goalProgress: metric.goalProgress,
          },
        });
      }
    }
  }

  /**
   * Get performance comparison (current week vs previous weeks)
   */
  async getPerformanceComparison(staffId: string, weeksBack: number = 4): Promise<any> {
    const performances = await prisma.staffPerformance.findMany({
      where: {
        staffId,
        weekStart: {
          gte: subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weeksBack),
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
    });

    if (performances.length === 0) {
      return null;
    }

    const current = performances[0];
    const previous = performances.length > 1 ? performances[1] : null;

    const changes = previous ? {
      utilizationChange: Number(current.utilization) - Number(previous.utilization),
      revenueChange: Number(current.revenueGenerated) - Number(previous.revenueGenerated),
      rankChange: Number(previous.rank) - Number(current.rank), // Positive = improved
    } : null;

    return {
      current,
      previous,
      changes,
      history: performances,
    };
  }
}
