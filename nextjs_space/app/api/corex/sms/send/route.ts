

/**
 * Corex SMS Send API
 * Send SMS via Corex AI assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendSMS, sendBookingConfirmationSMS, sendReminderSMS } from '@/lib/corex-sms-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, to, message, customerId, bookingDetails } = await req.json();

    // Type: "manual", "booking_confirmation", "reminder"
    let success = false;

    switch (type) {
      case 'manual':
        if (!to || !message) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        success = await sendSMS(to, message);
        break;

      case 'booking_confirmation':
        if (!customerId || !bookingDetails) {
          return NextResponse.json({ error: 'Missing customerId or bookingDetails' }, { status: 400 });
        }
        success = await sendBookingConfirmationSMS(customerId, {
          ...bookingDetails,
          date: new Date(bookingDetails.date)
        });
        break;

      case 'reminder':
        if (!customerId || !bookingDetails) {
          return NextResponse.json({ error: 'Missing customerId or bookingDetails' }, { status: 400 });
        }
        success = await sendReminderSMS(customerId, {
          ...bookingDetails,
          date: new Date(bookingDetails.date)
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success,
      message: success ? 'SMS sent successfully' : 'Failed to send SMS'
    });

  } catch (error) {
    console.error('SMS send API error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

