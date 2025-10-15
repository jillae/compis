
import { prisma } from '@/lib/db';

export class SMSRateLimiter {
  /**
   * Check if clinic can send SMS (rate limit check)
   */
  static async canSend(clinicId: string, count: number = 1): Promise<{
    allowed: boolean;
    reason?: string;
    resetAt?: Date;
  }> {
    const now = new Date();
    
    // Get or create rate limit record
    let rateLimit = await prisma.sMSRateLimit.findUnique({
      where: { clinicId }
    });

    if (!rateLimit) {
      // Create initial rate limit record
      rateLimit = await prisma.sMSRateLimit.create({
        data: {
          clinicId,
          hourResetAt: new Date(now.getTime() + 60 * 60 * 1000), // +1 hour
          dayResetAt: new Date(now.setHours(24, 0, 0, 0)), // Next midnight
          monthResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1), // Next month
        }
      });
    }

    // Reset counters if needed
    const shouldResetHour = now >= rateLimit.hourResetAt;
    const shouldResetDay = now >= rateLimit.dayResetAt;
    const shouldResetMonth = now >= rateLimit.monthResetAt;

    if (shouldResetHour || shouldResetDay || shouldResetMonth) {
      const updateData: any = {};

      if (shouldResetHour) {
        updateData.sentThisHour = 0;
        updateData.hourResetAt = new Date(now.getTime() + 60 * 60 * 1000);
      }

      if (shouldResetDay) {
        updateData.sentToday = 0;
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        updateData.dayResetAt = tomorrow;
      }

      if (shouldResetMonth) {
        updateData.sentThisMonth = 0;
        updateData.spentThisMonth = 0;
        updateData.monthResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      rateLimit = await prisma.sMSRateLimit.update({
        where: { clinicId },
        data: updateData
      });
    }

    // Check rate limits
    if (rateLimit.sentThisHour + count > rateLimit.maxPerHour) {
      return {
        allowed: false,
        reason: `Hourly limit reached (${rateLimit.maxPerHour} SMS/hour)`,
        resetAt: rateLimit.hourResetAt
      };
    }

    if (rateLimit.sentToday + count > rateLimit.maxPerDay) {
      return {
        allowed: false,
        reason: `Daily limit reached (${rateLimit.maxPerDay} SMS/day)`,
        resetAt: rateLimit.dayResetAt
      };
    }

    if (rateLimit.sentThisMonth + count > rateLimit.maxPerMonth) {
      return {
        allowed: false,
        reason: `Monthly limit reached (${rateLimit.maxPerMonth} SMS/month)`,
        resetAt: rateLimit.monthResetAt
      };
    }

    // Check budget limit
    if (rateLimit.budgetSEK) {
      // Estimate cost: ~0.40 SEK per SMS in Sweden
      const estimatedCost = count * 0.40;
      if (rateLimit.spentThisMonth + estimatedCost > rateLimit.budgetSEK) {
        return {
          allowed: false,
          reason: `Monthly budget exceeded (${rateLimit.budgetSEK} SEK)`,
          resetAt: rateLimit.monthResetAt
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Increment SMS counters after successful send
   */
  static async incrementCounters(clinicId: string, count: number = 1): Promise<void> {
    await prisma.sMSRateLimit.update({
      where: { clinicId },
      data: {
        sentThisHour: { increment: count },
        sentToday: { increment: count },
        sentThisMonth: { increment: count }
      }
    });

    // Check if we should send alerts
    const rateLimit = await prisma.sMSRateLimit.findUnique({
      where: { clinicId }
    });

    if (rateLimit) {
      const monthlyUsagePercent = (rateLimit.sentThisMonth / rateLimit.maxPerMonth) * 100;
      const budgetUsagePercent = rateLimit.budgetSEK 
        ? (rateLimit.spentThisMonth / rateLimit.budgetSEK) * 100 
        : 0;

      // Send alert at 80% usage (once per day)
      if (
        (monthlyUsagePercent >= 80 || budgetUsagePercent >= 80) &&
        rateLimit.alertAt80Percent &&
        (!rateLimit.lastAlertSent || 
         new Date().getTime() - rateLimit.lastAlertSent.getTime() > 24 * 60 * 60 * 1000)
      ) {
        await this.sendUsageAlert(clinicId, monthlyUsagePercent, budgetUsagePercent);
        await prisma.sMSRateLimit.update({
          where: { clinicId },
          data: { lastAlertSent: new Date() }
        });
      }
    }
  }

  /**
   * Send usage alert to clinic admins
   */
  private static async sendUsageAlert(
    clinicId: string, 
    usagePercent: number, 
    budgetPercent: number
  ): Promise<void> {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        users: {
          where: { role: 'ADMIN' },
          take: 1
        }
      }
    });

    if (!clinic || !clinic.users.length) return;

    console.log(`⚠️ SMS Usage Alert for ${clinic.name}: ${Math.round(usagePercent)}% used`);
    
    // TODO: Send email alert to admins
    // For now, just log it
  }

  /**
   * Get current rate limit status
   */
  static async getStatus(clinicId: string) {
    const rateLimit = await prisma.sMSRateLimit.findUnique({
      where: { clinicId }
    });

    if (!rateLimit) {
      return {
        sentThisHour: 0,
        sentToday: 0,
        sentThisMonth: 0,
        maxPerHour: 100,
        maxPerDay: 500,
        maxPerMonth: 10000,
        spentThisMonth: 0,
        budgetSEK: null
      };
    }

    return {
      sentThisHour: rateLimit.sentThisHour,
      sentToday: rateLimit.sentToday,
      sentThisMonth: rateLimit.sentThisMonth,
      maxPerHour: rateLimit.maxPerHour,
      maxPerDay: rateLimit.maxPerDay,
      maxPerMonth: rateLimit.maxPerMonth,
      spentThisMonth: rateLimit.spentThisMonth,
      budgetSEK: rateLimit.budgetSEK,
      hourResetAt: rateLimit.hourResetAt,
      dayResetAt: rateLimit.dayResetAt,
      monthResetAt: rateLimit.monthResetAt
    };
  }
}
