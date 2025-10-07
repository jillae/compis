
// Sync API for Lovable to poll
// GET /api/sync/bookings?since=<timestamp>&org_id=<uuid>

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY || 'dev-key-for-testing';

export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== LOVABLE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const orgId = searchParams.get('org_id');
    
    // Build where clause
    const where: any = {};
    
    if (since) {
      try {
        where.updatedAt = { gte: new Date(since) };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid since parameter' },
          { status: 400 }
        );
      }
    }
    
    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        customer: true,
        staff: true,
        service: true,
      },
      orderBy: { startTime: 'desc' },
      take: 1000, // Limit to 1000 records per request
    });
    
    // Transform to normalized format for Lovable
    const normalizedBookings = bookings.map((b) => ({
      id: b.id,
      customer_id: b.customerId,
      staff_id: b.staffId,
      service_id: b.serviceId,
      start_time: b.startTime?.toISOString() || b.scheduledTime.toISOString(),
      end_time: b.endTime?.toISOString() || b.scheduledTime.toISOString(),
      status: b.status,
      revenue: Number(b.revenue),
      cost: Number(b.cost),
      source: b.source,
      notes: b.notes,
      synced_at: new Date().toISOString(),
      customer_name: b.customer?.name,
      staff_name: b.staff?.name,
      service_name: b.service?.name,
    }));
    
    return NextResponse.json({
      bookings: normalizedBookings,
      count: normalizedBookings.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] /api/sync/bookings failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
