
/**
 * GoHighLevel Integration API
 * WAVE 8: Push bookings and sync customers to GHL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, entityType, entityId } = await req.json();

    // Hämta klinikens GHL-credentials
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        ghlEnabled: true,
        ghlApiKey: true,
        ghlLocationId: true
      }
    });

    if (!clinic?.ghlEnabled || !clinic.ghlApiKey || !clinic.ghlLocationId) {
      return NextResponse.json({
        error: 'GoHighLevel integration not configured'
      }, { status: 400 });
    }

    // Hämta entitet som ska synkas
    let entity: any;
    let payload: any;

    if (entityType === 'booking') {
      entity = await prisma.booking.findUnique({
        where: { id: entityId },
        include: {
          customer: true,
          service: true,
          staff: true
        }
      });

      if (!entity) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Bygg GHL appointment payload
      payload = {
        locationId: clinic.ghlLocationId,
        contactId: entity.customer.email || entity.customer.phone, // GHL contact ID
        title: entity.service?.name || 'Booking',
        startTime: entity.scheduledTime.toISOString(),
        endTime: new Date(entity.scheduledTime.getTime() + (entity.duration || 60) * 60000).toISOString(),
        assignedUserId: entity.staff?.email, // GHL user ID
        notes: entity.notes || '',
        status: mapBookingStatusToGHL(entity.status)
      };
    } else if (entityType === 'customer') {
      entity = await prisma.customer.findUnique({
        where: { id: entityId }
      });

      if (!entity) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      // Bygg GHL contact payload
      payload = {
        locationId: clinic.ghlLocationId,
        firstName: entity.firstName || entity.name?.split(' ')[0] || '',
        lastName: entity.lastName || entity.name?.split(' ').slice(1).join(' ') || '',
        email: entity.email || '',
        phone: entity.phone || '',
        source: 'Flow Integration',
        tags: entity.tags || [],
        customFields: {
          total_bookings: entity.totalBookings,
          lifetime_value: entity.lifetimeValue?.toString(),
          health_score: entity.healthScore
        }
      };
    } else {
      return NextResponse.json({
        error: 'Unsupported entity type'
      }, { status: 400 });
    }

    // Skicka till GHL API
    const ghlEndpoint = entityType === 'booking' 
      ? 'https://rest.gohighlevel.com/v1/appointments'
      : 'https://rest.gohighlevel.com/v1/contacts';

    const ghlResponse = await fetch(ghlEndpoint, {
      method: action === 'create' ? 'POST' : 'PUT',
      headers: {
        'Authorization': `Bearer ${clinic.ghlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const ghlData = await ghlResponse.json();

    // Logga synkningen
    await prisma.gHLIntegrationLog.create({
      data: {
        clinicId: session.user.clinicId,
        action,
        entityType,
        entityId,
        ghlId: ghlData.id || ghlData.contact?.id,
        status: ghlResponse.ok ? 'success' : 'failed',
        errorMessage: ghlResponse.ok ? null : JSON.stringify(ghlData),
        requestPayload: payload,
        responsePayload: ghlData
      }
    });

    // Uppdatera lastSync på kliniken
    await prisma.clinic.update({
      where: { id: session.user.clinicId },
      data: { ghlLastSync: new Date() }
    });

    return NextResponse.json({
      success: ghlResponse.ok,
      ghlId: ghlData.id || ghlData.contact?.id,
      message: ghlResponse.ok 
        ? `${entityType} synced to GoHighLevel` 
        : 'Sync failed',
      details: ghlData
    });

  } catch (error) {
    console.error('GHL sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync to GoHighLevel' },
      { status: 500 }
    );
  }
}

function mapBookingStatusToGHL(status: string): string {
  const statusMap: Record<string, string> = {
    'SCHEDULED': 'confirmed',
    'CONFIRMED': 'confirmed',
    'COMPLETED': 'showed',
    'NO_SHOW': 'no_show',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status] || 'confirmed';
}

// GET endpoint för att hämta sync-status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.clinicId },
      select: {
        ghlEnabled: true,
        ghlLastSync: true
      }
    });

    // Hämta senaste sync-loggar
    const logs = await prisma.gHLIntegrationLog.findMany({
      where: { clinicId: session.user.clinicId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const stats = {
      totalSyncs: logs.length,
      successful: logs.filter(l => l.status === 'success').length,
      failed: logs.filter(l => l.status === 'failed').length,
      lastSync: clinic?.ghlLastSync
    };

    return NextResponse.json({
      success: true,
      enabled: clinic?.ghlEnabled || false,
      stats,
      recentLogs: logs.map(l => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        status: l.status,
        createdAt: l.createdAt,
        errorMessage: l.errorMessage
      }))
    });

  } catch (error) {
    console.error('GHL status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GHL status' },
      { status: 500 }
    );
  }
}
