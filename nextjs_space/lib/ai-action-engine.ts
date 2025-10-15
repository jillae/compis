
/**
 * AI Action Engine
 * Generates proactive, actionable recommendations for clinic owners
 * 
 * Wave 3 - Feature 1
 */

import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek, addWeeks, startOfDay, subMonths } from 'date-fns';
import { ActionCategory, ActionStatus } from '@prisma/client';

interface ActionRecommendation {
  priority: number; // 1 = critical, 2 = high, 3 = medium
  title: string;
  category: ActionCategory;
  expectedImpact: number;
  description: string;
  reasoning: string;
  steps: Array<{
    description: string;
    completed: boolean;
  }>;
  evidence: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
  }>;
}

export class AIActionEngine {
  private clinicId: string;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  /**
   * Generate all recommendations for the current week
   */
  async generateRecommendations(): Promise<ActionRecommendation[]> {
    const recommendations: ActionRecommendation[] = [];

    // Run all analyzers in parallel
    const [
      capacityRec,
      pricingRec,
      retentionRec,
      noShowRec,
      staffingRec,
    ] = await Promise.all([
      this.analyzeCapacityOpportunities(),
      this.analyzePricingOpportunities(),
      this.analyzeRetentionOpportunities(),
      this.analyzeNoShowRisks(),
      this.analyzeStaffingOpportunities(),
    ]);

    // Collect all recommendations
    if (capacityRec) recommendations.push(capacityRec);
    if (pricingRec) recommendations.push(pricingRec);
    if (retentionRec) recommendations.push(retentionRec);
    if (noShowRec) recommendations.push(noShowRec);
    if (staffingRec) recommendations.push(staffingRec);

    // Sort by priority (1 = highest)
    recommendations.sort((a, b) => a.priority - b.priority);

    return recommendations;
  }

  /**
   * Analyze capacity and identify low utilization periods
   */
  private async analyzeCapacityOpportunities(): Promise<ActionRecommendation | null> {
    // Get bookings for next 2 weeks
    const now = new Date();
    const twoWeeksFromNow = addWeeks(now, 2);

    const bookings = await prisma.booking.findMany({
      where: {
        clinicId: this.clinicId,
        scheduledTime: {
          gte: now,
          lte: twoWeeksFromNow,
        },
        status: {
          notIn: ['CANCELLED', 'cancelled'],
        },
      },
      include: {
        staff: true,
      },
    });

    // Get total staff working hours
    const staff = await prisma.staff.findMany({
      where: {
        clinicId: this.clinicId,
        isActive: true,
      },
    });

    const totalWeeklyHours = staff.reduce((sum, s) => sum + (s.weeklyHours || 40), 0);
    const availableHoursNextTwoWeeks = totalWeeklyHours * 2;

    // Calculate booked hours
    const bookedHours = bookings.reduce((sum, b) => sum + ((b.duration || 60) / 60), 0);
    const utilization = (bookedHours / availableHoursNextTwoWeeks) * 100;

    // If utilization is below 60%, recommend action
    if (utilization < 60) {
      const availableHours = availableHoursNextTwoWeeks - bookedHours;
      const avgBookingValue = await this.getAverageBookingValue();
      const potentialRevenue = Math.floor(availableHours * avgBookingValue);

      return {
        priority: utilization < 40 ? 1 : 2, // Critical if <40%, High if 40-60%
        title: `Låg beläggning: Endast ${Math.round(utilization)}% bokad nästa 2 veckor`,
        category: 'CAPACITY_OPTIMIZATION' as ActionCategory,
        expectedImpact: potentialRevenue,
        description: `Du har ${Math.round(availableHours)} lediga timmar nästa 2 veckor. Detta är en möjlighet att öka intäkterna genom riktad marknadsföring.`,
        reasoning: `Med en genomsnittlig intäkt på ${Math.round(avgBookingValue)} kr/timme kan du tjäna ytterligare ${potentialRevenue.toLocaleString('sv-SE')} kr genom att fylla dessa lediga tider.`,
        steps: [
          {
            description: 'Kör en "Last Minute" kampanj på Instagram/Facebook',
            completed: false,
          },
          {
            description: 'Erbjud 15% rabatt för bokningar inom 7 dagar',
            completed: false,
          },
          {
            description: 'Skicka SMS till at-risk kunder med specialerbjudande',
            completed: false,
          },
          {
            description: 'Öppna drop-in tider för populära behandlingar',
            completed: false,
          },
        ],
        evidence: [
          {
            metric: 'Beläggning nästa 2 veckor',
            currentValue: utilization,
            targetValue: 85,
          },
          {
            metric: 'Lediga timmar',
            currentValue: availableHours,
            targetValue: 0,
          },
          {
            metric: 'Potentiell revenue',
            currentValue: 0,
            targetValue: potentialRevenue,
          },
        ],
      };
    }

    return null;
  }

