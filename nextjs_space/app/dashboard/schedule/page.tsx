/**
 * Bokningsschema – Dagvy
 * /dashboard/schedule?date=YYYY-MM-DD
 *
 * Server component: hämtar bokningar + personal för vald dag,
 * skickar data som props till klientkomponenten ScheduleView.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getClinicFilter } from '@/lib/multi-tenant-security';
import { ScheduleView } from '@/components/dashboard/schedule-view';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering – sidan beror på sökparametrar och realtidsdata
export const dynamic = 'force-dynamic';

interface SchedulePageProps {
  searchParams: { date?: string };
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  // @ts-ignore – clinicId finns på user i vår session
  const clinicFilter = getClinicFilter(session as any);

  // ── Datum ─────────────────────────────────────────────────────────────────
  const today = formatLocalDate(new Date());
  const dateParam = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
    ? searchParams.date
    : today;

  const startOfDay = new Date(`${dateParam}T00:00:00`);
  const endOfDay = new Date(`${dateParam}T23:59:59`);

  // ── Hämta bokningar ───────────────────────────────────────────────────────
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

  // ── Serialisera för klientkomponenten ─────────────────────────────────────
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

  const serializedStaff = staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role ?? null,
  }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalSlots = serializedStaff.length * 22; // 11h × 2 slots/h per person
  const activeBookings = serializedBookings.filter(
    (b) => b.status !== 'CANCELLED' && b.status !== 'cancelled',
  );
  const occupancyPercent =
    totalSlots > 0 ? Math.min(100, Math.round((activeBookings.length / totalSlots) * 100)) : 0;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <ScheduleView
        bookings={serializedBookings}
        staff={serializedStaff}
        date={dateParam}
        today={today}
        stats={{
          total: serializedBookings.length,
          active: activeBookings.length,
          completed: serializedBookings.filter(
            (b) => b.status === 'COMPLETED' || b.status === 'completed',
          ).length,
          cancelled: serializedBookings.filter(
            (b) => b.status === 'CANCELLED' || b.status === 'cancelled',
          ).length,
          noShow: serializedBookings.filter(
            (b) => b.status === 'NO_SHOW' || b.status === 'no_show',
          ).length,
          occupancyPercent,
        }}
      />
    </Suspense>
  );
}
