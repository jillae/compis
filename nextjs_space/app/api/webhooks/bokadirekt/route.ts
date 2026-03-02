/**
 * Bokadirekt Webhook Receiver
 *
 * POST /api/webhooks/bokadirekt
 *
 * Receives real-time events from Bokadirekt and processes them immediately,
 * supplementing the periodic cron sync with low-latency updates.
 *
 * Supported events (flexible parsing — Bokadirekt format is not rigidly documented):
 *   booking.created / booking.updated / booking.cancelled
 *   customer.created / customer.updated
 *   resource.updated (staff changes)
 *
 * Security: Validates via BOKADIREKT_WEBHOOK_SECRET header or API key.
 *           Falls back to accepting all requests if no secret is configured
 *           (useful for initial integration setup).
 *
 * Logging: Persists every received event to BokadirektWebhookLog, including
 *          errors, so events can be replayed or audited later.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ─── Webhook auth ─────────────────────────────────────────────────────────────

function validateWebhook(request: NextRequest): boolean {
  const secret = process.env.BOKADIREKT_WEBHOOK_SECRET;

  // No secret set — accept all (for initial setup only)
  if (!secret) {
    console.warn(
      '[Bokadirekt Webhook] BOKADIREKT_WEBHOOK_SECRET is not set — accepting all requests. ' +
        'Set this env var in production!'
    );
    return true;
  }

  const authHeader   = request.headers.get('authorization');
  const secretHeader = request.headers.get('x-webhook-secret');
  const apiKeyHeader = request.headers.get('x-api-key');

  if (authHeader === `Bearer ${secret}`) return true;
  if (secretHeader === secret) return true;
  if (apiKeyHeader === secret) return true;

  return false;
}

// ─── Clinic resolver ──────────────────────────────────────────────────────────

/**
 * Attempt to find the clinic associated with the incoming event.
 * Strategy:
 *   1. Match on the salonId in the payload against Clinic.bokadirektId
 *   2. Fall back to the first clinic with bokadirektEnabled=true
 */
async function resolveClinicId(payload: any): Promise<string | null> {
  const salonId =
    payload?.salonId ??
    payload?.data?.salonId ??
    payload?.salon_id ??
    null;

  if (salonId) {
    const clinic = await prisma.clinic.findFirst({
      where: { bokadirektId: String(salonId) },
      select: { id: true },
    });
    if (clinic) return clinic.id;
  }

  // Fallback — first enabled clinic
  const fallback = await prisma.clinic.findFirst({
    where: { bokadirektEnabled: true },
    select: { id: true },
  });

  return fallback?.id ?? null;
}

// ─── Log helper ───────────────────────────────────────────────────────────────

async function logWebhookEvent(
  clinicId: string | null,
  eventType: string,
  payload: unknown,
  status: 'received' | 'processed' | 'failed',
  error?: string
): Promise<string> {
  const log = await prisma.bokadirektWebhookLog.create({
    data: {
      clinicId,
      eventType,
      payload: payload as any,
      status,
      error: error ?? null,
      receivedAt: new Date(),
      processedAt: status !== 'received' ? new Date() : null,
    },
  });
  return log.id;
}

async function markLogProcessed(logId: string, error?: string): Promise<void> {
  await prisma.bokadirektWebhookLog.update({
    where: { id: logId },
    data: {
      status: error ? 'failed' : 'processed',
      error: error ?? null,
      processedAt: new Date(),
    },
  });
}

