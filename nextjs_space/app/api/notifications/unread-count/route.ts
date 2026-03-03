/**
 * GET /api/notifications/unread-count
 *
 * Returnerar antal olästa notiser – används för badge i NotificationBell.
 * Pollas var 30:e sekund från klienten.
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

export async function GET(_request: NextRequest) {
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
      return NextResponse.json({ success: true, count: 0 });
    }

    const count = await staffNotificationService.getUnreadCount(
      session.user.id,
      clinicId
    );

    return NextResponse.json({ success: true, count });
  } catch (error) {
    return errorResponse(error);
  }
}
