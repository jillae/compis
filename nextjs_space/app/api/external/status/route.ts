/**
 * Flow External API — Quick Status
 * 
 * Lightweight endpoint for Marknadscentral to show live connection status.
 * Returns basic clinic info + today's snapshot.
 * 
 * GET /api/external/status?clinicId=xxx
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-FLOW-API-KEY, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-FLOW-API-KEY');
    const validKey = process.env.FLOW_EXTERNAL_API_KEY;
    
    if (!validKey || !apiKey || apiKey !== validKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        bokadirektEnabled: true,
        metaEnabled: true,
        corexEnabled: true,
        isActive: true,
        tier: true,
        _count: {
          select: {
            users: true,
            staff: { where: { isActive: true } },
            customers: true,
            services: { where: { isActive: true } },
          }
        }
      }
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await prisma.booking.count({
      where: {
        clinicId,
        scheduledTime: { gte: today, lt: tomorrow },
      },
    });

    const todayCompleted = await prisma.booking.count({
      where: {
        clinicId,
        scheduledTime: { gte: today, lt: tomorrow },
        status: { in: ['completed', 'COMPLETED'] },
      },
    });

    // Last sync timestamp
    const lastBooking = await prisma.booking.findFirst({
      where: { clinicId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      clinic: {
        id: clinic.id,
        name: clinic.name,
        tier: clinic.tier,
        isActive: clinic.isActive,
        integrations: {
          bokadirekt: clinic.bokadirektEnabled,
          meta: clinic.metaEnabled,
          corex: clinic.corexEnabled,
        },
        counts: {
          users: clinic._count.users,
          staff: clinic._count.staff,
          customers: clinic._count.customers,
          services: clinic._count.services,
        },
      },
      today: {
        bookings: todayBookings,
        completed: todayCompleted,
        remaining: todayBookings - todayCompleted,
      },
      lastDataSync: lastBooking?.updatedAt?.toISOString() || null,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[External Status API]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
