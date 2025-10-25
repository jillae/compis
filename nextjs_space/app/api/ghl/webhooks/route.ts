
/**
 * GoHighLevel Webhooks Handler
 * Receives webhooks from GHL and processes appointment/contact events
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = req.headers.get('x-ghl-signature');
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const body = await req.text();
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid GHL webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Parse body after verification
      const event = JSON.parse(body);
      return await processWebhook(event);
    }

    // No signature verification - parse and process
    const event = await req.json();
    return await processWebhook(event);
  } catch (error) {
    console.error('GHL webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processWebhook(event: any) {
  const { type, data } = event;

  console.log('GHL Webhook received:', { type, data });

  switch (type) {
    case 'appointment.created':
    case 'appointment.updated':
      return await handleAppointment(data, type);

    case 'contact.created':
    case 'contact.updated':
      return await handleContact(data, type);

    case 'opportunity.created':
    case 'opportunity.updated':
    case 'opportunity.status.update':
      return await handleOpportunity(data, type);

    default:
      console.log(`Unhandled GHL webhook type: ${type}`);
      return NextResponse.json({ received: true, type, processed: false });
  }
}

async function handleAppointment(data: any, type: string) {
  try {
    const {
      id: ghlAppointmentId,
      contactId: ghlContactId,
      calendarId,
      startTime,
      endTime,
      title,
      status,
      notes,
    } = data;

    // Find clinic by GHL location ID (stored in clinic.ghlLocationId)
    const clinic = await prisma.clinic.findFirst({
      where: {
        ghlLocationId: calendarId,
        ghlEnabled: true,
      },
    });

    if (!clinic) {
      console.warn(`No clinic found for GHL location: ${calendarId}`);
      return NextResponse.json({ received: true, warning: 'Clinic not found' });
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        clinicId: clinic.id,
        ghlContactId: ghlContactId,
      },
    });

    if (!customer) {
      // Create minimal customer record
      customer = await prisma.customer.create({
        data: {
          clinicId: clinic.id,
          name: data.contactName || 'GHL Contact',
          email: data.contactEmail,
          phone: data.contactPhone,
          ghlContactId: ghlContactId,
        },
      });
    }

    // Map GHL status to Flow booking status
    const bookingStatus = mapGhlStatus(status);

    // Upsert booking
    const booking = await prisma.booking.upsert({
      where: {
        ghlAppointmentId: ghlAppointmentId,
      },
      update: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: bookingStatus,
        notes: notes || '',
      },
      create: {
        ghlAppointmentId,
        clinicId: clinic.id,
        customerId: customer.id,
        scheduledTime: new Date(startTime),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: bookingStatus,
        notes: notes || '',
        price: 0, // Price not provided by GHL
        source: 'ghl',
      },
    });

    console.log(`GHL appointment ${type}:`, booking.id);

    return NextResponse.json({
      received: true,
      type,
      bookingId: booking.id,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Error handling GHL appointment:', error);
    throw error;
  }
}

async function handleContact(data: any, type: string) {
  try {
    const {
      id: ghlContactId,
      locationId,
      firstName,
      lastName,
      email,
      phone,
      tags,
    } = data;

    // Find clinic
    const clinic = await prisma.clinic.findFirst({
      where: {
        ghlLocationId: locationId,
        ghlEnabled: true,
      },
    });

    if (!clinic) {
      console.warn(`No clinic found for GHL location: ${locationId}`);
      return NextResponse.json({ received: true, warning: 'Clinic not found' });
    }

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'GHL Contact';

    // Upsert customer
    const customer = await prisma.customer.upsert({
      where: {
        clinicId_ghlContactId: {
          clinicId: clinic.id,
          ghlContactId: ghlContactId,
        },
      },
      update: {
        name: fullName,
        email: email || null,
        phone: phone || null,
      },
      create: {
        clinicId: clinic.id,
        ghlContactId,
        name: fullName,
        email: email || null,
        phone: phone || null,
      },
    });

    // Sync tags if present
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: {
            clinicId_name: {
              clinicId: clinic.id,
              name: tagName,
            },
          },
          update: {},
          create: {
            clinicId: clinic.id,
            name: tagName,
            description: 'Imported from GoHighLevel',
          },
        });

        // Associate tag with customer
        await prisma.customerTag.upsert({
          where: {
            customerId_tagId: {
              customerId: customer.id,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            customerId: customer.id,
            tagId: tag.id,
          },
        });
      }
    }

    console.log(`GHL contact ${type}:`, customer.id);

    return NextResponse.json({
      received: true,
      type,
      customerId: customer.id,
    });
  } catch (error) {
    console.error('Error handling GHL contact:', error);
    throw error;
  }
}

async function handleOpportunity(data: any, type: string) {
  try {
    console.log('GHL opportunity event:', { type, data });

    // For now, just log opportunities
    // Can be extended to track sales pipeline

    return NextResponse.json({
      received: true,
      type,
      processed: false,
      note: 'Opportunity tracking not yet implemented',
    });
  } catch (error) {
    console.error('Error handling GHL opportunity:', error);
    throw error;
  }
}

/**
 * Map GHL appointment status to Flow booking status
 */
function mapGhlStatus(ghlStatus: string): any {
  const statusMap: Record<string, string> = {
    confirmed: 'CONFIRMED',
    showed: 'COMPLETED',
    'no-show': 'NO_SHOW',
    cancelled: 'CANCELLED',
    rescheduled: 'CONFIRMED',
  };

  return (statusMap[ghlStatus?.toLowerCase()] || 'CONFIRMED') as any;
}

// GET endpoint for webhook verification (some services require this)
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get('challenge');

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    message: 'GHL Webhook endpoint',
    status: 'active',
  });
}
