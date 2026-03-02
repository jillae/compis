'use client';

/**
 * ScheduleView – Interaktiv dagvy för KlinikFlow-korridorskärmen
 *
 * Props tas emot från servern (page.tsx) och renderas som ett
 * klickbart/swipbart tidsgaller, optimerat för pekskärmar.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// ── Typer ─────────────────────────────────────────────────────────────────────

export interface SerializedBooking {
  id: string;
  scheduledTime: string; // ISO
  duration: number; // minuter
  status: string;
  customerName: string;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
}

export interface SerializedStaff {
  id: string;
  name: string;
  role: string | null;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  noShow: number;
  occupancyPercent: number;
}

interface ScheduleViewProps {
  bookings: SerializedBooking[];
  staff: SerializedStaff[];
  date: string; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
  stats: Stats;
}

// ── Konstanter ────────────────────────────────────────────────────────────────

const GRID_START_HOUR = 8; // 08:00
const GRID_END_HOUR = 19; // 19:00
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 56; // varje 30-min-rad = 56 px
const COLUMN_WIDTH_PX = 200; // varje personalkolumn

const TOTAL_MINUTES = (GRID_END_HOUR - GRID_START_HOUR) * 60; // 660
const GRID_HEIGHT_PX = (TOTAL_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT_PX;

// ── Statusfärger ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-600/80 border-blue-500 text-white',
  CONFIRMED: 'bg-emerald-600/80 border-emerald-500 text-white',
  IN_PROGRESS: 'bg-violet-600/80 border-violet-500 text-white',
  COMPLETED: 'bg-zinc-600/80 border-zinc-500 text-zinc-100',
  CANCELLED: 'bg-red-900/40 border-red-800 text-red-300 opacity-50',
  NO_SHOW: 'bg-amber-600/80 border-amber-500 text-white',
  // lowercase varianter (Bokadirekt)
  completed: 'bg-zinc-600/80 border-zinc-500 text-zinc-100',
  cancelled: 'bg-red-900/40 border-red-800 text-red-300 opacity-50',
  no_show: 'bg-amber-600/80 border-amber-500 text-white',
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Schemalagd',
  CONFIRMED: 'Bekräftad',
  IN_PROGRESS: 'Pågående',
  COMPLETED: 'Klar',
  CANCELLED: 'Avbokad',
  NO_SHOW: 'Uteblev',
  completed: 'Klar',
  cancelled: 'Avbokad',
  no_show: 'Uteblev',
};

// ── Hjälpfunktioner ───────────────────────────────────────────────────────────

/** Returnerar antal minuter sedan GRID_START_HOUR */
function minutesFromGridStart(isoTime: string): number {
  const d = new Date(isoTime);
  return (d.getHours() - GRID_START_HOUR) * 60 + d.getMinutes();
}

