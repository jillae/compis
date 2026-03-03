/**
 * GET  /api/notifications  – Hämta notiser för inloggad personal
 * PUT  /api/notifications  – Markera notis/notiser som lästa
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthSession,
  getClinicFilter,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/multi-tenant-security';
import { staffNotificationService } from '@/lib/notifications/staff-notifications';

// ------------------------------------------------------------------
// GET – hämta notiser
// ------------------------------------------------------------------
export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);
    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'Ingen klinik kopplad till användaren' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);

    const notifications = unreadOnly
      ? await staffNotificationService.getUnread(session.user.id, clinicId, limit)
      : await staffNotificationService.getAll(session.user.id, clinicId, limit);

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

// ------------------------------------------------------------------
// PUT – markera som läst
// ------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);
    const clinicId = (clinicFilter as { clinicId?: string }).clinicId;

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'Ingen klinik kopplad till användaren' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { notificationId, markAll } = body as {
      notificationId?: string;
      markAll?: boolean;
    };

    if (markAll) {
      await staffNotificationService.markAllRead(session.user.id, clinicId);
      return NextResponse.json({ success: true, message: 'Alla notiser markerade som lästa' });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId eller markAll krävs' },
        { status: 400 }
      );
    }

    await staffNotificationService.markRead(notificationId);
    return NextResponse.json({ success: true, message: 'Notis markerad som läst' });
  } catch (error) {
    return errorResponse(error);
  }
}
