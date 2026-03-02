/**
 * GET /api/dashboard/schedule?date=YYYY-MM-DD
 *
 * Returnerar bokningar + personal + dagstatistik för ett givet datum.
 * Skyddad av NextAuth – kräver giltig session.
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getAuthSession,
  getClinicFilter,
  unauthorizedResponse,
  errorResponse,
} from '@/lib/multi-tenant-security';

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  let session: Awaited<ReturnType<typeof getAuthSession>>;
  try {
    session = await getAuthSession();
  } catch {
    return unauthorizedResponse();
  }

  try {
    const clinicFilter = getClinicFilter(session);

    // ── Datum ────────────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const rawDate = searchParams.get('date') ?? '';
    const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : formatLocalDate(new Date());

    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    // ── Hämta data parallellt ─────────────────────────────────────────────────
    const [bookings, staff] = await Promise.all([
      prisma.booking.findMany({
        where: {
          ...clinicFilter,
          scheduledTime: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          customer: { select: { name: true, firstName: true, lastName: true } },
          staff: { select: { id: true, name: true } },
          service: { select: { name: true, duration: true } },
        },
        orderBy: { scheduledTime: 'asc' },
      }),

      prisma.staff.findMany({
        where: { ...clinicFilter, isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // ── Serialisera bokningar ─────────────────────────────────────────────────
    const serializedBookings = bookings.map((b) => ({
      id: b.id,
      scheduledTime: b.scheduledTime.toISOString(),
      duration: b.duration ?? b.service?.duration ?? 60,
      status: b.status,
      customerName:
        b.customer?.name ||
        [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(' ') ||
        'Okänd kund',
      serviceName: b.service?.name ?? 'Okänd tjänst',
      staffId: b.staffId ?? null,
      staffName: b.staff?.name ?? null,
    }));

    // ── Serialisera personal ──────────────────────────────────────────────────
    const serializedStaff = staff.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role ?? null,
    }));

    // ── Statistik ─────────────────────────────────────────────────────────────
    const total = serializedBookings.length;
    const completed = serializedBookings.filter(
      (b) => b.status === 'COMPLETED' || b.status === 'completed',
    ).length;
    const cancelled = serializedBookings.filter(
      (b) => b.status === 'CANCELLED' || b.status === 'cancelled',
    ).length;
    const noShow = serializedBookings.filter(
      (b) => b.status === 'NO_SHOW' || b.status === 'no_show',
    ).length;
    const active = total - cancelled;

    // Enkel beläggning: aktiva bokningar / (personal × 22 slots på 30 min från 08-19)
    const totalSlots = serializedStaff.length * 22;
    const occupancyPercent =
      totalSlots > 0 ? Math.min(100, Math.round((active / totalSlots) * 100)) : 0;

    return NextResponse.json({
      success: true,
      date: dateStr,
      bookings: serializedBookings,
      staff: serializedStaff,
      stats: {
        total,
        active,
        completed,
        cancelled,
        noShow,
        occupancyPercent,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