/** Formaterar tid HH:MM */
function formatTime(isoTime: string): string {
  const d = new Date(isoTime);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Nästa datum / föregående datum som YYYY-MM-DD */
function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Formaterar datum på svenska: "Måndag 2 mars 2026" */
function formatSwedishDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`); // noon för att undvika DST-problem
  return d.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Genererar avatar-initialer från ett namn */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Deterministisk bakgrundsfärg baserat på id/namn */
const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-violet-600',
  'bg-sky-600',
  'bg-teal-600',
  'bg-rose-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-lime-600',
];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Tidsrubriker vänster ──────────────────────────────────────────────────────

function TimeAxis() {
  const slots: string[] = [];
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return (
    <div
      className="flex-shrink-0 w-14 relative select-none"
      style={{ height: GRID_HEIGHT_PX }}
    >
      {slots.map((label, i) => (
        <div
          key={label}
          className="absolute right-2 -translate-y-1/2 text-xs text-zinc-500 font-mono whitespace-nowrap"
          style={{ top: i * SLOT_HEIGHT_PX }}
        >
          {i % 2 === 0 ? label : ''}
        </div>
      ))}
    </div>
  );
}

// ── Bakgrundsgaller ───────────────────────────────────────────────────────────

function GridBackground({ columnCount }: { columnCount: number }) {
  const slots: number[] = [];
  const totalSlots = TOTAL_MINUTES / SLOT_MINUTES;
  for (let i = 0; i <= totalSlots; i++) slots.push(i);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ width: columnCount * COLUMN_WIDTH_PX }}
    >
      {slots.map((i) => (
        <div
          key={i}
          className={`absolute w-full border-t ${
            i % 2 === 0 ? 'border-zinc-700/60' : 'border-zinc-800/40'
          }`}
          style={{ top: i * SLOT_HEIGHT_PX }}
        />
      ))}
    </div>
  );
}

// ── Bokningsblock ─────────────────────────────────────────────────────────────

interface BookingBlockProps {
  booking: SerializedBooking;
  onClick: (b: SerializedBooking) => void;
}

function BookingBlock({ booking, onClick }: BookingBlockProps) {
  const top = minutesFromGridStart(booking.scheduledTime);
  const height = Math.max(booking.duration, SLOT_MINUTES);
  const topPx = (top / SLOT_MINUTES) * SLOT_HEIGHT_PX;
  const heightPx = (height / SLOT_MINUTES) * SLOT_HEIGHT_PX - 4; // 2px mellanrum top+botten
  const isCancelled =
    booking.status === 'CANCELLED' || booking.status === 'cancelled';

  const style = STATUS_STYLES[booking.status] ?? 'bg-zinc-700 border-zinc-600 text-white';

  return (
    <button
      onClick={() => onClick(booking)}
      className={`absolute left-1 right-1 rounded-md border px-2 py-1 text-left 
        overflow-hidden transition-all duration-150 active:scale-95
        hover:brightness-110 cursor-pointer
        min-h-[44px] touch-manipulation
        ${style}
        ${isCancelled ? 'line-through' : ''}`}
      style={{ top: topPx + 2, height: heightPx }}
      aria-label={`${booking.customerName} – ${booking.serviceName} kl ${formatTime(booking.scheduledTime)}`}
    >
      <div className="font-semibold text-xs leading-tight truncate">
        {booking.customerName}
      </div>
      {heightPx > 44 && (
        <div className="text-[11px] leading-tight truncate opacity-80 mt-0.5">
          {booking.serviceName}
        </div>
      )}
      {heightPx > 60 && (
        <div className="text-[11px] leading-tight opacity-70 mt-0.5 flex items-center gap-1">
          <Clock className="h-2.5 w-2.5 inline" />
          {formatTime(booking.scheduledTime)}
          {booking.duration && ` · ${booking.duration} min`}
        </div>
      )}
    </button>
  );
}

// ── Personalkolumn ────────────────────────────────────────────────────────────

interface StaffColumnProps {
  member: SerializedStaff;
  bookings: SerializedBooking[];
  onBookingClick: (b: SerializedBooking) => void;
}

function StaffColumn({ member, bookings, onBookingClick }: StaffColumnProps) {
  return (
    <div className="flex-shrink-0" style={{ width: COLUMN_WIDTH_PX }}>
      {/* Kolumnhuvud */}
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-r border-zinc-700 px-3 py-3 flex items-center gap-2.5 min-h-[64px]">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${avatarColor(member.id)}`}
        >
          {getInitials(member.name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-100 text-sm truncate leading-tight">
            {member.name}
          </p>
          {member.role && (
            <p className="text-xs text-zinc-400 truncate leading-tight">{member.role}</p>
          )}
        </div>
      </div>

      {/* Tidsgaller för denna personal */}
      <div
        className="relative border-r border-zinc-800"
        style={{ height: GRID_HEIGHT_PX, width: COLUMN_WIDTH_PX }}
      >
        {bookings.map((b) => (
          <BookingBlock key={b.id} booking={b} onClick={onBookingClick} />
        ))}
      </div>
    </div>
  );
}

// ── "Oassignerade" kolumn ─────────────────────────────────────────────────────

function UnassignedColumn({
  bookings,
  onBookingClick,
}: {
  bookings: SerializedBooking[];
  onBookingClick: (b: SerializedBooking) => void;
}) {
  if (bookings.length === 0) return null;
  return (
    <div className="flex-shrink-0" style={{ width: COLUMN_WIDTH_PX }}>
      <div className="sticky top-0 z-10 bg-zinc-900 border-b border-r border-zinc-700 px-3 py-3 flex items-center gap-2.5 min-h-[64px]">
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-700 text-zinc-300 font-bold text-xs flex-shrink-0">
          ?
        </div>
        <div>
          <p className="font-semibold text-zinc-400 text-sm">Ej tilldelad</p>
        </div>
      </div>
      <div className="relative border-r border-zinc-800" style={{ height: GRID_HEIGHT_PX }}>
        {bookings.map((b) => (
          <BookingBlock key={b.id} booking={b} onClick={onBookingClick} />
        ))}
      </div>
    </div>
  );
}

// ── Bokningsdetalj-modal (enkel) ──────────────────────────────────────────────

