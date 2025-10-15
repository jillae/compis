
import { prisma } from '@/lib/db';

export type MessageCategory = 'transactional' | 'marketing' | 'loyalty' | 'reminders' | 'surveys';

export class SMSConsentChecker {
  /**
   * Check if customer has consented to receive SMS for a specific category
   */
  static async canSendTo(
    customerId: string,
    category: MessageCategory = 'marketing'
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        communicationPreference: true,
        optOuts: {
          where: {
            channel: { in: ['sms', 'all'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      return { allowed: false, reason: 'Customer not found' };
    }

    // Check if customer has opted out
    if (customer.optOuts.length > 0) {
      return { allowed: false, reason: 'Customer has opted out of SMS' };
    }

    // Check legacy consent field
    if (!customer.consentSms) {
      return { allowed: false, reason: 'Customer has not given SMS consent' };
    }

    // Check communication preferences
    const prefs = customer.communicationPreference;
    
    if (!prefs) {
      // No preferences set, use legacy consent
      return { allowed: true };
    }

    // Check if SMS is enabled
    if (!prefs.smsEnabled) {
      return { allowed: false, reason: 'Customer has disabled SMS' };
    }

    // Check if customer has opted out
    if (prefs.optedOutAt) {
      return { allowed: false, reason: 'Customer has opted out' };
    }

    // Check category-specific consent
    switch (category) {
      case 'transactional':
        if (!prefs.transactional) {
          return { allowed: false, reason: 'Transactional SMS not allowed' };
        }
        break;
      case 'marketing':
        if (!prefs.marketing) {
          return { allowed: false, reason: 'Marketing SMS not allowed' };
        }
        break;
      case 'loyalty':
        if (!prefs.loyalty) {
          return { allowed: false, reason: 'Loyalty SMS not allowed' };
        }
        break;
      case 'reminders':
        if (!prefs.reminders) {
          return { allowed: false, reason: 'Reminder SMS not allowed' };
        }
        break;
      case 'surveys':
        if (!prefs.surveys) {
          return { allowed: false, reason: 'Survey SMS not allowed' };
        }
        break;
    }

    // Check quiet hours
    if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const start = prefs.quietHoursStart;
      const end = prefs.quietHoursEnd;

      // Simple time range check (doesn't handle overnight ranges perfectly)
      if (start < end) {
        if (currentTime >= start && currentTime <= end) {
          return { allowed: false, reason: 'Within customer quiet hours' };
        }
      } else {
        // Overnight range (e.g., 22:00 - 08:00)
        if (currentTime >= start || currentTime <= end) {
          return { allowed: false, reason: 'Within customer quiet hours' };
        }
      }
    }

    // Check frequency limits
    if (prefs.maxPerDay) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const sentToday = await prisma.sMSLog.count({
        where: {
          customerId,
          direction: 'outbound',
          createdAt: { gte: todayStart }
        }
      });

      if (sentToday >= prefs.maxPerDay) {
        return { allowed: false, reason: `Daily limit reached (${prefs.maxPerDay} SMS/day)` };
      }
    }

    if (prefs.maxPerWeek) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const sentThisWeek = await prisma.sMSLog.count({
        where: {
          customerId,
          direction: 'outbound',
          createdAt: { gte: weekStart }
        }
      });

      if (sentThisWeek >= prefs.maxPerWeek) {
        return { allowed: false, reason: `Weekly limit reached (${prefs.maxPerWeek} SMS/week)` };
      }
    }

    return { allowed: true };
  }

  /**
   * Batch check consent for multiple customers
   */
  static async filterAllowedRecipients(
    customerIds: string[],
    category: MessageCategory = 'marketing'
  ): Promise<{
    allowed: string[];
    blocked: Array<{ customerId: string; reason: string }>;
  }> {
    const results = await Promise.all(
      customerIds.map(async (id) => ({
        customerId: id,
        result: await this.canSendTo(id, category)
      }))
    );

    return {
      allowed: results.filter(r => r.result.allowed).map(r => r.customerId),
      blocked: results
        .filter(r => !r.result.allowed)
        .map(r => ({ customerId: r.customerId, reason: r.result.reason || 'Unknown' }))
    };
  }

  /**
   * Record consent given
   */
  static async recordConsent(
    customerId: string,
    method: 'web_form' | 'sms_reply' | 'in_person' | 'import',
    ipAddress?: string
  ): Promise<void> {
    await prisma.customerCommunicationPreference.upsert({
      where: { customerId },
      update: {
        consentGivenAt: new Date(),
        consentMethod: method,
        consentIpAddress: ipAddress,
        consentUpdatedAt: new Date()
      },
      create: {
        customerId,
        smsEnabled: true,
        emailEnabled: true,
        transactional: true,
        marketing: true,
        loyalty: true,
        reminders: true,
        consentGivenAt: new Date(),
        consentMethod: method,
        consentIpAddress: ipAddress
      }
    });

    // Also update legacy consent field
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        consentSms: true,
        consentedAt: new Date()
      }
    });
  }
}
