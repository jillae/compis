
/**
 * Staff Notification Service
 * 
 * Send SMS notifications to staff about:
 * - Shift assignments
 * - Shift changes
 * - Leave approvals/rejections
 * - Clock-in reminders
 */

import { prisma } from '../db';
import { SMSService, EnhancedSendParams } from '../sms/sms-service';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const smsService = new SMSService();

export interface NotificationOptions {
  clinicId: string;
  staffId: string;
  type: 'shift_assigned' | 'shift_changed' | 'shift_cancelled' | 'leave_approved' | 'leave_rejected' | 'clock_in_reminder';
  metadata?: any;
}

/**
 * Send notification to staff member
 */
export async function notifyStaff(options: NotificationOptions): Promise<void> {
  const { clinicId, staffId, type, metadata } = options;

  try {
    // Get staff info
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        name: true,
        phone: true,
      },
    });

    if (!staff) {
      console.error(`[StaffNotification] Staff not found: ${staffId}`);
      return;
    }

    if (!staff.phone) {
      console.warn(`[StaffNotification] Staff ${staffId} has no phone number`);
      return;
    }

    // TODO: Add notificationsEnabled field to Staff model
    // if (!staff.notificationsEnabled) {
    //   console.log(`[StaffNotification] Notifications disabled for staff ${staffId}`);
    //   return;
    // }

    // Get clinic info for sender name
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    });

    const senderName = clinic?.name || 'KlinikFlow';

    // Generate message based on type
    const message = generateMessage(type, staff.name, metadata);

    if (!message) {
      console.error(`[StaffNotification] Could not generate message for type: ${type}`);
      return;
    }

    // Send SMS
    const smsParams: EnhancedSendParams = {
      clinicId,
      to: staff.phone,
      from: senderName,
      message,
      category: 'transactional', // Staff notifications are transactional, not marketing
      skipConsentCheck: true, // Staff has implicit consent via employment
    };

    const result = await smsService.sendEnhanced(smsParams);

    if (!result.success) {
      console.error(`[StaffNotification] Failed to send SMS to ${staff.name}:`, result.error);
    } else {
      console.log(`[StaffNotification] SMS sent to ${staff.name} (${type})`);
    }
  } catch (error) {
    console.error(`[StaffNotification] Error sending notification:`, error);
  }
}

/**
 * Generate notification message based on type
 */
function generateMessage(
  type: NotificationOptions['type'],
  staffName: string,
  metadata: any
): string | null {
  const firstName = staffName.split(' ')[0];

  switch (type) {
    case 'shift_assigned':
      return (
        `Hej ${firstName}! Du har fått ett nytt pass:\n` +
        `📅 ${format(new Date(metadata.startTime), 'EEEE d MMMM', { locale: sv })}\n` +
        `⏰ ${format(new Date(metadata.startTime), 'HH:mm')} - ${format(new Date(metadata.endTime), 'HH:mm')}\n` +
        `Typ: ${metadata.shiftType || 'Ordinarie'}\n` +
        `${metadata.notes ? `📝 ${metadata.notes}` : ''}`
      );

    case 'shift_changed':
      return (
        `Hej ${firstName}! Ditt pass har ändrats:\n` +
        `📅 ${format(new Date(metadata.startTime), 'EEEE d MMMM', { locale: sv })}\n` +
        `⏰ ${format(new Date(metadata.startTime), 'HH:mm')} - ${format(new Date(metadata.endTime), 'HH:mm')}\n` +
        `${metadata.changes ? `ℹ️ ${metadata.changes}` : ''}`
      );

    case 'shift_cancelled':
      return (
        `Hej ${firstName}! Ditt pass har ställts in:\n` +
        `📅 ${format(new Date(metadata.shiftDate), 'EEEE d MMMM', { locale: sv })}\n` +
        `${metadata.reason ? `ℹ️ Anledning: ${metadata.reason}` : ''}`
      );

    case 'leave_approved':
      return (
        `Hej ${firstName}! Din ledighetsansökan har godkänts ✅\n` +
        `📅 ${format(new Date(metadata.startDate), 'd MMM', { locale: sv })} - ${format(new Date(metadata.endDate), 'd MMM', { locale: sv })}\n` +
        `Typ: ${metadata.leaveType}\n` +
        `God ledighet!`
      );

    case 'leave_rejected':
      return (
        `Hej ${firstName}! Din ledighetsansökan har avslagits ❌\n` +
        `📅 ${format(new Date(metadata.startDate), 'd MMM', { locale: sv })} - ${format(new Date(metadata.endDate), 'd MMM', { locale: sv })}\n` +
        `${metadata.reason ? `ℹ️ Anledning: ${metadata.reason}` : ''}\n` +
        `Kontakta din chef för mer information.`
      );

    case 'clock_in_reminder':
      return (
        `Hej ${firstName}! Påminnelse:\n` +
        `⏰ Ditt pass börjar om ${metadata.minutesUntil} minuter\n` +
        `📍 Glöm inte att checka in!`
      );

    default:
      return null;
  }
}

