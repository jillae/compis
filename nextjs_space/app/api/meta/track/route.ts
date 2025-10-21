

/**
 * Meta Conversion Tracking API
 * Client-side endpoint to track conversion events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trackConversionEvent, trackBookingLead, trackPurchase, trackPageView } from '@/lib/meta-conversions-api';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventType, eventData } = await req.json();

    // Get client IP and user agent from headers
    const clientIpAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const clientUserAgent = req.headers.get('user-agent') || undefined;

    let success = false;

    switch (eventType) {
      case 'pageview':
        success = await trackPageView(
          session.user.clinicId,
          eventData.url,
          session.user.email || undefined,
          clientIpAddress,
          clientUserAgent
        );
        break;

      case 'booking_lead':
        success = await trackBookingLead(
          session.user.clinicId,
          {
            ...eventData,
            clientIpAddress,
            clientUserAgent
          }
        );
        break;

      case 'purchase':
        success = await trackPurchase(
          session.user.clinicId,
          {
            ...eventData,
            clientIpAddress,
            clientUserAgent
          }
        );
        break;

      case 'custom':
        success = await trackConversionEvent(
          session.user.clinicId,
          {
            ...eventData,
            clientIpAddress,
            clientUserAgent
          }
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    return NextResponse.json({
      success,
      message: success ? 'Event tracked' : 'Failed to track event'
    });

  } catch (error) {
    console.error('Conversion tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}

