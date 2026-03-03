

/**
 * Meta Conversions API Service
 * 
 * Tracks conversion events (PageView, Lead, Purchase, etc.) to Meta
 * for better ad targeting and attribution
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

interface ConversionEvent {
  eventName: 'PageView' | 'ViewContent' | 'Lead' | 'CompleteRegistration' | 'Purchase' | 'AddToCart' | 'InitiateCheckout';
  eventTime: number; // Unix timestamp
  eventSourceUrl: string;
  userAgent?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  
  // User data (hashed)
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  externalId?: string; // Your customer ID
  
  // Custom data
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    contents?: Array<{
      id: string;
      quantity: number;
      price: number;
    }>;
  };
}

/**
 * Hash user data for privacy (required by Meta)
 */
function hashData(data: string | undefined): string | undefined {
  if (!data) return undefined;
  
  // Normalize: lowercase, remove spaces
  const normalized = data.toLowerCase().trim().replace(/\s+/g, '');
  
  // SHA256 hash
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Get Meta Pixel ID from clinic settings
 */
async function getMetaPixelId(clinicId: string): Promise<string | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { metaPixelId: true, metaEnabled: true }
  });
  
  return clinic?.metaEnabled && clinic.metaPixelId ? clinic.metaPixelId : null;
}

/**
 * Get Meta Access Token
 */
async function getMetaAccessToken(): Promise<string> {
  const token = process.env.META_ACCESS_TOKEN || '';
  
  if (!token || token === 'NEEDS_ROTATION_BY_USER') {
    throw new Error('Meta access token not configured - set META_ACCESS_TOKEN env var');
  }
  
  return token;
}

/**
 * Track conversion event to Meta
 */
export async function trackConversionEvent(
  clinicId: string,
  event: ConversionEvent
): Promise<boolean> {
  try {
    const pixelId = await getMetaPixelId(clinicId);
    
    if (!pixelId) {
      console.log('Meta pixel not configured for clinic:', clinicId);
      return false;
    }

    const accessToken = await getMetaAccessToken();

    // Hash user data
    const userData: any = {};
    if (event.email) userData.em = hashData(event.email);
    if (event.phone) userData.ph = hashData(event.phone);
    if (event.firstName) userData.fn = hashData(event.firstName);
    if (event.lastName) userData.ln = hashData(event.lastName);
    if (event.city) userData.ct = hashData(event.city);
    if (event.state) userData.st = hashData(event.state);
    if (event.zipCode) userData.zp = hashData(event.zipCode);
    if (event.country) userData.country = hashData(event.country);
    if (event.externalId) userData.external_id = hashData(event.externalId);
    if (event.clientIpAddress) userData.client_ip_address = event.clientIpAddress;
    if (event.clientUserAgent) userData.client_user_agent = event.clientUserAgent;

    // Build event payload
    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime,
          event_source_url: event.eventSourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: event.customData || {}
        }
      ]
    };

    // Send to Meta Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      console.error('Meta Conversions API error:', await response.text());
      return false;
    }

    const result = await response.json();
    console.log('✅ Conversion tracked to Meta:', event.eventName, result);
    return true;

  } catch (error) {
    console.error('Conversion tracking error:', error);
    return false;
  }
}

/**
 * Track booking as Lead event
 */
export async function trackBookingLead(
  clinicId: string,
  booking: {
    customerId: string;
    serviceId: string;
    totalPrice: number;
    eventSourceUrl: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
  }
): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: booking.customerId },
      select: {
        email: true,
        phone: true,
        name: true
      }
    });

    const service = await prisma.service.findUnique({
      where: { id: booking.serviceId },
      select: { name: true, category: true }
    });

    if (!customer || !service) {
      return false;
    }

    const nameParts = customer.name?.split(' ') || [];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    return await trackConversionEvent(clinicId, {
      eventName: 'Lead',
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: booking.eventSourceUrl,
      clientIpAddress: booking.clientIpAddress,
      clientUserAgent: booking.clientUserAgent,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      externalId: customer.email || booking.customerId,
      customData: {
        value: booking.totalPrice,
        currency: 'SEK',
        contentName: service.name,
        contentCategory: service.category || 'Booking',
        contentIds: [booking.serviceId]
      }
    });

  } catch (error) {
    console.error('Booking lead tracking error:', error);
    return false;
  }
}

/**
 * Track completed payment as Purchase event
 */
export async function trackPurchase(
  clinicId: string,
  purchase: {
    customerId: string;
    bookingId: string;
    totalAmount: number;
    eventSourceUrl: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
  }
): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: purchase.customerId },
      select: {
        email: true,
        phone: true,
        name: true
      }
    });

    if (!customer) {
      return false;
    }

    const nameParts = customer.name?.split(' ') || [];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    return await trackConversionEvent(clinicId, {
      eventName: 'Purchase',
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: purchase.eventSourceUrl,
      clientIpAddress: purchase.clientIpAddress,
      clientUserAgent: purchase.clientUserAgent,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      externalId: customer.email || purchase.customerId,
      customData: {
        value: purchase.totalAmount,
        currency: 'SEK',
        contentIds: [purchase.bookingId]
      }
    });

  } catch (error) {
    console.error('Purchase tracking error:', error);
    return false;
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  clinicId: string,
  pageUrl: string,
  userEmail?: string,
  clientIpAddress?: string,
  clientUserAgent?: string
): Promise<boolean> {
  try {
    return await trackConversionEvent(clinicId, {
      eventName: 'PageView',
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: pageUrl,
      clientIpAddress,
      clientUserAgent,
      email: userEmail,
      externalId: userEmail
    });
  } catch (error) {
    console.error('PageView tracking error:', error);
    return false;
  }
}