// ─── POST — receive event ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!validateWebhook(request)) {
      console.error('[Bokadirekt Webhook] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Bokadirekt Webhook] Received:', JSON.stringify(body).slice(0, 500));

    // Normalise event type — Bokadirekt may use various formats
    const eventType =
      body.event ??
      body.eventType ??
      body.type ??
      (body.action ? `${body.resource ?? body.type ?? 'unknown'}.${body.action}` : 'unknown');

    const payload = body.data ?? body.payload ?? body;

    // Resolve clinic
    const clinicId = await resolveClinicId(body);

    // Persist the raw event immediately (status=received)
    let logId: string;
    try {
      logId = await logWebhookEvent(clinicId, String(eventType), body, 'received');
    } catch (logErr) {
      // Logging failure must not block event processing
      console.error('[Bokadirekt Webhook] Failed to persist webhook log:', logErr);
      logId = '';
    }

    // Route to handler
    const eventLower = String(eventType).toLowerCase();
    let result: Record<string, unknown> = { processed: false };

    try {
      if (eventLower.includes('booking') && eventLower.includes('creat')) {
        result = await handleBookingCreated(payload, clinicId);
      } else if (
        eventLower.includes('booking') &&
        (eventLower.includes('updat') || eventLower.includes('chang'))
      ) {
        result = await handleBookingUpdated(payload);
      } else if (
        eventLower.includes('booking') &&
        (eventLower.includes('cancel') || eventLower.includes('delet'))
      ) {
        result = await handleBookingCancelled(payload);
      } else if (eventLower.includes('customer') && eventLower.includes('creat')) {
        result = await handleCustomerCreated(payload, clinicId);
      } else if (eventLower.includes('customer') && eventLower.includes('updat')) {
        result = await handleCustomerUpdated(payload, clinicId);
      } else if (eventLower.includes('resource') || eventLower.includes('staff')) {
        result = await handleStaffUpdated(payload);
      } else {
        console.log(`[Bokadirekt Webhook] Unhandled event type: ${eventType}`);
        result = { processed: false, reason: `Unhandled event type: ${eventType}` };
      }

      if (logId) await markLogProcessed(logId);
    } catch (handlerErr) {
      const errMsg = handlerErr instanceof Error ? handlerErr.message : String(handlerErr);
      console.error(`[Bokadirekt Webhook] Handler error for ${eventType}:`, handlerErr);
      if (logId) await markLogProcessed(logId, errMsg);
      result = { processed: false, error: errMsg };
    }

    const durationMs = Date.now() - startTime;
    console.log(`[Bokadirekt Webhook] ${eventType} handled in ${durationMs}ms:`, result);

    // Always return 200 so Bokadirekt does not retry on handler errors
    return NextResponse.json({
      success: true,
      event: eventType,
      durationMs,
      ...result,
    });
  } catch (err) {
    console.error('[Bokadirekt Webhook] Unexpected error:', err);
    // Return 200 to prevent indefinite retries from the caller
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal error',
      },
      { status: 200 }
    );
  }
}

