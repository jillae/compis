'use client';

import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HamburgerMenu } from '@/components/dashboard/hamburger-menu';
import {
  Sun,
  Moon,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart2,
  Target,
  Star,
  Megaphone,
  Shield,
  PieChart,
  UserCheck,
  ChevronRight,
  ArrowRight,
  Activity,
  Banknote,
  CalendarDays,
  Stethoscope,
  LogIn,
  Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'drift' | 'strategi';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  checked_in: boolean;
  next_booking: string | null;
  avatar: string;
}

interface WeekDay {
  label: string;
  short: string;
  booked: number;
  total: number;
  pct: number;
  isToday: boolean;
}

interface DashAlert {
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

interface KpiCard {
  label: string;
  value: string;
  change?: string | null;
  positive?: boolean;
}

interface StaffPerf {
  name: string;
  role: string;
  revenue: string;
  bookings: number;
  completion: number;
}

interface TodaySnapshot {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  remaining: number;
  staffCheckedIn: number;
  staffTotal: number;
}

interface DashboardData {
  staff: StaffMember[];
  weekCapacity: WeekDay[];
  todaySnapshot: TodaySnapshot;
  kpis: KpiCard[];
  staffPerformance: StaffPerf[];
  alerts: DashAlert[];
  generatedAt: string;
}

// ─── Static AI recommendations (these stay static — they'll come from Corex later) ─

const AI_RECOMMENDATIONS = [
  {
    icon: <Megaphone className="h-5 w-5 text-blue-500" />,
    title: 'Fyll lediga tider',
    body: 'Det finns dagar med låg beläggning denna vecka. Skicka ett SMS-erbjudande till inaktiva kunder.',
    cta: 'Skapa kampanj',
    href: '/dashboard/marketing-triggers',
  },
  {
    icon: <Star className="h-5 w-5 text-amber-500" />,
    title: 'Säsongspush',
    body: 'Analysera vilka behandlingar som säljer bäst just nu och lyft dem i bokningsmotorn.',
    cta: 'Visa analys',
    href: '/dashboard/analytics',
  },
  {
    icon: <Target className="h-5 w-5 text-emerald-500" />,
    title: 'Återaktivera sovande kunder',
    body: 'Kunder som inte bokat på 60+ dagar kan nås med automatiserade återaktiveringskampanjer.',
    cta: 'Starta flöde',
    href: '/dashboard/marketing-triggers/create',
  },
];

const ADVANCED_TOOLS = [
  { label: 'Simulator', icon: <Activity className="h-5 w-5" />, href: '/dashboard/simulator' },
  { label: 'Marknadsföring', icon: <Megaphone className="h-5 w-5" />, href: '/dashboard/marketing-triggers' },
  { label: 'Riskvarningar', icon: <Shield className="h-5 w-5" />, href: '/dashboard/at-risk' },
  { label: 'Segment', icon: <PieChart className="h-5 w-5" />, href: '/dashboard/segments' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capacityColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-400';
  return 'bg-red-500';
}

function capacityTextColor(pct: number): string {
  if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function alertStyles(type: string): string {
  if (type === 'error') return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40';
  if (type === 'warning') return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40';
  return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40';
}

function alertIconColor(type: string): string {
  if (type === 'error') return 'text-red-500';
  if (type === 'warning') return 'text-amber-500';
  return 'text-blue-500';
}

function alertIcon(type: string) {
  if (type === 'error') return <AlertTriangle className="h-5 w-5" />;
  if (type === 'warning') return <Clock className="h-5 w-5" />;
  return <BarChart2 className="h-5 w-5" />;
}

function kpiIcon(label: string) {
  if (label.includes('Intäkt')) return <Banknote className="h-5 w-5 text-emerald-500" />;
  if (label.includes('Bokn')) return <CalendarDays className="h-5 w-5 text-blue-500" />;
  if (label.includes('Genomför')) return <CheckCircle className="h-5 w-5 text-emerald-500" />;
  if (label.includes('Nya')) return <Users className="h-5 w-5 text-violet-500" />;
  if (label.includes('Snitt')) return <TrendingUp className="h-5 w-5 text-amber-500" />;
  return <Activity className="h-5 w-5 text-stone-500" />;
}

// ─── PIN Modal ────────────────────────────────────────────────────────────────

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PinModal({ open, onClose, onSuccess }: PinModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const CORRECT_PIN = '1234';

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '']);
      setError(false);
      setShake(false);
      setTimeout(() => refs[0].current?.focus(), 100);
    }
  }, [open]);

  function handleChange(index: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError(false);

    if (char && index < 3) {
      refs[index + 1].current?.focus();
    }

    if (index === 3 && char) {
      const pin = [...next.slice(0, 3), char].join('');
      if (pin.length === 4) checkPin(pin);
    }
  }

  function checkPin(pin: string) {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem('flow-strategy-unlocked', 'true');
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setDigits(['', '', '', '']);
        refs[0].current?.focus();
      }, 600);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs text-center bg-white dark:bg-stone-900 rounded-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="bg-stone-100 dark:bg-stone-800 rounded-full p-3">
              <Shield className="h-6 w-6 text-stone-600 dark:text-stone-300" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Ange PIN-kod
          </DialogTitle>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Strategi-läget kräver behörighet.
          </p>
        </DialogHeader>

        <div
          className={`flex gap-3 justify-center mt-4 transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100
                focus:border-stone-900 dark:focus:border-stone-200
                ${error
                  ? 'border-red-400 dark:border-red-500'
                  : d
                  ? 'border-stone-400 dark:border-stone-500'
                  : 'border-stone-200 dark:border-stone-600'
                }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-3 font-medium">
            Fel PIN-kod. Försök igen.
          </p>
        )}

        <Button
          variant="ghost"
          className="mt-4 w-full text-stone-500"
          onClick={onClose}
        >
          Avbryt
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff Avatar ─────────────────────────────────────────────────────────────

function StaffAvatar({ initials, checkedIn }: { initials: string; checkedIn: boolean }) {
  return (
    <div className="relative inline-flex">
      <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-semibold text-stone-700 dark:text-stone-200 text-sm">
        {initials}
      </div>
      <span
        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-stone-900 ${
          checkedIn ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
        }`}
      />
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded w-64" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-stone-200 dark:bg-stone-800 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession() || {};
  const [mode, setMode] = useState<Mode>('drift');
  const [showPin, setShowPin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard/overview');
      if (!res.ok) throw new Error('Kunde inte ladda dashboard');
      const json = await res.json();
      if (json.success) {
        setDashData(json);
      } else {
        throw new Error(json.error || 'API-fel');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // On mount: check sessionStorage + system dark preference
  useEffect(() => {
    const unlocked = sessionStorage.getItem('flow-strategy-unlocked') === 'true';
    if (unlocked) setMode('strategi');

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Apply/remove dark class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  function requestStrategi() {
    const alreadyUnlocked = sessionStorage.getItem('flow-strategy-unlocked') === 'true';
    if (alreadyUnlocked) {
      setMode('strategi');
    } else {
      setShowPin(true);
    }
  }

  function handlePinSuccess() {
    setShowPin(false);
    setMode('strategi');
  }

  function switchToDrift() {
    setMode('drift');
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
              <span className="text-white dark:text-stone-900 font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Flow</span>
          </div>

          {/* Mode toggle — centered */}
          <div className="flex-1 flex justify-center">
            <div className="inline-flex rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 p-1 gap-1">
              <button
                onClick={switchToDrift}
                className={`min-h-[44px] px-5 rounded-full text-sm font-medium transition-all
                  ${mode === 'drift'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
              >
                Drift
              </button>
              <button
                onClick={requestStrategi}
                className={`min-h-[44px] px-5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                  ${mode === 'strategi'
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
              >
                {mode !== 'strategi' && <Shield className="h-3.5 w-3.5" />}
                Strategi
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Växla mörkt läge"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-stone-500 dark:text-stone-400" />
              ) : (
                <Moon className="h-5 w-5 text-stone-500" />
              )}
            </button>
            <HamburgerMenu userRole={session?.user?.role} />
          </div>
        </div>
      </header>

      {/* ── PIN MODAL ──────────────────────────────────────────────────────── */}
      <PinModal
        open={showPin}
        onClose={() => setShowPin(false)}
        onSuccess={handlePinSuccess}
      />

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
              Försök igen
            </Button>
          </div>
        ) : mode === 'drift' ? (
          <DriftView data={dashData!} onRefresh={fetchData} />
        ) : (
          <StrategiView data={dashData!} />
        )}
      </main>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

// ─── DRIFT VIEW ───────────────────────────────────────────────────────────────

function DriftView({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayLabel = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const snap = data.todaySnapshot;
  const occupancyPct = snap.total > 0 ? Math.round(((snap.total - snap.cancelled) / Math.max(snap.total, data.weekCapacity.find(d => d.isToday)?.total || snap.total)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Dagens sammanfattning */}
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {todayLabel}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Drift-läge
            <span className="text-[10px] text-stone-400 dark:text-stone-600 ml-2">
              Uppdaterad {new Date(data.generatedAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Bokningar idag',
              value: `${snap.total - snap.cancelled} / ${data.weekCapacity.find(d => d.isToday)?.total || snap.total}`,
              icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
              sub: `${snap.remaining} kvar, ${snap.completed} klara`,
            },
            {
              label: 'Beläggning',
              value: `${data.weekCapacity.find(d => d.isToday)?.pct || occupancyPct}%`,
              icon: <Activity className="h-5 w-5 text-amber-500" />,
              sub: 'Mål: 85%',
            },
            {
              label: 'No-shows idag',
              value: snap.noShow.toString(),
              icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
              sub: snap.noShow === 0 ? 'Inga uteblivna' : `${snap.noShow} missade`,
            },
            {
              label: 'Personal på plats',
              value: `${snap.staffCheckedIn} / ${snap.staffTotal}`,
              icon: <UserCheck className="h-5 w-5 text-violet-500" />,
              sub: snap.staffCheckedIn < snap.staffTotal
                ? `${snap.staffTotal - snap.staffCheckedIn} ej incheckad`
                : 'Alla incheckade',
            },
          ].map((kpi) => (
            <Card
              key={kpi.label}
              className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  {kpi.icon}
                </div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {kpi.value}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Veckovy */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-stone-500" />
          Veckovy
        </h2>
        <Card className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {data.weekCapacity.map((day) => (
                <div
                  key={day.short}
                  className={`rounded-xl p-3 transition-colors ${
                    day.isToday
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                      : 'bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  <p
                    className={`text-xs font-medium mb-1 ${
                      day.isToday
                        ? 'text-stone-300 dark:text-stone-600'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {day.short}
                    {day.isToday && (
                      <span className="ml-1 text-stone-400 dark:text-stone-500 text-[10px]">
                        ● idag
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      day.isToday
                        ? 'text-white dark:text-stone-900'
                        : capacityTextColor(day.pct)
                    }`}
                  >
                    {day.pct}%
                  </p>
                  <p
                    className={`text-xs mt-0.5 mb-2 ${
                      day.isToday
                        ? 'text-stone-300 dark:text-stone-500'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {day.booked}/{day.total} bokade
                  </p>
                  <div
                    className={`w-full h-1.5 rounded-full ${
                      day.isToday
                        ? 'bg-stone-700 dark:bg-stone-300'
                        : 'bg-stone-200 dark:bg-stone-600'
                    } overflow-hidden`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        day.isToday
                          ? 'bg-white dark:bg-stone-900'
                          : capacityColor(day.pct)
                      }`}
                      style={{ width: `${day.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Personal idag */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-stone-500" />
          Personal idag
        </h2>
        {data.staff.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.staff.map((s) => (
              <Card
                key={s.id}
                className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm"
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <StaffAvatar initials={s.avatar} checkedIn={s.checked_in} />
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-stone-100 text-sm leading-tight">
                      {s.name}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{s.role}</p>
                  </div>
                  <Badge
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.checked_in
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {s.checked_in ? 'Incheckad' : 'Ej incheckad'}
                  </Badge>
                  {s.next_booking && (
                    <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Nästa: {s.next_booking}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
            <CardContent className="p-6 text-center text-stone-400 dark:text-stone-500 text-sm">
              Ingen personal registrerad ännu
            </CardContent>
          </Card>
        )}
      </section>

      {/* 4. Varningar */}
      {data.alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-stone-500" />
            Varningar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.alerts.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 flex gap-3 items-start ${alertStyles(a.type)}`}
              >
                <span className={`mt-0.5 flex-shrink-0 ${alertIconColor(a.type)}`}>
                  {alertIcon(a.type)}
                </span>
                <div>
                  <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                    {a.title}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Snabblänkar */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-stone-500" />
          Snabblänkar
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Dagens Schema',
              icon: <CalendarDays className="h-7 w-7" />,
              href: '/dashboard/schedule',
              color: 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 border-2 border-stone-300 dark:border-stone-600',
            },
            {
              label: 'Veckoschema',
              icon: <Calendar className="h-7 w-7" />,
              href: '/dashboard/staff/schedule',
              color: 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300',
            },
            {
              label: 'Stämpla in/ut',
              icon: <LogIn className="h-7 w-7" />,
              href: '/dashboard/staff/timesheet',
              color: 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
            },
            {
              label: 'Kapacitet',
              icon: <Activity className="h-7 w-7" />,
              href: '/dashboard/capacity',
              color: 'bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/60 text-violet-700 dark:text-violet-300',
            },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`rounded-xl border border-stone-200 dark:border-stone-800 p-5 flex flex-col items-center justify-center gap-3 min-h-[100px] font-medium transition-colors cursor-pointer ${link.color}`}
            >
              {link.icon}
              <span className="text-sm font-semibold">{link.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── STRATEGI VIEW ────────────────────────────────────────────────────────────

function StrategiView({ data }: { data: DashboardData }) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header band */}
      <div className="flex items-center gap-3 pb-1">
        <div className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg px-3 py-1 text-xs font-bold tracking-wide">
          STRATEGI
        </div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Analysdashboard — {monthLabel}
        </h1>
      </div>

      {/* 1. KPI-kort */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-stone-500" />
          KPI-översikt
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {data.kpis.map((kpi) => (
            <Card
              key={kpi.label}
              className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide leading-tight">
                    {kpi.label}
                  </span>
                  <span className="text-stone-400 dark:text-stone-500">{kpiIcon(kpi.label)}</span>
                </div>
                <p className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {kpi.value}
                </p>
                {kpi.change && (
                  <p
                    className={`text-xs mt-0.5 font-medium ${
                      kpi.positive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {kpi.positive ? '▲' : '▼'} {kpi.change} vs förra månaden
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 2. Intäktsöversikt */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-stone-500" />
          Intäktsöversikt
        </h2>
        <Card className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
          <CardContent className="p-6">
            {/* Chart placeholder — will be connected to chart library */}
            <div className="h-56 flex flex-col items-center justify-center gap-3 text-stone-400 dark:text-stone-600 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-xl">
              <BarChart2 className="h-10 w-10" />
              <p className="text-sm font-medium">Intäktsdiagram kopplas snart</p>
              <p className="text-xs text-stone-300 dark:text-stone-600">Realtidsdata laddas från API</p>
            </div>
            {/* Summary row using real KPI data */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              {data.kpis.filter(k => k.label.includes('Intäkt') || k.label.includes('Bokn') || k.label.includes('Snitt')).slice(0, 3).map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-stone-400 dark:text-stone-500">{item.label}</p>
                  <p className="font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. AI Rekommendationer */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5 text-stone-500" />
          AI-rekommendationer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AI_RECOMMENDATIONS.map((rec) => (
            <Card
              key={rec.title}
              className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex flex-col gap-3 h-full">
                <div className="flex items-center gap-2">
                  <div className="bg-stone-100 dark:bg-stone-800 rounded-lg p-2">
                    {rec.icon}
                  </div>
                  <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                    {rec.title}
                  </p>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed flex-1">
                  {rec.body}
                </p>
                <a href={rec.href}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs mt-auto border-stone-200 dark:border-stone-700 min-h-[44px]"
                  >
                    {rec.cta}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Personalprestation */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-stone-500" />
          Personalprestation
        </h2>
        <Card className="rounded-xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
          <CardContent className="p-0">
            {data.staffPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-800">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                        Personal
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                        Roll
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                        Intäkt
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                        Bokningar
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wide">
                        Genomförd %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffPerformance.map((s, i) => (
                      <tr
                        key={s.name}
                        className="border-b border-stone-50 dark:border-stone-800/50 last:border-0 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-semibold text-stone-600 dark:text-stone-300">
                              {i + 1}
                            </div>
                            <span className="font-medium text-stone-900 dark:text-stone-100">
                              {s.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-stone-500 dark:text-stone-400 text-xs">
                          {s.role}
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-stone-900 dark:text-stone-100">
                          {s.revenue}
                        </td>
                        <td className="px-4 py-3.5 text-right text-stone-600 dark:text-stone-300">
                          {s.bookings}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`font-medium ${
                              s.completion >= 93
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : s.completion >= 88
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {s.completion}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-stone-400 dark:text-stone-500 text-sm">
                Ingen prestationsdata tillgänglig ännu
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 5. Avancerade verktyg */}
      <section>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-stone-500" />
          Avancerade verktyg
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ADVANCED_TOOLS.map((tool) => (
            <a
              key={tool.label}
              href={tool.href}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 transition-all p-5 flex flex-col items-center justify-center gap-3 min-h-[100px] cursor-pointer group"
            >
              <span className="text-stone-500 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors">
                {tool.icon}
              </span>
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                {tool.label}
              </span>
              <ChevronRight className="h-4 w-4 text-stone-300 dark:text-stone-600 group-hover:translate-x-0.5 transition-transform" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
