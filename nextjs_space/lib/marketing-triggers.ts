
import { prisma } from '@/lib/db';
import { differenceInDays } from 'date-fns';

export interface TriggerConditions {
  // Health-based triggers
  healthStatus?: 'EXCELLENT' | 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  healthScoreMin?: number;
  healthScoreMax?: number;
  
  // Time-based triggers
  daysSinceLastVisit?: number;
  daysSinceFirstVisit?: number;
  
  // Value-based triggers
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  
  // Engagement triggers
  minVisits?: number;
  maxVisits?: number;
  minNoShows?: number;
  maxNoShows?: number;
  
  // Special occasions
  daysToBirthday?: number; // e.g., 7 for 7 days before birthday
  
  // Milestone triggers
  visitMilestone?: number; // e.g., 10th visit
  lifetimeValueMilestone?: number; // e.g., 10000 SEK
}

/**
 * Check if a customer matches trigger conditions
 */
export async function checkTriggerConditions(
  customerId: string,
  conditions: TriggerConditions
): Promise<boolean> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      healthScore: true,
      healthStatus: true,
      lastVisitAt: true,
      firstVisitAt: true,
      lifetimeValue: true,
      totalVisits: true,
      noShowCount: true,
      dateOfBirth: true,
    },
  });

  if (!customer) return false;

  // Health status check
  if (conditions.healthStatus && customer.healthStatus !== conditions.healthStatus) {
    return false;
  }

  // Health score range
  if (conditions.healthScoreMin !== undefined && (customer.healthScore || 0) < conditions.healthScoreMin) {
    return false;
  }
  if (conditions.healthScoreMax !== undefined && (customer.healthScore || 0) > conditions.healthScoreMax) {
    return false;
  }

  // Days since last visit
  if (conditions.daysSinceLastVisit && customer.lastVisitAt) {
    const daysSince = differenceInDays(new Date(), customer.lastVisitAt);
    if (daysSince < conditions.daysSinceLastVisit) {
      return false;
    }
  }

  // Days since first visit
  if (conditions.daysSinceFirstVisit && customer.firstVisitAt) {
    const daysSince = differenceInDays(new Date(), customer.firstVisitAt);
    if (daysSince < conditions.daysSinceFirstVisit) {
      return false;
    }
  }

  // Lifetime value range
  const ltv = customer.lifetimeValue?.toNumber() || 0;
  if (conditions.minLifetimeValue !== undefined && ltv < conditions.minLifetimeValue) {
    return false;
  }
  if (conditions.maxLifetimeValue !== undefined && ltv > conditions.maxLifetimeValue) {
    return false;
  }

  // Visit count range
  if (conditions.minVisits !== undefined && (customer.totalVisits || 0) < conditions.minVisits) {
    return false;
  }
  if (conditions.maxVisits !== undefined && (customer.totalVisits || 0) > conditions.maxVisits) {
    return false;
  }

  // No-show count range
  if (conditions.minNoShows !== undefined && (customer.noShowCount || 0) < conditions.minNoShows) {
    return false;
  }
  if (conditions.maxNoShows !== undefined && (customer.noShowCount || 0) > conditions.maxNoShows) {
    return false;
  }

  // Birthday trigger
  if (conditions.daysToBirthday !== undefined && customer.dateOfBirth) {
    const today = new Date();
    const birthday = new Date(customer.dateOfBirth);
    birthday.setFullYear(today.getFullYear());
    
    if (birthday < today) {
      birthday.setFullYear(today.getFullYear() + 1);
    }
    
    const daysUntilBirthday = differenceInDays(birthday, today);
    if (daysUntilBirthday !== conditions.daysToBirthday) {
      return false;
    }
  }

  // Visit milestone
  if (conditions.visitMilestone !== undefined && customer.totalVisits !== conditions.visitMilestone) {
    return false;
  }

  // LTV milestone
  if (conditions.lifetimeValueMilestone !== undefined) {
    // Check if customer just crossed the milestone (within reasonable range)
    if (Math.abs(ltv - conditions.lifetimeValueMilestone) > 500) {
      return false;
    }
  }

  return true;
}

/**
 * Check if customer can receive trigger (cooldown, max executions, opt-out)
 */