// ─── GET — verification / health check ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const challenge = new URL(request.url).searchParams.get('challenge');
  if (challenge) {
    // Echo challenge for webhook verification (some platforms require this)
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({
    status: 'active',
    service: 'Bokadirekt Webhook Receiver',
    version: '2.0',
    timestamp: new Date().toISOString(),
  });
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleBookingCreated(
  data: any,
  clinicId: string | null
): Promise<Record<string, unknown>> {
  try {
    const bokadirektId = String(
      data.id ?? data.bookingId ?? data.externalId ?? ''
    );
    if (!bokadirektId || bokadirektId === 'undefined') {
      return { processed: false, reason: 'No booking ID in payload' };
    }

    // Idempotency check
    const existing = await prisma.booking.findFirst({
      where: { bokadirektId },
      select: { id: true },
    });
    if (existing) {
      return { processed: false, reason: 'Booking already exists', bookingId: existing.id };
    }

    // Resolve customer
    let customerId: string | undefined;
    const customerData = data.customer ?? data.client;
    if (customerData) {
      const customerBdId = String(customerData.id ?? customerData.customerId ?? '');
      if (customerBdId) {
        const existingCust = await prisma.customer.findFirst({
          where: { bokadirektId: customerBdId },
          select: { id: true },
        });
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const fullName =
            customerData.name ??
            `${customerData.firstName ?? ''} ${customerData.lastName ?? ''}`.trim() ??
            null;
          if (fullName || customerData.email) {
            const newCust = await prisma.customer.create({
              data: {
                bokadirektId: customerBdId,
                clinicId,
                name: fullName,
                firstName: customerData.firstName ?? null,
                lastName: customerData.lastName ?? null,
                email: customerData.email ?? null,
                phone: customerData.phone ?? customerData.mobilePhone ?? null,
                source: 'bokadirekt',
              },
            });
            customerId = newCust.id;
          }
        }
      }
    }

    if (!customerId) {
      return { processed: false, reason: 'Could not resolve or create customer' };
    }

    // Resolve staff
    let staffId: string | undefined;
    const staffBdId = data.resourceId ?? data.staffId ?? data.resource?.id;
    if (staffBdId) {
      const staff = await prisma.staff.findFirst({
        where: { bokadirektId: String(staffBdId) },
        select: { id: true },
      });
      staffId = staff?.id;
    }

    // Resolve service
    let serviceId: string | undefined;
    const serviceBdId = data.serviceId ?? data.service?.id;
    if (serviceBdId) {
      const svc = await prisma.service.findFirst({
        where: { bokadirektId: String(serviceBdId) },
        select: { id: true },
      });
      serviceId = svc?.id;
    }

    const scheduledTime = new Date(
      data.startTime ?? data.startDate ?? data.scheduledTime ?? data.date
    );

    const booking = await prisma.booking.create({
      data: {
        bokadirektId,
        clinicId,
        customerId,
        staffId,
        serviceId,
        scheduledTime,
        startTime: scheduledTime,
        endTime: data.endTime ?? data.endDate ? new Date(data.endTime ?? data.endDate) : null,
        duration: data.duration ?? data.durationMinutes ?? null,
        price: data.price ?? data.totalPrice ?? data.bookedPrice ?? 0,
        revenue: data.price ?? data.totalPrice ?? data.bookedPrice ?? 0,
        source: 'bokadirekt',
        bookingChannel: (data.onlineBooking ?? data.isOnlineBooking) ? 'ONLINE' : 'IN_PERSON',
        isOnlineBooking: data.onlineBooking ?? data.isOnlineBooking ?? false,
        treatmentType: data.serviceName ?? data.treatmentType ?? '',
        status: 'SCHEDULED',
        notes: data.notes ?? data.comment ?? null,
      },
    });

    // Increment customer booking count
    await prisma.customer.update({
      where: { id: customerId },
      data: { totalBookings: { increment: 1 } },
    });

    return { processed: true, action: 'created', bookingId: booking.id };
  } catch (err) {
    console.error('[Bokadirekt Webhook] handleBookingCreated error:', err);
    return { processed: false, error: (err as Error).message };
  }
}

async function handleBookingUpdated(data: any): Promise<Record<string, unknown>> {
  try {
    const bokadirektId = String(data.id ?? data.bookingId ?? data.externalId ?? '');
    if (!bokadirektId || bokadirektId === 'undefined') {
      return { processed: false, reason: 'No booking ID in payload' };
    }

    const existing = await prisma.booking.findFirst({
      where: { bokadirektId },
      select: { id: true },
    });

    if (!existing) {
      // Not found — delegate to create
      return handleBookingCreated(data, null);
    }

    const updateData: Record<string, unknown> = {};
    if (data.startTime ?? data.startDate) {
      const t = new Date(data.startTime ?? data.startDate);
      updateData.scheduledTime = t;
      updateData.startTime = t;
    }
    if (data.endTime ?? data.endDate) {
      updateData.endTime = new Date(data.endTime ?? data.endDate);
    }
    if (data.price !== undefined) updateData.price = data.price;
    if (data.bookedPrice !== undefined) updateData.price = data.bookedPrice;
    if (data.status) {
      const statusMap: Record<string, string> = {
        scheduled:  'SCHEDULED',
        confirmed:  'CONFIRMED',
        completed:  'COMPLETED',
        cancelled:  'CANCELLED',
        no_show:    'NO_SHOW',
        noshow:     'NO_SHOW',
      };
      updateData.status = statusMap[String(data.status).toLowerCase()] ?? data.status;
    }
    if (data.cancelled === true) updateData.status = 'CANCELLED';
    if (data.noShow === true)    updateData.status = 'NO_SHOW';
    if (data.notes) updateData.notes = data.notes;

    if (Object.keys(updateData).length > 0) {
      await prisma.booking.update({
        where: { id: existing.id },
        data: updateData as any,
      });
    }

    return { processed: true, action: 'updated', bookingId: existing.id };
  } catch (err) {
    console.error('[Bokadirekt Webhook] handleBookingUpdated error:', err);
    return { processed: false, error: (err as Error).message };
  }
}

