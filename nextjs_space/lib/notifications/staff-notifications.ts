/**
 * StaffNotificationService
 *
 * Hanterar in-dashboard-notiser till personal i KlinikFlow.
 * Notiser lagras i databasen (StaffNotification) och visas i realtid
 * via polling i NotificationBell-komponenten.
 *
 * Typer:
 *  - campaign_reminder  : Påminnelse om planerad kampanj
 *  - loyalty_milestone  : Kund har nått lojalitetsmilstolpe
 *  - customer_alert     : Viktigt kundvarning (t.ex. hög churn-risk)
 *  - schedule_reminder  : Schemalagd påminnelse
 */

import { prisma } from '@/lib/db';

// -------------------------------------------------------------------
// Typer
// -------------------------------------------------------------------
export type NotificationType =
  | 'campaign_reminder'
  | 'loyalty_milestone'
  | 'customer_alert'
  | 'schedule_reminder';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  priority: NotificationPriority;
  expiresAt?: Date;
}

export interface StaffNotificationRecord {
  id: string;
  clinicId: string;
  staffId: string | null;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  priority: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

// -------------------------------------------------------------------
// Klass
// -------------------------------------------------------------------
export class StaffNotificationService {
  /**
   * Skapar en notis för en specifik personalmedlem
   */
  async notify(
    staffId: string,
    clinicId: string,
    notification: NotificationInput
  ): Promise<void> {
    await prisma.staffNotification.create({
      data: {
        clinicId,
        staffId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl ?? null,
        priority: notification.priority,
        expiresAt: notification.expiresAt ?? null,
      },
    });
  }

  /**
   * Skapar en notis för all personal i en klinik (staffId = null)
   */
  async notifyClinic(
    clinicId: string,
    notification: NotificationInput
  ): Promise<void> {
    await prisma.staffNotification.create({
      data: {
        clinicId,
        staffId: null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl ?? null,
        priority: notification.priority,
        expiresAt: notification.expiresAt ?? null,
      },
    });
  }

  /**
   * Hämtar olästa notiser för en personalmedlem (inkl. klinik-notiser)
   */
  async getUnread(
    staffId: string,
    clinicId: string,
    limit = 20
  ): Promise<StaffNotificationRecord[]> {
    const now = new Date();

    return prisma.staffNotification.findMany({
      where: {
        clinicId,
        isRead: false,
        OR: [{ staffId }, { staffId: null }],
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  /**
   * Hämtar alla notiser (lästa + olästa) för en personalmedlem
   */
  async getAll(
    staffId: string,
    clinicId: string,
    limit = 50
  ): Promise<StaffNotificationRecord[]> {
    const now = new Date();

    return prisma.staffNotification.findMany({
      where: {
        clinicId,
        OR: [{ staffId }, { staffId: null }],
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Antal olästa notiser (för badge)
   */
  async getUnreadCount(staffId: string, clinicId: string): Promise<number> {
    const now = new Date();

    return prisma.staffNotification.count({
      where: {
        clinicId,
        isRead: false,
        OR: [{ staffId }, { staffId: null }],
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
    });
  }

  /**
   * Markerar en enskild notis som läst
   */
  async markRead(notificationId: string): Promise<void> {
    await prisma.staffNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Markerar alla notiser för en personalmedlem som lästa
   */
  async markAllRead(staffId: string, clinicId: string): Promise<void> {
    await prisma.staffNotification.updateMany({
      where: {
        clinicId,
        isRead: false,
        OR: [{ staffId }, { staffId: null }],
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Tar bort gamla utgångna notiser (för cron-jobb)
   */
  async pruneExpired(): Promise<number> {
    const result = await prisma.staffNotification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}

export const staffNotificationService = new StaffNotificationService();