export async function canExecuteTrigger(
  triggerId: string,
  customerId: string,
  trigger: {
    maxExecutionsPerCustomer: number;
    cooldownDays: number;
    maxDailyExecutions: number;
  }
): Promise<{ canExecute: boolean; reason?: string }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      consentSms: true,
      consentEmail: true,
      phone: true,
      email: true,
      optOuts: true,
    },
  });

  if (!customer) {
    return { canExecute: false, reason: 'customer_not_found' };
  }

  // Check opt-out status (if any opt-out exists, customer has opted out)
  const hasOptedOut = customer.optOuts && customer.optOuts.length > 0;
  if (hasOptedOut) {
    return { canExecute: false, reason: 'opt_out' };
  }

  // Check consent
  if (!customer.consentSms && !customer.consentEmail) {
    return { canExecute: false, reason: 'no_consent' };
  }

  // Check if customer has contact info
  if (!customer.phone && !customer.email) {
    return { canExecute: false, reason: 'no_contact_info' };
  }

  // Check max executions per customer
  const executionCount = await prisma.triggerExecution.count({
    where: {
      triggerId,
      customerId,
      status: { in: ['sent', 'delivered'] },
    },
  });

  if (executionCount >= trigger.maxExecutionsPerCustomer) {
    return { canExecute: false, reason: 'max_executions' };
  }

  // Check cooldown period
  const lastExecution = await prisma.triggerExecution.findFirst({
    where: {
      triggerId,
      customerId,
      status: { in: ['sent', 'delivered'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (lastExecution) {
    const daysSinceLastExecution = differenceInDays(new Date(), lastExecution.createdAt);
    if (daysSinceLastExecution < trigger.cooldownDays) {
      return { canExecute: false, reason: 'cooldown' };
    }
  }

  // Check daily execution limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyExecutionCount = await prisma.triggerExecution.count({
    where: {
      triggerId,
      createdAt: { gte: today },
    },
  });

  if (dailyExecutionCount >= trigger.maxDailyExecutions) {
    return { canExecute: false, reason: 'daily_limit' };
  }

  return { canExecute: true };
}

/**
 * Personalize message with customer data
 */
export function personalizeMessage(
  template: string,
  customer: {
    name?: string | null;
    firstName?: string | null;
    totalVisits?: number;
    lifetimeValue?: any;
  },
  offer?: {
    type: 'discount' | 'freebie';
    value: number;
    unit: 'percent' | 'sek' | 'item';
    description?: string;
  }
): string {
  let message = template;

  // Replace customer variables
  const firstName = customer.firstName || customer.name?.split(' ')[0] || 'kund';
  message = message.replace(/\{firstName\}/g, firstName);
  message = message.replace(/\{name\}/g, customer.name || 'kund');
  message = message.replace(/\{totalVisits\}/g, String(customer.totalVisits || 0));
  
  const ltv = customer.lifetimeValue?.toNumber?.() || 0;
  message = message.replace(/\{lifetimeValue\}/g, String(Math.round(ltv)));

  // Replace offer variables if present
  if (offer) {
    if (offer.type === 'discount') {
      if (offer.unit === 'percent') {
        message = message.replace(/\{offer\}/g, `${offer.value}% rabatt`);
      } else {
        message = message.replace(/\{offer\}/g, `${offer.value} kr rabatt`);
      }
    } else if (offer.type === 'freebie') {
      message = message.replace(/\{offer\}/g, offer.description || 'en gratis behandling');
    }
  }

  return message;
}

/**
 * Execute a marketing trigger for eligible customers
 */
export async function executeTrigger(triggerId: string): Promise<{
  executed: number;
  skipped: number;
  failed: number;
  details: Array<{
    customerId: string;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }>;
}> {
  const trigger = await prisma.marketingTrigger.findUnique({
    where: { id: triggerId },
    include: { clinic: true },
  });

  if (!trigger || !trigger.isActive) {
    throw new Error('Trigger not found or inactive');
  }

  const conditions = trigger.conditions as TriggerConditions;

  // Get all active customers for the clinic
  const customers = await prisma.customer.findMany({
    where: {
      clinicId: trigger.clinicId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      phone: true,
      email: true,
      consentSms: true,
      consentEmail: true,
      healthScore: true,
      healthStatus: true,
      lastVisitAt: true,
      firstVisitAt: true,
      lifetimeValue: true,
      totalVisits: true,
      noShowCount: true,
      dateOfBirth: true,
    },
  });

  const results = {
    executed: 0,
    skipped: 0,
    failed: 0,
    details: [] as Array<{
      customerId: string;
      status: 'sent' | 'skipped' | 'failed';
      reason?: string;
    }>,
  };

  for (const customer of customers) {
    try {
      // Check if customer matches trigger conditions
      const matchesConditions = await checkTriggerConditions(customer.id, conditions);
      if (!matchesConditions) {
        results.skipped++;
        results.details.push({
          customerId: customer.id,
          status: 'skipped',
          reason: 'conditions_not_met',
        });
        continue;
      }

      // Check if customer can receive trigger
      const { canExecute, reason } = await canExecuteTrigger(triggerId, customer.id, {
        maxExecutionsPerCustomer: trigger.maxExecutionsPerCustomer,
        cooldownDays: trigger.cooldownDays,
        maxDailyExecutions: trigger.maxDailyExecutions,
      });

      if (!canExecute) {
        results.skipped++;
        
        // Log execution as skipped
        await prisma.triggerExecution.create({
          data: {
            triggerId,
            customerId: customer.id,
            clinicId: trigger.clinicId,
            status: 'skipped',
            skippedReason: reason,
          },
        });

        results.details.push({
          customerId: customer.id,
          status: 'skipped',
          reason,
        });
        continue;
      }

      // Personalize message
      const offer = trigger.includeOffer && trigger.offerDetails 
        ? (trigger.offerDetails as any)
        : undefined;
        
      const personalizedMessage = trigger.usePersonalization
        ? personalizeMessage(trigger.messageBody, customer, offer)
        : trigger.messageBody;

      // Determine channel and recipient
      const channel = trigger.channel;
      const recipient = channel === 'email' ? customer.email : customer.phone;

      if (!recipient) {
        results.skipped++;
        await prisma.triggerExecution.create({
          data: {
            triggerId,
            customerId: customer.id,
            clinicId: trigger.clinicId,
            status: 'skipped',
            skippedReason: 'no_contact_info',
          },
        });
        results.details.push({
          customerId: customer.id,
          status: 'skipped',
          reason: 'no_contact_info',
        });
        continue;
      }

      // Create message record
      const message = await prisma.message.create({
        data: {
          clinicId: trigger.clinicId,
          customerId: customer.id,
          channel,
          subject: trigger.subject,
          body: personalizedMessage,
          to: recipient,
          status: 'pending',
        },
      });

      // Create trigger execution record
      const execution = await prisma.triggerExecution.create({
        data: {
          triggerId,
          customerId: customer.id,
          clinicId: trigger.clinicId,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Update trigger stats
      await prisma.marketingTrigger.update({
        where: { id: triggerId },
        data: {
          totalExecutions: { increment: 1 },
          successfulSends: { increment: 1 },
        },
      });

      results.executed++;
      results.details.push({
        customerId: customer.id,
        status: 'sent',
      });
    } catch (error) {
      console.error(`Error executing trigger for customer ${customer.id}:`, error);
      results.failed++;
      
      await prisma.triggerExecution.create({
        data: {
          triggerId,
          customerId: customer.id,
          clinicId: trigger.clinicId,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      await prisma.marketingTrigger.update({
        where: { id: triggerId },
        data: {
          failedSends: { increment: 1 },
        },
      });

      results.details.push({
        customerId: customer.id,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update last checked time
  await prisma.marketingTrigger.update({
    where: { id: triggerId },
    data: { lastCheckedAt: new Date() },
  });

  return results;
}

/**
 * Execute all active triggers for a clinic
 */
export async function executeAllTriggers(clinicId: string): Promise<{
  totalExecuted: number;
  totalSkipped: number;
  totalFailed: number;
  triggers: Array<{
    triggerId: string;
    triggerName: string;
    executed: number;
    skipped: number;
    failed: number;
  }>;
}> {
  const triggers = await prisma.marketingTrigger.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    orderBy: { priority: 'desc' }, // Execute high priority triggers first
  });

  const results = {
    totalExecuted: 0,
    totalSkipped: 0,
    totalFailed: 0,
    triggers: [] as Array<{
      triggerId: string;
      triggerName: string;
      executed: number;
      skipped: number;
      failed: number;
    }>,
  };

  for (const trigger of triggers) {
    const result = await executeTrigger(trigger.id);
    
    results.totalExecuted += result.executed;
    results.totalSkipped += result.skipped;
    results.totalFailed += result.failed;
    
    results.triggers.push({
      triggerId: trigger.id,
      triggerName: trigger.name,
      executed: result.executed,
      skipped: result.skipped,
      failed: result.failed,
    });
  }

  return results;
}

/**
 * Get trigger performance metrics
 */
export async function getTriggerMetrics(triggerId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const executions = await prisma.triggerExecution.findMany({
    where: {
      triggerId,
      createdAt: { gte: startDate },
    },
    select: {
      status: true,
      costSEK: true,
      revenueSEK: true,
      skippedReason: true,
    },
  });

  const sent = executions.filter(e => e.status === 'sent').length;
  const skipped = executions.filter(e => e.status === 'skipped').length;
  const failed = executions.filter(e => e.status === 'failed').length;

  const totalCost = executions.reduce((sum, e) => sum + (e.costSEK || 0), 0);
  const totalRevenue = executions.reduce((sum, e) => sum + (e.revenueSEK || 0), 0);
  const roas = totalCost > 0 ? totalRevenue / totalCost : 0;

  const skipReasons = executions
    .filter(e => e.status === 'skipped' && e.skippedReason)
    .reduce((acc, e) => {
      const reason = e.skippedReason!;
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  return {
    sent,
    skipped,
    failed,
    totalCost,
    totalRevenue,
    roas,
    skipReasons,
    conversionRate: sent > 0 ? (totalRevenue > 0 ? 1 : 0) : 0, // Simplified
  };
}
