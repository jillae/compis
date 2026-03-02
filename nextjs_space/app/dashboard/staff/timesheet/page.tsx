'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getWeek,
  differenceInMinutes,
  addMonths,
  subMonths,
} from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Clock,
  Download,
  Play,
  Square,
  Users,
  Timer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Circle,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getClinicId = () => {
  return typeof window !== 'undefined' ? localStorage.getItem('clinicId') || '' : '';
};

interface StaffMember {
  id: string;
  name: string;
  role?: string;
}

interface TimeEntry {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // ISO date string
  clockIn: string | null; // ISO datetime or HH:mm
  clockOut: string | null;
  breakMinutes: number;
  notes?: string;
}

interface ActiveEntry {
  staffId: string;
  staffName: string;
  clockInTime: string; // ISO datetime
}

// Format minutes to "Xh Ym"
function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Parse a time string (HH:mm or ISO) and return HH:mm
function toHHMM(val: string | null): string {
  if (!val) return '-';
  try {
    if (val.includes('T')) {
      return format(parseISO(val), 'HH:mm');
    }
    return val.slice(0, 5);
  } catch {
    return val.slice(0, 5);
  }
}

// Compute worked minutes from clockIn/clockOut/break
function workedMinutes(entry: TimeEntry): number {
  if (!entry.clockIn || !entry.clockOut) return 0;
  try {
    const inDate = entry.clockIn.includes('T')
      ? parseISO(entry.clockIn)
      : new Date(`${entry.date}T${entry.clockIn}`);
    const outDate = entry.clockOut.includes('T')
      ? parseISO(entry.clockOut)
      : new Date(`${entry.date}T${entry.clockOut}`);
    const total = differenceInMinutes(outDate, inDate);
    return Math.max(0, total - (entry.breakMinutes || 0));
  } catch {
    return 0;
  }
}

