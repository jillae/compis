/**
 * Campaign Reminder Logic
 *
 * Kontrollerar vilka kampanjer som är planerade för idag/denna vecka
 * och skapar StaffNotification-notiser till all personal i kliniken.
 *
 * Kan anropas av:
 *  - Cron-jobb (t.ex. varje morgon kl 07:00)
 *  - /api/cron/campaign-reminders endpoint
 */

import { prisma } from '@/lib/db';
import { staffNotificationService } from '@/lib/notifications/staff-notifications';

export interface CampaignReminderResult {
  clinicId: string;
  campaignsFound: number;
  notificationsCreated: number;
}

/**
 * Hämtar kampanjer som ska skickas idag eller imorgon
 * och skapar påminnelsenotiser till personal
 */
export async function checkAndNotifyCampaignReminders(): Promise<
  CampaignReminderResult[]
> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  // Hitta schemalagda kampanjer inom 24h
  const upcomingCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'scheduled',
      scheduleType: 'scheduled',
      scheduleAt: {
        gte: now,
        lte: tomorrow,
      },
    },
    include: {
      clinic: {
        select: { id: true, name: true },
      },
    },
    orderBy: { scheduleAt: 'asc' },
  });

  const results: CampaignReminderResult[] = [];
  const processed = new Set<string>(); // clinicId → campaign dedup

  for (const campaign of upcomingCampaigns) {
    const key = `${campaign.clinicId}:${campaign.id}`;
    if (processed.has(key)) continue;
    processed.add(key);

    const scheduleAt = campaign.scheduleAt!;
    const hoursUntil = Math.round(
      (scheduleAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    const timeLabel =
      hoursUntil <= 1
        ? 'inom 1 timme'
        : hoursUntil < 24
        ? `om ${hoursUntil} timmar`
        : 'imorgon';

    const recipientCount = campaign.estimatedReach ?? 0;
    const recipientText =
      recipientCount > 0 ? ` till ${recipientCount} kunder` : '';

    await staffNotificationService.notifyClinic(campaign.clinicId, {
      type: 'campaign_reminder',
      title: `Kampanj planerad: ${campaign.name}`,
      message: `Dags att skicka kampanj "${campaign.name}"${recipientText} – ${timeLabel}. Kontrollera att allt är klart!`,
      actionUrl: `/dashboard/campaigns`,
      priority: hoursUntil <= 2 ? 'high' : 'medium',
      expiresAt: new Date(scheduleAt.getTime() + 2 * 60 * 60 * 1000), // Utgår 2h efter planerad sändning
    });

    // Samla resultat per klinik
    const existing = results.find((r) => r.clinicId === campaign.clinicId);
    if (existing) {
      existing.campaignsFound++;
      existing.notificationsCreated++;
    } else {
      results.push({
        clinicId: campaign.clinicId,
        campaignsFound: 1,
        notificationsCreated: 1,
      });
    }
  }

  return results;
}

/**
 * Skapar en kampanjpåminnelse manuellt för en specifik kampanj
 */
export async function notifyCampaignReady(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      clinic: { select: { id: true, name: true } },
    },
  });

  if (!campaign) return;

  const recipientCount = campaign.estimatedReach ?? 0;
  const recipientText =
    recipientCount > 0 ? ` till ${recipientCount} kunder` : '';

  await staffNotificationService.notifyClinic(campaign.clinicId, {
    type: 'campaign_reminder',
    title: `Dags att skicka: ${campaign.name}`,
    message: `Kampanjen "${campaign.name}"${recipientText} är redo att skickas. Gå till Kampanjer för att granska och skicka.`,
    actionUrl: `/dashboard/campaigns`,
    priority: 'high',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
}

/**
 * Skapar en lojalitetsmilstolpe-notis när kund når en ny nivå
 */
export async function notifyLoyaltyMilestone(
  clinicId: string,
  customerName: string,
  newLevel: string,
  cardId: string
): Promise<void> {
  const levelMap: Record<string, string> = {
    bronze: 'Brons',
    silver: 'Silver',
    gold: 'Guld',
  };

  await staffNotificationService.notifyClinic(clinicId, {
    type: 'loyalty_milestone',
    title: `Kund uppgraderad till ${levelMap[newLevel] ?? newLevel}!`,
    message: `${customerName} har nått ${levelMap[newLevel] ?? newLevel}-nivå i lojalitetsprogrammet. 🌟`,
    actionUrl: `/dashboard/loyalty`,
    priority: 'low',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dagar
  });
}