  /**
   * Analyze pricing vs competitors and market
   */
  private async analyzePricingOpportunities(): Promise<ActionRecommendation | null> {
    // Get services
    const services = await prisma.service.findMany({
      where: {
        clinicId: this.clinicId,
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            scheduledTime: {
              gte: subMonths(new Date(), 3),
            },
            status: {
              in: ['COMPLETED', 'completed'],
            },
          },
        },
      },
    });

    // Find underpriced services (simple heuristic: high demand, low price)
    let underpricedService = null;
    let maxOpportunity = 0;

    for (const service of services) {
      const bookingCount = service.bookings.length;
      const avgPrice = Number(service.price);

      // If service is popular (>10 bookings last 3 months) and price is low
      if (bookingCount > 10 && avgPrice < 1200) {
        // Market average for laser/aesthetic treatments is ~1500 kr
        const marketAvg = 1500;
        const priceDiff = marketAvg - avgPrice;
        const monthlyBookings = Math.floor(bookingCount / 3);
        const monthlyOpportunity = priceDiff * monthlyBookings;

        if (monthlyOpportunity > maxOpportunity) {
          maxOpportunity = monthlyOpportunity;
          underpricedService = {
            name: service.name,
            currentPrice: avgPrice,
            suggestedPrice: Math.round(avgPrice * 1.2), // 20% increase
            monthlyBookings,
            expectedImpact: Math.round(monthlyOpportunity * 0.8), // Conservative estimate
          };
        }
      }
    }

    if (underpricedService && maxOpportunity > 15000) {
      return {
        priority: 2,
        title: `Prisjustering: ${underpricedService.name} är underprissatt`,
        category: 'PRICING' as ActionCategory,
        expectedImpact: underpricedService.expectedImpact,
        description: `Din ${underpricedService.name} ligger ${Math.round(((underpricedService.suggestedPrice - underpricedService.currentPrice) / underpricedService.currentPrice) * 100)}% under marknadspris. Detta är en möjlighet att öka marginalen.`,
        reasoning: `Med ${underpricedService.monthlyBookings} bokningar/månad kan en prisjustering från ${underpricedService.currentPrice} kr till ${underpricedService.suggestedPrice} kr generera ytterligare ${underpricedService.expectedImpact.toLocaleString('sv-SE')} kr/månad.`,
        steps: [
          {
            description: `Höj priset från ${underpricedService.currentPrice} kr till ${underpricedService.suggestedPrice} kr`,
            completed: false,
          },
          {
            description: 'Behåll nuvarande pris för "early bird" (bokning >2 veckor framåt)',
            completed: false,
          },
          {
            description: 'Kommunicera värdet av behandlingen till kunder',
            completed: false,
          },
          {
            description: 'Övervaka bokningsvolym efter prisjustering',
            completed: false,
          },
        ],
        evidence: [
          {
            metric: 'Nuvarande pris',
            currentValue: underpricedService.currentPrice,
            targetValue: underpricedService.suggestedPrice,
          },
          {
            metric: 'Bokningar per månad',
            currentValue: underpricedService.monthlyBookings,
            targetValue: underpricedService.monthlyBookings,
          },
          {
            metric: 'Extra intäkt/månad',
            currentValue: 0,
            targetValue: underpricedService.expectedImpact,
          },
        ],
      };
    }

    return null;
  }

  /**
   * Analyze customer retention and identify at-risk customers
   */
  private async analyzeRetentionOpportunities(): Promise<ActionRecommendation | null> {
    // Get customers with no bookings in last 60 days but had bookings before
    const sixtyDaysAgo = subMonths(new Date(), 2);
    const threeMonthsAgo = subMonths(new Date(), 3);

    const atRiskCustomers = await prisma.customer.findMany({
      where: {
        clinicId: this.clinicId,
        lastVisitAt: {
          gte: threeMonthsAgo,
          lt: sixtyDaysAgo,
        },
        totalVisits: {
          gte: 2, // Had at least 2 visits
        },
      },
      include: {
        bookings: {
          where: {
            status: {
              in: ['COMPLETED', 'completed'],
            },
          },
          orderBy: {
            scheduledTime: 'desc',
          },
          take: 1,
        },
      },
    });

    if (atRiskCustomers.length > 5) {
      // Calculate potential value
      const avgCustomerValue = await this.getAverageCustomerLifetimeValue();
      const potentialRevenue = Math.floor(atRiskCustomers.length * avgCustomerValue * 0.3); // Assume 30% win-back rate

      return {
        priority: 2,
        title: `${atRiskCustomers.length} kunder riskerar att churna`,
        category: 'CUSTOMER_RETENTION' as ActionCategory,
        expectedImpact: potentialRevenue,
        description: `Du har ${atRiskCustomers.length} kunder som inte bokat på 60+ dagar men hade regelbundna besök tidigare. Win-back kampanj kan rädda dessa relationer.`,
        reasoning: `Med en genomsnittlig kundvärde på ${Math.round(avgCustomerValue)} kr och 30% win-back rate kan du återfå ${potentialRevenue.toLocaleString('sv-SE')} kr i intäkter.`,
        steps: [
          {
            description: 'Skapa personaliserade win-back meddelanden',
            completed: false,
          },
          {
            description: 'Erbjud 20% rabatt på nästa behandling',
            completed: false,
          },
          {
            description: 'Skicka SMS till de 20 mest värdefulla kunderna först',
            completed: false,
          },
          {
            description: 'Följ upp efter 1 vecka med påminnelse',
            completed: false,
          },
        ],
        evidence: [
          {
            metric: 'At-risk kunder',
            currentValue: atRiskCustomers.length,
            targetValue: 0,
          },
          {
            metric: 'Förväntad win-back rate',
            currentValue: 0,
            targetValue: 30,
          },
          {
            metric: 'Potentiell revenue',
            currentValue: 0,
            targetValue: potentialRevenue,
          },
        ],
      };
    }

    return null;
  }

  /**
   * Analyze no-show patterns and risks
   */
  private async analyzeNoShowRisks(): Promise<ActionRecommendation | null> {
    // Get upcoming high-risk bookings
    const now = new Date();
    const oneWeekFromNow = addWeeks(now, 1);

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        clinicId: this.clinicId,
        scheduledTime: {
          gte: now,
          lte: oneWeekFromNow,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        customer: true,
      },
    });

    // Simple no-show risk scoring
    let highRiskBookings = 0;
    let potentialLoss = 0;

    for (const booking of upcomingBookings) {
      const customer = booking.customer;
      const noShowRate = customer.totalBookings > 0 
        ? (customer.noShowCount / customer.totalBookings) * 100 
        : 0;

      // Risk factors: high no-show history, first-time customer, no email
      let riskScore = noShowRate * 0.5;
      if (customer.totalBookings === 0) riskScore += 30;
      if (!customer.email) riskScore += 20;

      if (riskScore > 50) {
        highRiskBookings++;
        potentialLoss += Number(booking.price);
      }
    }

    if (highRiskBookings >= 5) {
      const preventableRevenue = Math.floor(potentialLoss * 0.4); // Assume we can prevent 40%

      return {
        priority: 1, // Critical
        title: `${highRiskBookings} bokningar nästa vecka har hög no-show risk`,
        category: 'CAPACITY_OPTIMIZATION' as ActionCategory,
        expectedImpact: preventableRevenue,
        description: `Du har ${highRiskBookings} bokningar med hög sannolikhet för no-show. Proaktiva åtgärder kan förhindra ${Math.round(potentialLoss)} kr i förlorad intäkt.`,
        reasoning: `Genom att skicka bekräftelse-SMS och överbooka strategiskt kan du återfå ~40% av dessa tider, vilket motsvarar ${preventableRevenue.toLocaleString('sv-SE')} kr.`,
        steps: [
          {
            description: 'Skicka bekräftelse-SMS till alla high-risk bokningar idag',
            completed: false,
          },
          {
            description: 'Ring kunder med >70% no-show sannolikhet',
            completed: false,
          },
          {
            description: 'Aktivera overbooking för dessa tider (1 extra bokning per slot)',
            completed: false,
          },
          {
            description: 'Ha drop-in som backup om overbooking händer',
            completed: false,
          },
        ],
        evidence: [
          {
            metric: 'High-risk bokningar',
            currentValue: highRiskBookings,
            targetValue: 0,
          },
          {
            metric: 'Risk för förlorad intäkt',
            currentValue: potentialLoss,
            targetValue: 0,
          },
          {
            metric: 'Förhindrad förlust',
            currentValue: 0,
            targetValue: preventableRevenue,
          },
        ],
      };
    }

    return null;
  }

  /**
   * Analyze staffing and identify optimization opportunities
   */
  private async analyzeStaffingOpportunities(): Promise<ActionRecommendation | null> {
    // Get staff utilization for last month
    const oneMonthAgo = subMonths(new Date(), 1);
    const now = new Date();

    const staffWithBookings = await prisma.staff.findMany({
      where: {
        clinicId: this.clinicId,
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            scheduledTime: {
              gte: oneMonthAgo,
              lte: now,
            },
            status: {
              in: ['COMPLETED', 'completed'],
            },
          },
        },
      },
    });

    // Calculate utilization
    const staffMetrics = staffWithBookings.map(staff => {
      const weeklyHours = staff.weeklyHours || 40;
      const totalAvailableHours = weeklyHours * 4; // 4 weeks
      const bookedHours = staff.bookings.reduce((sum, b) => sum + ((b.duration || 60) / 60), 0);
      const utilization = (bookedHours / totalAvailableHours) * 100;

      return {
        name: staff.name,
        utilization,
        bookedHours,
        availableHours: totalAvailableHours - bookedHours,
      };
    });

    // Find under-utilized staff
    const underUtilized = staffMetrics.filter(s => s.utilization < 60);

    if (underUtilized.length > 0) {
      const totalWastedHours = underUtilized.reduce((sum, s) => sum + s.availableHours, 0);
      const avgBookingValue = await this.getAverageBookingValue();
      const potentialRevenue = Math.floor(totalWastedHours * avgBookingValue * 0.5); // Assume 50% can be filled

      return {
        priority: 3, // Medium
        title: `${underUtilized.length} personal har låg beläggning (<60%)`,
        category: 'STAFFING' as ActionCategory,
        expectedImpact: potentialRevenue,
        description: `${underUtilized.map(s => s.name).join(', ')} har ${Math.round(totalWastedHours)} lediga timmar senaste månaden. Optimera schemaläggning eller marknadsför deras specialitet.`,
        reasoning: `Genom att fylla 50% av dessa lediga timmar kan du öka intäkterna med ${potentialRevenue.toLocaleString('sv-SE')} kr/månad.`,
        steps: [
          {
            description: 'Analysera varför vissa tider är populärare än andra',
            completed: false,
          },
          {
            description: 'Marknadsför under-bokade behandlares specialiteter',
            completed: false,
          },
          {
            description: 'Justera schema så att populära tider får mer personal',
            completed: false,
          },
          {
            description: 'Överväg tvärträning så personal kan täcka fler behandlingar',
            completed: false,
          },
        ],
        evidence: [
          {
            metric: 'Under-utnyttjade personal',
            currentValue: underUtilized.length,
            targetValue: 0,
          },
          {
            metric: 'Lediga timmar/månad',
            currentValue: totalWastedHours,
            targetValue: 0,
          },
          {
            metric: 'Potentiell extra intäkt',
            currentValue: 0,
            targetValue: potentialRevenue,
          },
        ],
      };
    }

    return null;
  }

  // Helper methods
  private async getAverageBookingValue(): Promise<number> {
    const result = await prisma.booking.aggregate({
      where: {
        clinicId: this.clinicId,
        status: {
          in: ['COMPLETED', 'completed'],
        },
        scheduledTime: {
          gte: subMonths(new Date(), 3),
        },
      },
      _avg: {
        price: true,
      },
    });

    return Number(result._avg.price) || 800; // Default 800 kr if no data
  }

  private async getAverageCustomerLifetimeValue(): Promise<number> {
    const result = await prisma.customer.aggregate({
      where: {
        clinicId: this.clinicId,
        totalVisits: {
          gte: 1,
        },
      },
      _avg: {
        totalSpent: true,
      },
    });

    return Number(result._avg.totalSpent) || 3000; // Default 3000 kr if no data
  }
}