// Short Swedish weekday + date: "Mån 3 mar"
function formatSwedishDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'EEE d MMM', { locale: sv });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function TimesheetPage() {
  const clinicId = getClinicId();

  // Current selected month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Staff
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');

  // Clock-in/out
  const [clockStaffId, setClockStaffId] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<string>('0');
  const [activeEntries, setActiveEntries] = useState<ActiveEntry[]>([]);
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({});

  // Timesheet entries
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isClockinIn, setIsClockingIn] = useState(false);
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const monthStr = format(currentMonth, 'yyyy-MM');

  // ---------------------------------------------------------------------------
  // Fetch staff list
  // ---------------------------------------------------------------------------
  const fetchStaff = useCallback(async () => {
    if (!clinicId) return;
    setIsLoadingStaff(true);
    try {
      const res = await fetch(`/api/staff?clinicId=${clinicId}`);
      if (!res.ok) throw new Error('Kunde inte hämta personal');
      const data = await res.json();
      const list: StaffMember[] = Array.isArray(data)
        ? data
        : Array.isArray(data.staff)
        ? data.staff
        : [];
      setStaffList(list);
      if (!clockStaffId && list.length > 0) {
        setClockStaffId(list[0].id);
      }
    } catch (e: any) {
      toast.error(e.message || 'Fel vid hämtning av personal');
    } finally {
      setIsLoadingStaff(false);
    }
  }, [clinicId, clockStaffId]);

  // ---------------------------------------------------------------------------
  // Fetch timesheet entries
  // ---------------------------------------------------------------------------
  const fetchEntries = useCallback(async () => {
    if (!clinicId) return;
    setIsLoadingEntries(true);
    try {
      let url = `/api/staff/timesheet?clinicId=${clinicId}&month=${monthStr}`;
      if (selectedStaffId && selectedStaffId !== 'all') {
        url += `&staffId=${selectedStaffId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Kunde inte hämta tidrapporter');
      const data = await res.json();
      const list: TimeEntry[] = Array.isArray(data)
        ? data
        : Array.isArray(data.entries)
        ? data.entries
        : [];

      // Separate active (clocked-in, no clockOut) entries from completed
      const active: ActiveEntry[] = [];
      const completed: TimeEntry[] = [];
      list.forEach((e) => {
        if (e.clockIn && !e.clockOut) {
          active.push({
            staffId: e.staffId,
            staffName: e.staffName,
            clockInTime: e.clockIn.includes('T')
              ? e.clockIn
              : `${e.date}T${e.clockIn}`,
          });
        }
        completed.push(e);
      });
      setActiveEntries(active);
      setEntries(list);
    } catch (e: any) {
      toast.error(e.message || 'Fel vid hämtning av tidrapporter');
    } finally {
      setIsLoadingEntries(false);
    }
  }, [clinicId, monthStr, selectedStaffId]);

  // ---------------------------------------------------------------------------
  // Tick timer for elapsed times
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const map: Record<string, number> = {};
      activeEntries.forEach((ae) => {
        try {
          const start = parseISO(ae.clockInTime).getTime();
          map[ae.staffId] = Math.floor((now - start) / 60000);
        } catch {
          map[ae.staffId] = 0;
        }
      });
      setElapsedMap(map);
    };
    tick();
    tickRef.current = setInterval(tick, 30000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [activeEntries]);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ---------------------------------------------------------------------------
  // Clock In
  // ---------------------------------------------------------------------------
  const handleClockIn = async () => {
    if (!clockStaffId) {
      toast.error('Välj en anställd först');
      return;
    }
    setIsClockingIn(true);
    try {
      const res = await fetch('/api/staff/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: clockStaffId, clinicId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Instämpling misslyckades');
      }
      const staffName =
        staffList.find((s) => s.id === clockStaffId)?.name || clockStaffId;
      toast.success(`${staffName} stämplades in`);
      await fetchEntries();
    } catch (e: any) {
      toast.error(e.message || 'Instämpling misslyckades');
    } finally {
      setIsClockingIn(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Clock Out
  // ---------------------------------------------------------------------------
  const handleClockOut = async () => {
    if (!clockStaffId) {
      toast.error('Välj en anställd först');
      return;
    }
    setIsClockingOut(true);
    try {
      const body: Record<string, unknown> = { staffId: clockStaffId, clinicId };
      const bm = parseInt(breakMinutes, 10);
      if (!isNaN(bm) && bm > 0) body.breakMinutes = bm;

      const res = await fetch('/api/staff/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Utstämpling misslyckades');
      }
      const staffName =
        staffList.find((s) => s.id === clockStaffId)?.name || clockStaffId;
      toast.success(`${staffName} stämplades ut`);
      setBreakMinutes('0');
      await fetchEntries();
    } catch (e: any) {
      toast.error(e.message || 'Utstämpling misslyckades');
    } finally {
      setIsClockingOut(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Export payroll
  // ---------------------------------------------------------------------------
  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const res = await fetch(
        `/api/staff/export-payroll?clinicId=${clinicId}&month=${monthStr}`
      );
      if (!res.ok) throw new Error('Export misslyckades');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = res.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
          `lonerapport-${monthStr}.csv`
        : `lonerapport-${monthStr}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Löneunderlag exporterat');
    } catch (e: any) {
      toast.error(e.message || 'Export misslyckades');
    } finally {
      setIsExporting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived statistics
  // ---------------------------------------------------------------------------
  const completedEntries = entries.filter((e) => e.clockIn && e.clockOut);

  const totalMinutes = completedEntries.reduce(
    (sum, e) => sum + workedMinutes(e),
    0
  );

  // Unique days with at least one completed entry
  const uniqueDays = new Set(completedEntries.map((e) => e.date)).size;
  const avgMinutesPerDay = uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0;

  // Overtime: minutes beyond 8h per day per staff
  const overtimeByDayStaff: Record<string, number> = {};
  completedEntries.forEach((e) => {
    const key = `${e.date}-${e.staffId}`;
    overtimeByDayStaff[key] = (overtimeByDayStaff[key] || 0) + workedMinutes(e);
  });
  const overtimeMinutes = Object.values(overtimeByDayStaff).reduce((sum, m) => {
    return sum + Math.max(0, m - 480); // 8h = 480 min
  }, 0);

  const activeStaffCount = new Set(activeEntries.map((a) => a.staffId)).size;
  const totalStaff = staffList.length;

  // ---------------------------------------------------------------------------
  // Group entries by week for weekly summary rows
  // ---------------------------------------------------------------------------
  interface WeekGroup {
    weekNumber: number;
    entries: TimeEntry[];
  }

  const groupedByWeek: WeekGroup[] = [];
  const weekMap: Record<number, TimeEntry[]> = {};
  entries.forEach((e) => {
    try {
      const d = parseISO(e.date);
      const wn = getWeek(d, { locale: sv });
      if (!weekMap[wn]) weekMap[wn] = [];
      weekMap[wn].push(e);
    } catch {}
  });
  Object.keys(weekMap)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((wn) => {
      groupedByWeek.push({ weekNumber: wn, entries: weekMap[wn] });
    });

  // Is the selected staff currently clocked in?
  const isCurrentlyClocked = (staffId: string) =>
    activeEntries.some((a) => a.staffId === staffId);

  const selectedStaffClockedIn = isCurrentlyClocked(clockStaffId);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        {/* ------------------------------------------------------------------ */}
        {/* HEADER                                                               */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Tidrapporter &amp; Stämpelklocka
            </h1>
            <p className="text-muted-foreground mt-1">
              Hantera arbetstider och löneunderlag för kliniken
            </p>
          </div>

          {/* Month/Year Picker */}
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-md"
              onClick={() => setCurrentMonth((d) => subMonths(d, 1))}
              aria-label="Föregående månad"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="min-w-[120px] text-center font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: sv })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-md"
              onClick={() => setCurrentMonth((d) => addMonths(d, 1))}
              aria-label="Nästa månad"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* QUICK CLOCK IN / OUT                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Stämpelklocka
            </CardTitle>
            <CardDescription>
              Välj personal och stämpla in eller ut
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              {/* Staff selector for clock in/out */}
              <div className="w-full lg:w-64 space-y-1">
                <Label htmlFor="clock-staff-select" className="text-sm font-medium">
                  Personal
                </Label>
                <Select
                  value={clockStaffId}
                  onValueChange={setClockStaffId}
                  disabled={isLoadingStaff}
                >
                  <SelectTrigger
                    id="clock-staff-select"
                    className="h-12 text-base"
                  >
                    <SelectValue placeholder="Välj personal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="h-11">
                        <div className="flex items-center gap-2">
                          {isCurrentlyClocked(s.id) ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500 flex-shrink-0" />
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full bg-gray-300 flex-shrink-0" />
                          )}
                          <span>{s.name}</span>
                          {s.role && (
                            <span className="text-xs text-muted-foreground">
                              {s.role}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Break minutes (only relevant for clock-out) */}
              <div className="w-full lg:w-40 space-y-1">
                <Label htmlFor="break-input" className="text-sm font-medium">
                  Rast (min)
                </Label>
                <Input
                  id="break-input"
                  type="number"
                  min="0"
                  max="240"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(e.target.value)}
                  className="h-12 text-base"
                  placeholder="0"
                />
              </div>

              {/* Big Clock-In button */}
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold w-full lg:w-auto min-w-[160px] bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={handleClockIn}
                disabled={isClockinIn || !clockStaffId || selectedStaffClockedIn}
              >
                {isClockinIn ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
                Stämpla In
              </Button>

              {/* Big Clock-Out button */}
              <Button
                size="lg"
                variant="destructive"
                className="h-14 px-8 text-base font-semibold w-full lg:w-auto min-w-[160px] gap-2"
                onClick={handleClockOut}
                disabled={isClockingOut || !clockStaffId || !selectedStaffClockedIn}
              >
                {isClockingOut ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Square className="h-5 w-5 fill-current" />
                )}
                Stämpla Ut
              </Button>

              {/* Refresh */}
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 flex-shrink-0"
                onClick={fetchEntries}
                disabled={isLoadingEntries}
                aria-label="Uppdatera"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isLoadingEntries ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>

            {/* Currently clocked-in staff list */}
            {activeEntries.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Incheckade just nu
                </p>
                <div className="flex flex-wrap gap-3">
                  {activeEntries.map((ae) => (
                    <div
                      key={ae.staffId}
                      className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-full px-4 py-2"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                      <span className="text-sm font-medium">{ae.staffName}</span>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      >
                        <Timer className="h-3 w-3 mr-1" />
                        {formatDuration(elapsedMap[ae.staffId] || 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeEntries.length === 0 && !isLoadingEntries && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Circle className="h-3 w-3 text-gray-400" />
                  Ingen personal är incheckad just nu
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* SUMMARY CARDS                                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" />
                Totalt denna månad
              </CardDescription>
              <CardTitle className="text-2xl">
                {formatDuration(totalMinutes)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {completedEntries.length} registrerade pass
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                Genomsnitt per dag
              </CardDescription>
              <CardTitle className="text-2xl">
                {formatDuration(avgMinutesPerDay)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {uniqueDays} arbetsdagar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                Övertidstimmar
              </CardDescription>
              <CardTitle
                className={`text-2xl ${
                  overtimeMinutes > 0
                    ? 'text-orange-600 dark:text-orange-400'
                    : ''
                }`}
              >
                {formatDuration(overtimeMinutes)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Över 8h/dag
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5" />
                Aktiva nu
              </CardDescription>
              <CardTitle
                className={`text-2xl ${
                  activeStaffCount > 0
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                }`}
              >
                {activeStaffCount}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {totalStaff}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {activeStaffCount > 0 ? 'Incheckade' : 'Ingen incheckad'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* FILTERS + EXPORT                                                     */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="w-full sm:w-64 space-y-1">
            <Label htmlFor="staff-filter" className="text-sm font-medium">
              Filtrera personal
            </Label>
            <Select
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
            >
              <SelectTrigger id="staff-filter" className="h-11">
                <SelectValue placeholder="Alla anställda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="h-10">
                  Alla anställda
                </SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="h-10">
                    <div className="flex items-center gap-2">
                      {isCurrentlyClocked(s.id) ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-gray-300" />
                      )}
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting || !clinicId}
            className="h-11 px-6 gap-2 w-full sm:w-auto"
            variant="outline"
          >
            {isExporting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportera löneunderlag
          </Button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TIMESHEET TABLE                                                      */}
        {/* ------------------------------------------------------------------ */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Tidrapport —{' '}
              <span className="capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: sv })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingEntries ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Laddar tidrapporter…
                  </p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Inga tidrapporter</p>
                  <p className="text-sm mt-1">
                    Inga stämplingar för{' '}
                    {format(currentMonth, 'MMMM yyyy', { locale: sv })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="min-w-[130px] font-semibold">
                        Datum
                      </TableHead>
                      <TableHead className="min-w-[140px] font-semibold">
                        Personal
                      </TableHead>
                      <TableHead className="min-w-[100px] font-semibold">
                        In-stämpling
                      </TableHead>
                      <TableHead className="min-w-[100px] font-semibold">
                        Ut-stämpling
                      </TableHead>
                      <TableHead className="min-w-[90px] font-semibold text-center">
                        Rast (min)
                      </TableHead>
                      <TableHead className="min-w-[110px] font-semibold">
                        Arbetad tid
                      </TableHead>
                      <TableHead className="min-w-[160px] font-semibold">
                        Noteringar
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedByWeek.map(({ weekNumber, entries: weekEntries }) => {
                      const weekTotal = weekEntries
                        .filter((e) => e.clockIn && e.clockOut)
                        .reduce((sum, e) => sum + workedMinutes(e), 0);

                      return (
                        <>
                          {weekEntries
                            .slice()
                            .sort((a, b) =>
                              a.date < b.date ? -1 : a.date > b.date ? 1 : 0
                            )
                            .map((entry) => {
                              const wm = workedMinutes(entry);
                              const isActive = !entry.clockOut && !!entry.clockIn;
                              const elapsed =
                                isActive ? elapsedMap[entry.staffId] || 0 : null;

                              return (
                                <TableRow
                                  key={entry.id}
                                  className={
                                    isActive
                                      ? 'bg-green-50/50 dark:bg-green-950/20'
                                      : ''
                                  }
                                >
                                  {/* Datum */}
                                  <TableCell className="font-medium capitalize py-3">
                                    {formatSwedishDate(entry.date)}
                                  </TableCell>

                                  {/* Personal */}
                                  <TableCell className="py-3">
                                    <div className="flex items-center gap-2">
                                      {isCurrentlyClocked(entry.staffId) ? (
                                        <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
                                      ) : (
                                        <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                      )}
                                      <span className="truncate max-w-[120px]">
                                        {entry.staffName}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* In-stämpling */}
                                  <TableCell className="py-3 font-mono text-sm">
                                    {toHHMM(entry.clockIn)}
                                  </TableCell>

                                  {/* Ut-stämpling */}
                                  <TableCell className="py-3 font-mono text-sm">
                                    {isActive ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs"
                                      >
                                        Incheckat
                                      </Badge>
                                    ) : (
                                      toHHMM(entry.clockOut)
                                    )}
                                  </TableCell>

                                  {/* Rast */}
                                  <TableCell className="py-3 text-center text-sm">
                                    {entry.breakMinutes || 0}
                                  </TableCell>

                                  {/* Arbetad tid */}
                                  <TableCell className="py-3 font-medium text-sm">
                                    {isActive && elapsed !== null ? (
                                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Timer className="h-3.5 w-3.5" />
                                        {formatDuration(elapsed)}
                                      </span>
                                    ) : wm > 0 ? (
                                      <span
                                        className={
                                          wm > 480
                                            ? 'text-orange-600 dark:text-orange-400 font-semibold'
                                            : ''
                                        }
                                      >
                                        {formatDuration(wm)}
                                        {wm > 480 && (
                                          <span className="text-xs ml-1 font-normal">
                                            (ÖT)
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </TableCell>

                                  {/* Noteringar */}
                                  <TableCell className="py-3 text-sm text-muted-foreground">
                                    {entry.notes || '—'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}

                          {/* Weekly summary row */}
                          <TableRow className="bg-muted/40 border-t-2 border-muted-foreground/20">
                            <TableCell
                              colSpan={5}
                              className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-4"
                            >
                              Vecka {weekNumber} — summering
                            </TableCell>
                            <TableCell className="py-2 font-bold text-sm">
                              {formatDuration(weekTotal)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------ */}
        {/* STATUS OVERVIEW (all staff)                                          */}
        {/* ------------------------------------------------------------------ */}
        {staffList.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Personalstatus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {staffList.map((s) => {
                  const clocked = isCurrentlyClocked(s.id);
                  const ae = activeEntries.find((a) => a.staffId === s.id);
                  const elapsed = ae ? elapsedMap[s.id] || 0 : null;
                  return (
                    <div
                      key={s.id}
                      className={`flex flex-col gap-1 rounded-lg border p-3 min-h-[60px] cursor-pointer transition-colors ${
                        clocked
                          ? 'border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800'
                          : 'border-border bg-card'
                      }`}
                      onClick={() => setClockStaffId(s.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && setClockStaffId(s.id)
                      }
                    >
                      <div className="flex items-center gap-2">
                        {clocked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">
                          {s.name}
                        </span>
                      </div>
                      {clocked && elapsed !== null ? (
                        <span className="text-xs text-green-600 dark:text-green-400 pl-6">
                          {formatDuration(elapsed)} incheckad
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground pl-6">
                          Utcheckad
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
