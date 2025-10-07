
// Sync API for Lovable to poll
// GET /api/sync/services?since=<timestamp>&org_id=<uuid>

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
    
    // Fetch services
    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Calculate metrics for each service
    const servicesWithMetrics = await Promise.all(
      services.map(async (service) => {
        const bookings = await prisma.booking.findMany({
          where: { serviceId: service.id },
          select: { revenue: true },
        });
        
        const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.revenue), 0);
        const averagePrice = bookings.length > 0 ? totalRevenue / bookings.length : Number(service.price);
        
        return {
          id: service.id,
          name: service.name,
          category: service.category,
          price: service.price,
          duration: service.duration,
          total_bookings: bookings.length,
          total_revenue: totalRevenue,
          average_price: averagePrice,
          synced_at: new Date().toISOString(),
        };
      })
    );
    
    return NextResponse.json({
      services: servicesWithMetrics,
      count: servicesWithMetrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] /api/sync/services failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