async function handleBookingCancelled(data: any): Promise<Record<string, unknown>> {
  try {
    const bokadirektId = String(data.id ?? data.bookingId ?? data.externalId ?? '');
    if (!bokadirektId || bokadirektId === 'undefined') {
      return { processed: false, reason: 'No booking ID in payload' };
    }

    const existing = await prisma.booking.findFirst({
      where: { bokadirektId },
      select: { id: true },
    });

    if (!existing) {
      return { processed: false, reason: 'Booking not found locally' };
    }

    await prisma.booking.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
    });

    return { processed: true, action: 'cancelled', bookingId: existing.id };
  } catch (err) {
    console.error('[Bokadirekt Webhook] handleBookingCancelled error:', err);
    return { processed: false, error: (err as Error).message };
  }
}

async function handleCustomerCreated(
  data: any,
  clinicId: string | null
): Promise<Record<string, unknown>> {
  try {
    const bokadirektId = String(data.id ?? data.customerId ?? '');
    if (!bokadirektId || bokadirektId === 'undefined') {
      return { processed: false, reason: 'No customer ID in payload' };
    }

    const existing = await prisma.customer.findFirst({
      where: { bokadirektId },
      select: { id: true },
    });
    if (existing) {
      return { processed: false, reason: 'Customer already exists', customerId: existing.id };
    }

    const fullName =
      data.name ??
      `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() ??
      null;

    const customer = await prisma.customer.create({
      data: {
        bokadirektId,
        clinicId,
        name: fullName,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        email: data.email ?? null,
        phone: data.phone ?? data.mobilePhone ?? null,
        city: data.city ?? null,
        postalCode: data.postalCode ?? data.zipCode ?? null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        source: 'bokadirekt',
      },
    });

    return { processed: true, action: 'created', customerId: customer.id };
  } catch (err) {
    console.error('[Bokadirekt Webhook] handleCustomerCreated error:', err);
    return { processed: false, error: (err as Error).message };
  }
}

async function handleCustomerUpdated(
  data: any,
  clinicId: string | null
): Promise<Record<string, unknown>> {
  try {
    const bokadirektId = String(data.id ?? data.customerId ?? '');
    if (!bokadirektId || bokadirektId === 'undefined') {
      return { processed: false, reason: 'No customer ID in payload' };
    }

    const existing = await prisma.customer.findFirst({
      where: { bokadirektId },
      select: { id: true },
    });

    if (!existing) {
      return handleCustomerCreated(data, clinicId);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName)  updateData.lastName = data.lastName;
    if (data.email)     updateData.email = data.email;
    const phone = data.phone ?? data.mobilePhone;
    if (phone) updateData.phone = phone;
    if (data.city)       updateData.city = data.city;
    if (data.postalCode) updateData.postalCode = data.postalCode;

    if (Object.keys(updateData).length > 0) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: updateData as any,
      });
    }

    return { processed: true, action: 'updated', customerId: existing.id };
  } catch (err) {
    console.error('[Bokadirekt Webhook] handleCustomerUpdated error:', err);
    return { processed: false, error: (err as Error).message };
  }
}

async function handleStaffUpdated(data: any): Promise<Record<string, unknown>> {
  try {
    const bokadirektId = String(data.id ?? data.resourceId ?? '');
    if (!bokadirektId || bokadirektId === 'undefined') {
      return { processed: false, reason: 'No staff/resource ID in payload' };
    }

    const existing = await prisma.staff.findFirst({
      where: { bokadirektId },
      select: { id: true },
    });

    if (!existing) {
      return { processed: false, reason: 'Staff member not found locally — run a full sync first' };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name)               updateData.name = data.name;
    if (data.resourceName)       updateData.name = data.resourceName;
    if (data.email)              updateData.email = data.email;
    if (data.phone)              updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (Object.keys(updateData).length > 0) {
      await prisma.staff.update({
        where: { id: existing.id },
        data: updateData as any,
      });
    }

    return { processed: true, action: 'updated', staffId: existing.id };
  } catch (err) {
    console.error('[Bokadirekt Webhook] handleStaffUpdated error:', err);
    return { processed: false, error: (err as Error).message };
  }
}