/**
 * Send shift assigned notification
 */
export async function notifyShiftAssigned(
  clinicId: string,
  staffId: string,
  shift: {
    startTime: Date;
    endTime: Date;
    shiftType?: string;
    notes?: string;
  }
): Promise<void> {
  await notifyStaff({
    clinicId,
    staffId,
    type: 'shift_assigned',
    metadata: shift,
  });
}

/**
 * Send shift changed notification
 */
export async function notifyShiftChanged(
  clinicId: string,
  staffId: string,
  shift: {
    startTime: Date;
    endTime: Date;
    changes?: string;
  }
): Promise<void> {
  await notifyStaff({
    clinicId,
    staffId,
    type: 'shift_changed',
    metadata: shift,
  });
}

/**
 * Send shift cancelled notification
 */
export async function notifyShiftCancelled(
  clinicId: string,
  staffId: string,
  shift: {
    shiftDate: Date;
    reason?: string;
  }
): Promise<void> {
  await notifyStaff({
    clinicId,
    staffId,
    type: 'shift_cancelled',
    metadata: shift,
  });
}

/**
 * Send leave approved notification
 */
export async function notifyLeaveApproved(
  clinicId: string,
  staffId: string,
  leave: {
    startDate: Date;
    endDate: Date;
    leaveType: string;
  }
): Promise<void> {
  await notifyStaff({
    clinicId,
    staffId,
    type: 'leave_approved',
    metadata: leave,
  });
}

/**
 * Send leave rejected notification
 */
export async function notifyLeaveRejected(
  clinicId: string,
  staffId: string,
  leave: {
    startDate: Date;
    endDate: Date;
    reason?: string;
  }
): Promise<void> {
  await notifyStaff({
    clinicId,
    staffId,
    type: 'leave_rejected',
    metadata: leave,
  });
}

/**
 * Send clock-in reminder
 */
export async function sendClockInReminder(
  clinicId: string,
  staffId: string,
  minutesUntil: number
): Promise<void> {
  await notifyStaff({
    clinicId,
    staffId,
    type: 'clock_in_reminder',
    metadata: { minutesUntil },
  });
}

/**
 * Schedule clock-in reminders for upcoming shifts
 * (To be called by a cron job)
 */
export async function scheduleClockInReminders(): Promise<void> {
  const now = new Date();
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

  // Find all shifts starting in 30 minutes
  const upcomingShifts = await prisma.staffSchedule.findMany({
    where: {
      startTime: {
        gte: now,
        lte: in30Minutes,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
    },
    select: {
      id: true,
      clinicId: true,
      staffId: true,
    },
  });

  console.log(`[StaffNotification] Found ${upcomingShifts.length} upcoming shifts`);

  for (const shift of upcomingShifts) {
    // TODO: Check staff.notificationsEnabled once field is added
    await sendClockInReminder(shift.clinicId, shift.staffId, 30);
  }
}
