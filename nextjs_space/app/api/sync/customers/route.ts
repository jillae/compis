
// Sync API for Lovable to poll
// GET /api/sync/customers?since=<timestamp>&org_id=<uuid>

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
    
    // Fetch customers
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Calculate LTV for each customer
    const customersWithMetrics = await Promise.all(
      customers.map(async (customer) => {
        const bookings = await prisma.booking.findMany({
          where: { customerId: customer.id },
          select: { revenue: true },
        });
        
        const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.revenue), 0);
        
        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          tags: customer.tags,
          date_of_birth: customer.dateOfBirth?.toISOString() || null,
          city: customer.city,
          postal_code: customer.postalCode,
          total_bookings: bookings.length,
          lifetime_value: totalRevenue,
          synced_at: new Date().toISOString(),
        };
      })
    );
    
    return NextResponse.json({
      customers: customersWithMetrics,
      count: customersWithMetrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] /api/sync/customers failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
