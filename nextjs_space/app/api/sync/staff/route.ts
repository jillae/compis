export const dynamic = 'force-dynamic';

// Sync API for Lovable to poll
// GET /api/sync/staff?since=<timestamp>&org_id=<uuid>

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
    
    // Fetch staff
    const staff = await prisma.staff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    // Calculate utilization for each staff member
    const staffWithMetrics = await Promise.all(
      staff.map(async (member) => {
        // Get bookings for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const bookings = await prisma.booking.findMany({
          where: {
            staffId: member.id,
            startTime: { gte: thirtyDaysAgo },
          },
          select: {
            startTime: true,
            endTime: true,
            scheduledTime: true,
            revenue: true,
            status: true,
          },
        });
        
        // Calculate total hours worked
        const totalHours = bookings.reduce((sum, b) => {
          if (b.startTime && b.endTime) {
            const duration = (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
            return sum + duration;
          }
          return sum;
        }, 0);
        
        // Calculate total revenue
        const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.revenue), 0);
        
        // Assuming 8 hour workdays, 5 days a week
        const availableHours = 30 * 8 * (5 / 7); // ~171 hours
        const utilizationRate = availableHours > 0 ? totalHours / availableHours : 0;
        
        return {
          id: member.id,
          name: member.name,
          email: member.email,
          specializations: member.specializations,
          utilization_rate: Math.min(utilizationRate, 1.0), // Cap at 100%
          total_bookings: bookings.length,
          total_revenue: totalRevenue,
          synced_at: new Date().toISOString(),
        };
      })
    );
    
    return NextResponse.json({
      staff: staffWithMetrics,
      count: staffWithMetrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] /api/sync/staff failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
