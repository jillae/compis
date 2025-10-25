
// Auto-Booking Service for Bokadirekt
// Handles automatic booking of available slots

import { prisma } from '@/lib/db';
import { BokadirektAutoBookingMode } from '@prisma/client';
import { sendEmail } from '@/lib/email';

/**
 * Check and process auto-bookings for all clinics
 * This should be called by a cron job every 15 minutes
 */
export async function processAutoBookings() {
  console.log('[Auto-Booking] Starting auto-booking process...');

  try {
    // Find all clinics with AUTO mode enabled
    const clinics = await prisma.clinic.findMany({
      where: {
        bokadirektEnabled: true,
        bokadirektAutoBookingMode: {
          in: [BokadirektAutoBookingMode.AUTO, BokadirektAutoBookingMode.NOTIFY],
        },
      },
      select: {
        id: true,
        name: true,
        bokadirektAutoBookingMode: true,
        autoBookingMaxDaysAhead: true,
        autoBookingNotifyEmail: true,
        bokadirektApiKey: true,
      },
    });

    console.log(`[Auto-Booking] Found ${clinics.length} clinics with auto-booking enabled`);

    for (const clinic of clinics) {
      try {
        await processClinicAutoBooking(clinic);
      } catch (error) {
        console.error(`[Auto-Booking] Error processing clinic ${clinic.id}:`, error);
      }
    }

    console.log('[Auto-Booking] Auto-booking process complete');
  } catch (error) {
    console.error('[Auto-Booking] Fatal error:', error);
    throw error;
  }
}

/**
 * Process auto-booking for a single clinic
 */
async function processClinicAutoBooking(clinic: any) {
  console.log(`[Auto-Booking] Processing clinic: ${clinic.name} (${clinic.id})`);

  // TODO: Implement actual Bokadirekt API calls here
  // 1. Fetch available slots from Bokadirekt API
  // 2. Filter slots based on preferences
  // 3. If AUTO mode: Create booking
  // 4. If NOTIFY mode: Send email

  // Placeholder implementation
  const availableSlots = await fetchAvailableSlots(clinic);

  if (availableSlots.length === 0) {
    console.log(`[Auto-Booking] No available slots for ${clinic.name}`);
    return;
  }

  console.log(`[Auto-Booking] Found ${availableSlots.length} available slots for ${clinic.name}`);

  if (clinic.bokadirektAutoBookingMode === BokadirektAutoBookingMode.AUTO) {
    // Auto-book first available slot
    await createAutoBooking(clinic, availableSlots[0]);
  } else if (clinic.bokadirektAutoBookingMode === BokadirektAutoBookingMode.NOTIFY) {
    // Send notification email
    await sendAvailabilityNotification(clinic, availableSlots);
  }
}

/**
 * Fetch available slots from Bokadirekt API
 */
async function fetchAvailableSlots(clinic: any): Promise<any[]> {
  // TODO: Implement actual Bokadirekt API call
  // For now, return empty array
  return [];
}

/**
 * Create automatic booking
 */
async function createAutoBooking(clinic: any, slot: any) {
  console.log(`[Auto-Booking] Creating booking for ${clinic.name}...`);

  // TODO: Implement actual booking creation via Bokadirekt API
  // 1. POST to Bokadirekt booking endpoint
  // 2. Save booking to database
  // 3. Send confirmation email

  console.log(`[Auto-Booking] Booking created successfully for ${clinic.name}`);
}

/**
 * Send availability notification email
 */
async function sendAvailabilityNotification(clinic: any, slots: any[]) {
  if (!clinic.autoBookingNotifyEmail) {
    console.log(`[Auto-Booking] No notification email for ${clinic.name}`);
    return;
  }

  console.log(`[Auto-Booking] Sending notification to ${clinic.autoBookingNotifyEmail}...`);

  const emailBody = `
    <h2>Nya bokningsbara tider tillgängliga!</h2>
    <p>Hej!</p>
    <p>Det finns ${slots.length} nya bokningsbara tider för ${clinic.name}.</p>
    <p>Logga in på Flow för att se och boka dessa tider.</p>
    <p>Med vänliga hälsningar,<br>Flow Team</p>
  `;

  try {
    await sendEmail({
      to: clinic.autoBookingNotifyEmail,
      subject: `Nya bokningsbara tider - ${clinic.name}`,
      html: emailBody,
    });

    console.log(`[Auto-Booking] Notification sent successfully`);
  } catch (error) {
    console.error(`[Auto-Booking] Failed to send notification:`, error);
  }
}