interface BookingDetailProps {
  booking: SerializedBooking | null;
  onClose: () => void;
}

function BookingDetail({ booking, onClose }: BookingDetailProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!booking) return null;

  const style = STATUS_STYLES[booking.status] ?? 'bg-zinc-700 border-zinc-600 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status-badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 -mr-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-zinc-800"
            aria-label="Stäng"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Info */}
        <h3 className="text-xl font-bold text-zinc-100 mb-1">{booking.customerName}</h3>
        <p className="text-zinc-400 text-sm mb-4">{booking.serviceName}</p>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-zinc-300">
            <Clock className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <span>
              {formatTime(booking.scheduledTime)}
              {booking.duration ? ` · ${booking.duration} min` : ''}
            </span>
          </div>
          {booking.staffName && (
            <div className="flex items-center gap-3 text-zinc-300">
              <Users className="h-4 w-4 text-zinc-500 flex-shrink-0" />
              <span>{booking.staffName}</span>
            </div>
          )}
        </div>

        <Button
          className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 min-h-[52px] text-base font-medium"
          onClick={onClose}
        >
          Stäng
        </Button>
      </div>
    </div>
  );
}

// ── Nuvarande tid-indikator ───────────────────────────────────────────────────

function NowIndicator({ date }: { date: string }) {
  const [pos, setPos] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (todayStr !== date) {
        setPos(null);
        return;
      }
      const mins = (now.getHours() - GRID_START_HOUR) * 60 + now.getMinutes();
      if (mins < 0 || mins > TOTAL_MINUTES) {
        setPos(null);
        return;
      }
      setPos((mins / SLOT_MINUTES) * SLOT_HEIGHT_PX);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [date]);

  if (pos === null) return null;

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: pos }}
    >
      <div className="relative flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1.5 shadow-lg shadow-red-500/40" />
        <div className="flex-1 h-px bg-red-500/70" />
      </div>
    </div>
  );
}

// ── Nästa bokning ─────────────────────────────────────────────────────────────

function NextBookingBadge({ bookings }: { bookings: SerializedBooking[] }) {
  const next = useMemo(() => {
    const now = new Date().toISOString();
    return bookings
      .filter(
        (b) =>
          b.scheduledTime > now &&
          b.status !== 'CANCELLED' &&
          b.status !== 'cancelled',
      )
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))[0] ?? null;
  }, [bookings]);

  if (!next) return <span className="text-zinc-500 text-sm">Inga fler bokningar idag</span>;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-zinc-400 flex-shrink-0" />
      <span className="text-zinc-400">Nästa:</span>
      <span className="font-semibold text-zinc-100">{formatTime(next.scheduledTime)}</span>
      <span className="text-zinc-300 truncate max-w-[160px]">{next.customerName}</span>
    </div>
  );
}

// ── Huvud: ScheduleView ───────────────────────────────────────────────────────

export function ScheduleView({ bookings, staff, date, today, stats }: ScheduleViewProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedBooking, setSelectedBooking] = useState<SerializedBooking | null>(null);

  // Navigera till annat datum
  const navigate = useCallback(
    (targetDate: string) => {
      router.push(`/dashboard/schedule?date=${targetDate}`);
    },
    [router],
  );

  // Bygg lookup: staffId → bokningar
  const bookingsByStaff = useMemo(() => {
    const map = new Map<string | null, SerializedBooking[]>();
    for (const b of bookings) {
      const key = b.staffId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [bookings]);

  const unassigned = bookingsByStaff.get(null) ?? [];

  const isToday = date === today;
  const prevDate = offsetDate(date, -1);
  const nextDate = offsetDate(date, +1);
  const swedishDate = formatSwedishDate(date);
  const displayDate = swedishDate.charAt(0).toUpperCase() + swedishDate.slice(1);

  // Scroll till nuvarande tid vid första rendering (om idag)
  useEffect(() => {
    if (!isToday || !scrollRef.current) return;
    const now = new Date();
    const mins = (now.getHours() - GRID_START_HOUR) * 60 + now.getMinutes() - 60; // 1h bakåt
    if (mins < 0) return;
    const scrollY = (mins / SLOT_MINUTES) * SLOT_HEIGHT_PX;
    // Liten fördröjning för att layouten ska vara klar
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollY, behavior: 'smooth' }), 200);
  }, [isToday, date]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        {/* Datum-navigering */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl touch-manipulation"
            onClick={() => navigate(prevDate)}
            aria-label="Föregående dag"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center px-2 min-w-[180px]">
            <p className="font-semibold text-zinc-100 text-base leading-tight truncate">
              {displayDate}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl touch-manipulation"
            onClick={() => navigate(nextDate)}
            aria-label="Nästa dag"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Idag-knapp */}
        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] text-sm font-medium border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl touch-manipulation flex-shrink-0"
            onClick={() => navigate(today)}
          >
            <CalendarDays className="h-4 w-4 mr-1.5" />
            Idag
          </Button>
        )}

        <div className="flex-1" />

        {/* Bokningsräknare */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700 text-sm px-3 py-1 font-semibold">
            {stats.active} bokningar
          </Badge>
        </div>
      </header>

      {/* ── STAT-RAD ───────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-zinc-400">Klara:</span>
          <span className="font-semibold text-emerald-400">{stats.completed}</span>
        </div>
        <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
          <XCircle className="h-4 w-4 text-red-400" />
          <span className="text-zinc-400">Avbokade:</span>
          <span className="font-semibold text-red-400">{stats.cancelled}</span>
        </div>
        <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <span className="text-zinc-400">Uteblivna:</span>
          <span className="font-semibold text-amber-400">{stats.noShow}</span>
        </div>
        <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
          <Users className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-400">Personal:</span>
          <span className="font-semibold text-zinc-200">{staff.length}</span>
        </div>
      </div>

      {/* ── TOMT TILLSTÅND ──────────────────────────────────────────────────── */}
      {staff.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <Users className="h-16 w-16 text-zinc-700" />
          <h2 className="text-xl font-semibold text-zinc-400">Ingen aktiv personal</h2>
          <p className="text-zinc-600 text-sm max-w-xs">
            Lägg till personal i systeminställningarna för att se schemat.
          </p>
        </div>
      )}

      {/* ── SCHEMAGALLER ───────────────────────────────────────────────────── */}
      {staff.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div
            ref={scrollRef}
            className="flex-1 overflow-auto"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            <div className="flex min-w-max">
              {/* Tidsaxel */}
              <div className="sticky left-0 z-20 bg-zinc-950 border-r border-zinc-800">
                {/* Tom header-cell ovanför tidsaxeln */}
                <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-700 min-h-[64px]" />
                <TimeAxis />
              </div>

              {/* Personalkolumner */}
              <div className="relative flex">
                {/* Bakgrundsgaller */}
                <div className="absolute inset-0 pointer-events-none" style={{ top: 64 }}>
                  <GridBackground columnCount={staff.length + (unassigned.length > 0 ? 1 : 0)} />
                </div>

                {staff.map((member) => (
                  <StaffColumn
                    key={member.id}
                    member={member}
                    bookings={bookingsByStaff.get(member.id) ?? []}
                    onBookingClick={setSelectedBooking}
                  />
                ))}

                {/* Oassignerade */}
                <UnassignedColumn bookings={unassigned} onBookingClick={setSelectedBooking} />

                {/* Nuvarande-tid-linje (positioneras relativt personalkolumnerna) */}
                <div
                  className="absolute inset-x-0 pointer-events-none"
                  style={{ top: 64 }} // förbi kolumn-headern
                >
                  <NowIndicator date={date} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM SUMMARY BAR ─────────────────────────────────────────────── */}
      <footer className="sticky bottom-0 z-30 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-4 py-3 flex items-center gap-4">
        {/* Beläggning */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Beläggning
          </div>
          <div
            className={`text-lg font-bold ${
              stats.occupancyPercent >= 80
                ? 'text-emerald-400'
                : stats.occupancyPercent >= 50
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {stats.occupancyPercent}%
          </div>
        </div>

        {/* Mini progress-bar */}
        <div className="hidden sm:flex items-center gap-2 w-24 flex-shrink-0">
          <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.occupancyPercent >= 80
                  ? 'bg-emerald-500'
                  : stats.occupancyPercent >= 50
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${stats.occupancyPercent}%` }}
            />
          </div>
        </div>

        <div className="w-px h-6 bg-zinc-700 flex-shrink-0" />

        {/* Nästa bokning */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <NextBookingBadge bookings={bookings} />
        </div>

        {/* Totalt */}
        <div className="flex items-center gap-1.5 text-sm flex-shrink-0">
          <CalendarDays className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-400">{stats.active}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300 font-semibold">{stats.total}</span>
          <span className="text-zinc-500 text-xs">bokn.</span>
        </div>
      </footer>

      {/* ── BOKNINGSDETALJ-MODAL ───────────────────────────────────────────── */}
      <BookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </div>
  );
}
