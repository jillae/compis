'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  getISOWeek,
  getYear,
  isSameDay,
  parseISO,
} from 'date-fns'
import { sv } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Clock,
  CalendarDays,
  AlertTriangle,
  BarChart3,
  Sparkles,
  X,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShiftType = 'REGULAR' | 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'ON_CALL' | 'EXTRA'
type ScheduleStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

interface StaffMember {
  id: string
  name: string
  role: string
  weeklyHoursTarget?: number
  color?: string
}

interface Schedule {
  id: string
  staffId: string
  staffName?: string
  clinicId: string
  shiftDate: string // ISO date string YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string   // HH:mm
  breakMinutes: number
  shiftType: ShiftType
  status: ScheduleStatus
  notes?: string
}

interface ShiftFormData {
  staffId: string
  shiftDate: string
  startTime: string
  endTime: string
  breakMinutes: string
  shiftType: ShiftType
  notes: string
}

interface AIRecommendation {
  staffId: string
  date: string
  suggestedStartTime: string
  suggestedEndTime: string
  shiftType: ShiftType
  reason: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIFT_LABELS: Record<ShiftType, string> = {
  REGULAR: 'Ordinarie',
  MORNING: 'Morgon',
  AFTERNOON: 'Eftermiddag',
  EVENING: 'Kväll',
  NIGHT: 'Natt',
  ON_CALL: 'Jour',
  EXTRA: 'Extra',
}

const STATUS_LABELS: Record<ScheduleStatus, string> = {
  SCHEDULED: 'Planerat',
  CONFIRMED: 'Bekräftat',
  COMPLETED: 'Genomfört',
  CANCELLED: 'Inställt',
  NO_SHOW: 'Utebliven',
}

const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string; border: string; badge: string }> = {
  REGULAR:   { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   badge: 'bg-blue-500' },
  MORNING:   { bg: 'bg-amber-100',  text: 'text-amber-800',  border: 'border-amber-300',  badge: 'bg-amber-500' },
  AFTERNOON: { bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300',  badge: 'bg-green-500' },
  EVENING:   { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', badge: 'bg-purple-500' },
  NIGHT:     { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', badge: 'bg-indigo-500' },
  ON_CALL:   { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', badge: 'bg-orange-500' },
  EXTRA:     { bg: 'bg-pink-100',   text: 'text-pink-800',   border: 'border-pink-300',   badge: 'bg-pink-500' },
}

const STATUS_COLORS: Record<ScheduleStatus, string> = {
  SCHEDULED: 'border-l-4 border-l-blue-400',
  CONFIRMED: 'border-l-4 border-l-green-500',
  COMPLETED: 'border-l-4 border-l-gray-400 opacity-70',
  CANCELLED: 'border-l-4 border-l-red-400 opacity-50 line-through',
  NO_SHOW:   'border-l-4 border-l-yellow-500 opacity-60',
}

const WEEKDAYS_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

const DEFAULT_FORM: ShiftFormData = {
  staffId: '',
  shiftDate: '',
  startTime: '08:00',
  endTime: '16:00',
  breakMinutes: '30',
  shiftType: 'REGULAR',
  notes: '',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getClinicId = () =>
  typeof window !== 'undefined' ? localStorage.getItem('clinicId') || '' : ''

function calcShiftHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const totalMins = (eh * 60 + em) - (sh * 60 + sm) - breakMinutes
  return Math.max(0, totalMins / 60)
}

function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ShiftBlock({
  schedule,
  onClick,
}: {
  schedule: Schedule
  onClick: (s: Schedule) => void
}) {
  const colors = SHIFT_COLORS[schedule.shiftType]
  const statusBorder = STATUS_COLORS[schedule.status]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(schedule) }}
      className={`
        w-full text-left rounded-md px-2 py-1 mb-1 cursor-pointer
        ${colors.bg} ${colors.text} ${statusBorder}
        hover:brightness-95 active:scale-95 transition-all
        min-h-[44px] flex flex-col justify-center
      `}
      title={`${schedule.startTime}–${schedule.endTime} · ${SHIFT_LABELS[schedule.shiftType]}`}
    >
      <span className="font-semibold text-xs leading-tight">
        {schedule.startTime}–{schedule.endTime}
      </span>
      <span className={`text-[10px] font-medium mt-0.5 inline-block rounded px-1 ${colors.badge} text-white`}>
        {SHIFT_LABELS[schedule.shiftType]}
      </span>
      {schedule.status !== 'SCHEDULED' && (
        <span className="text-[10px] opacity-75 mt-0.5">{STATUS_LABELS[schedule.status]}</span>
      )}
    </button>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  colorClass?: string
}) {
  return (
    <Card className="flex-1 min-w-[130px]">
      <CardContent className="pt-4 pb-3 px-4">
        <div className={`flex items-center gap-2 mb-1 ${colorClass ?? 'text-gray-500'}`}>
          {icon}
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StaffSchedulePage() {
  const router = useRouter()
  const { data: session, status } = useSession() || {}

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [form, setForm] = useState<ShiftFormData>(DEFAULT_FORM)

  // AI recommendations
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)

  const today = new Date()
  const weekDates = getWeekDates(currentWeekStart)
  const weekNumber = getISOWeek(currentWeekStart)
  const weekYear = getYear(currentWeekStart)

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  // Load staff once
  useEffect(() => {
    if (status !== 'authenticated') return
    fetchStaff()
  }, [status])

  // Load schedules when week changes
  useEffect(() => {
    if (status !== 'authenticated') return
    fetchSchedules()
  }, [status, currentWeekStart])

  // ---------------------------------------------------------------------------
  // API calls
  // ---------------------------------------------------------------------------

  const fetchStaff = async () => {
    setLoadingStaff(true)
    try {
      const res = await fetch('/api/staff')
      if (!res.ok) throw new Error('Kunde inte hämta personal')
      const data = await res.json()
      setStaff(data.staff ?? data.data ?? data ?? [])
    } catch (err) {
      console.error(err)
      toast.error('Kunde inte ladda personallistan')
    } finally {
      setLoadingStaff(false)
    }
  }

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const clinicId = getClinicId()
      const startDate = format(currentWeekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')
      const params = new URLSearchParams({ startDate, endDate })
      if (clinicId) params.set('clinicId', clinicId)
      const res = await fetch(`/api/staff/schedule?${params}`)
      if (!res.ok) throw new Error('Kunde inte hämta schema')
      const data = await res.json()
      setSchedules(data.schedules ?? data.data ?? data ?? [])
    } catch (err) {
      console.error(err)
      toast.error('Kunde inte ladda schemat')
    } finally {
      setLoading(false)
    }
  }, [currentWeekStart])

  const fetchRecommendations = async () => {
    setLoadingRecs(true)
    try {
      const clinicId = getClinicId()
      const date = format(currentWeekStart, 'yyyy-MM-dd')
      const params = new URLSearchParams({ date })
      if (clinicId) params.set('clinicId', clinicId)
      const res = await fetch(`/api/staff/schedule/recommendations?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRecommendations(data.recommendations ?? [])
      setShowRecommendations(true)
    } catch {
      toast.error('Kunde inte hämta AI-förslag')
    } finally {
      setLoadingRecs(false)
    }
  }

  const handleSave = async () => {
    if (!form.staffId) { toast.error('Välj en medarbetare'); return }
    if (!form.shiftDate) { toast.error('Välj ett datum'); return }
    if (!form.startTime || !form.endTime) { toast.error('Ange start- och sluttid'); return }

    setSaving(true)
    try {
      const clinicId = getClinicId()
      const body = {
        clinicId,
        staffId: form.staffId,
        shiftDate: form.shiftDate,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: parseInt(form.breakMinutes) || 0,
        shiftType: form.shiftType,
        notes: form.notes,
      }

      let res: Response
      if (editingSchedule) {
        res = await fetch(`/api/staff/schedule/${editingSchedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/staff/schedule/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) throw new Error()
      toast.success(editingSchedule ? 'Passet uppdaterat' : 'Passet skapat')
      setDialogOpen(false)
      setEditingSchedule(null)
      setForm(DEFAULT_FORM)
      fetchSchedules()
    } catch {
      toast.error('Kunde inte spara passet')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Ta bort detta pass?')) return
    try {
      const res = await fetch(`/api/staff/schedule/${scheduleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Passet borttaget')
      setDialogOpen(false)
      setEditingSchedule(null)
      fetchSchedules()
    } catch {
      toast.error('Kunde inte ta bort passet')
    }
  }

  // ---------------------------------------------------------------------------
  // UI handlers
  // ---------------------------------------------------------------------------

  const openCreateDialog = (staffId: string, date: Date) => {
    setEditingSchedule(null)
    setForm({
      ...DEFAULT_FORM,
      staffId,
      shiftDate: format(date, 'yyyy-MM-dd'),
    })
    setDialogOpen(true)
  }

  const openEditDialog = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setForm({
      staffId: schedule.staffId,
      shiftDate: schedule.shiftDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      breakMinutes: String(schedule.breakMinutes),
      shiftType: schedule.shiftType,
      notes: schedule.notes ?? '',
    })
    setDialogOpen(true)
  }

  const applyRecommendation = (rec: AIRecommendation) => {
    setEditingSchedule(null)
    setForm({
      staffId: rec.staffId,
      shiftDate: rec.date,
      startTime: rec.suggestedStartTime,
      endTime: rec.suggestedEndTime,
      breakMinutes: '30',
      shiftType: rec.shiftType,
      notes: rec.reason,
    })
    setShowRecommendations(false)
    setDialogOpen(true)
  }

  // ---------------------------------------------------------------------------
  // Computed stats
  // ---------------------------------------------------------------------------

  const activeSchedules = schedules.filter(
    (s) => s.status !== 'CANCELLED' && s.status !== 'NO_SHOW'
  )

  const totalHours = activeSchedules.reduce((acc, s) => {
    return acc + calcShiftHours(s.startTime, s.endTime, s.breakMinutes)
  }, 0)

  const totalShifts = activeSchedules.length

  // Gap = (staff × days) slots that have zero shifts
  const filledCells = new Set(
    activeSchedules.map((s) => `${s.staffId}_${s.shiftDate}`)
  )
  const totalCells = staff.length * 7
  const gapCount = totalCells > 0 ? totalCells - filledCells.size : 0
  const coverage = totalCells > 0
    ? Math.round((filledCells.size / totalCells) * 100)
    : 0

  // Weekly hours per staff
  const hoursPerStaff: Record<string, number> = {}
  activeSchedules.forEach((s) => {
    hoursPerStaff[s.staffId] = (hoursPerStaff[s.staffId] ?? 0) +
      calcShiftHours(s.startTime, s.endTime, s.breakMinutes)
  })

  // Schedules indexed by staffId → date
  const scheduleMap: Record<string, Record<string, Schedule[]>> = {}
  schedules.forEach((s) => {
    if (!scheduleMap[s.staffId]) scheduleMap[s.staffId] = {}
    if (!scheduleMap[s.staffId][s.shiftDate]) scheduleMap[s.staffId][s.shiftDate] = []
    scheduleMap[s.staffId][s.shiftDate].push(s)
  })

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (status === 'loading' || loadingStaff) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veckoschema</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hantera personalens arbetspass för vecka {weekNumber}
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
            className="min-h-[44px] min-w-[44px]"
            title="Förra veckan"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 px-3 py-2 rounded-md border bg-white shadow-sm min-w-[120px] justify-center">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-sm text-gray-800">
              V.{weekNumber} {weekYear}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
            className="min-h-[44px] min-w-[44px]"
            title="Nästa vecka"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="min-h-[44px] hidden sm:flex"
          >
            Denna vecka
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            disabled={loadingRecs}
            className="min-h-[44px] gap-1.5"
          >
            {loadingRecs ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-500" />
            )}
            AI-förslag
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingSchedule(null)
              setForm({ ...DEFAULT_FORM, shiftDate: format(today, 'yyyy-MM-dd') })
              setDialogOpen(true)
            }}
            className="min-h-[44px] gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Nytt pass
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary bar */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap gap-3">
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="Bemannade timmar"
          value={`${totalHours.toFixed(1)} h`}
          colorClass="text-blue-600"
        />
        <SummaryCard
          icon={<CalendarDays className="h-4 w-4" />}
          label="Antal pass"
          value={totalShifts}
          colorClass="text-green-600"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Lediga luckor"
          value={gapCount}
          sub="dagar utan pass"
          colorClass={gapCount > 0 ? 'text-amber-600' : 'text-green-600'}
        />
        <SummaryCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Beläggningsgrad"
          value={`${coverage}%`}
          sub={`${filledCells.size} av ${totalCells} celler`}
          colorClass={coverage >= 80 ? 'text-green-600' : coverage >= 50 ? 'text-amber-600' : 'text-red-600'}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* AI Recommendations panel */}
      {/* ------------------------------------------------------------------ */}
      {showRecommendations && recommendations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-sm font-semibold text-amber-800">
                  AI-rekommendationer för vecka {weekNumber}
                </CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowRecommendations(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {recommendations.map((rec, i) => {
                const staffMember = staff.find((s) => s.id === rec.staffId)
                return (
                  <button
                    key={i}
                    onClick={() => applyRecommendation(rec)}
                    className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-left hover:bg-amber-100 transition-colors min-h-[44px]"
                  >
                    <div className="font-medium text-xs text-gray-800">
                      {staffMember?.name ?? rec.staffId}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(parseISO(rec.date), 'EEE d/M', { locale: sv })} · {rec.suggestedStartTime}–{rec.suggestedEndTime}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">{rec.reason}</div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Week grid */}
      {/* ------------------------------------------------------------------ */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {/* Staff header cell */}
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-[160px] min-w-[140px] sticky left-0 bg-gray-100 z-10">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Personal
                      </div>
                    </th>
                    {weekDates.map((date, idx) => {
                      const isToday = isSameDay(date, today)
                      const isWeekend = idx >= 5
                      return (
                        <th
                          key={idx}
                          className={`text-center px-2 py-2 text-xs font-semibold uppercase tracking-wide min-w-[110px] ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : isWeekend
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }`}
                        >
                          <div className="leading-tight">
                            <div>{WEEKDAYS_SHORT[idx]}</div>
                            <div className={`text-base font-bold ${isToday ? 'text-white' : isWeekend ? 'text-gray-400' : 'text-gray-800'}`}>
                              {format(date, 'd')}
                            </div>
                            <div className={`text-[10px] font-normal ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>
                              {format(date, 'MMM', { locale: sv })}
                            </div>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-400 py-12 text-sm">
                        Ingen personal hittades. Lägg till personal för att schemalägga pass.
                      </td>
                    </tr>
                  ) : (
                    staff.map((member, rowIdx) => (
                      <tr
                        key={member.id}
                        className={`border-b border-gray-100 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        {/* Staff name cell */}
                        <td className="px-3 py-2 sticky left-0 z-10 bg-inherit border-r border-gray-200">
                          <div className="font-medium text-sm text-gray-800 truncate max-w-[130px]">
                            {member.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{member.role}</div>
                          <div className="text-xs text-gray-400">
                            {(hoursPerStaff[member.id] ?? 0).toFixed(1)} h
                            {member.weeklyHoursTarget ? ` / ${member.weeklyHoursTarget} h` : ''}
                          </div>
                        </td>

                        {/* Day cells */}
                        {weekDates.map((date, colIdx) => {
                          const dateStr = format(date, 'yyyy-MM-dd')
                          const daySchedules = scheduleMap[member.id]?.[dateStr] ?? []
                          const isToday = isSameDay(date, today)
                          const isWeekend = colIdx >= 5
                          return (
                            <td
                              key={colIdx}
                              className={`px-1.5 py-1.5 align-top min-w-[110px] cursor-pointer transition-colors
                                ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : ''}
                                hover:bg-blue-50/60
                              `}
                              onClick={() => openCreateDialog(member.id, date)}
                              title={`Lägg till pass: ${member.name} – ${format(date, 'EEEE d MMMM', { locale: sv })}`}
                            >
                              {daySchedules.length === 0 ? (
                                <div className="flex items-center justify-center h-11 rounded-md border-2 border-dashed border-gray-200 text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors">
                                  <Plus className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {daySchedules.map((s) => (
                                    <ShiftBlock key={s.id} schedule={s} onClick={openEditDialog} />
                                  ))}
                                  {/* Always show add button at bottom of cell */}
                                  <div
                                    className="flex items-center justify-center h-7 rounded border border-dashed border-gray-200 text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); openCreateDialog(member.id, date) }}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </div>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Shift type legend */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium mr-1">Passtyper:</span>
        {(Object.keys(SHIFT_LABELS) as ShiftType[]).map((type) => {
          const c = SHIFT_COLORS[type]
          return (
            <span
              key={type}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.badge}`} />
              {SHIFT_LABELS[type]}
            </span>
          )
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Staff legend */}
      {/* ------------------------------------------------------------------ */}
      {staff.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personaloversikt – Vecka {weekNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {staff.map((member) => {
                const worked = hoursPerStaff[member.id] ?? 0
                const target = member.weeklyHoursTarget ?? 40
                const pct = Math.min(100, Math.round((worked / target) * 100))
                const barColor =
                  pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-400'
                return (
                  <div key={member.id} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <div className="font-medium text-sm text-gray-800 truncate">{member.name}</div>
                    <div className="text-xs text-gray-400 truncate mb-1">{member.role}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {worked.toFixed(1)} / {target} h ({pct}%)
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Create / Edit dialog */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) { setDialogOpen(false); setEditingSchedule(null); setForm(DEFAULT_FORM) }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Redigera pass' : 'Skapa nytt pass'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule
                ? 'Ändra uppgifterna för detta arbetspass.'
                : 'Fyll i uppgifterna för att lägga till ett nytt arbetspass.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Staff picker */}
            <div className="space-y-1.5">
              <Label htmlFor="staffId">Medarbetare</Label>
              <Select
                value={form.staffId}
                onValueChange={(v) => setForm((f) => ({ ...f, staffId: v }))}
              >
                <SelectTrigger id="staffId" className="min-h-[44px]">
                  <SelectValue placeholder="Välj medarbetare…" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} – {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="shiftDate">Datum</Label>
              <Input
                id="shiftDate"
                type="date"
                className="min-h-[44px]"
                value={form.shiftDate}
                onChange={(e) => setForm((f) => ({ ...f, shiftDate: e.target.value }))}
              />
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Starttid</Label>
                <Input
                  id="startTime"
                  type="time"
                  className="min-h-[44px]"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">Sluttid</Label>
                <Input
                  id="endTime"
                  type="time"
                  className="min-h-[44px]"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Break */}
            <div className="space-y-1.5">
              <Label htmlFor="breakMinutes">Rast (minuter)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="0"
                step="5"
                className="min-h-[44px]"
                value={form.breakMinutes}
                onChange={(e) => setForm((f) => ({ ...f, breakMinutes: e.target.value }))}
              />
            </div>

            {/* Shift type */}
            <div className="space-y-1.5">
              <Label htmlFor="shiftType">Passtyp</Label>
              <Select
                value={form.shiftType}
                onValueChange={(v) => setForm((f) => ({ ...f, shiftType: v as ShiftType }))}
              >
                <SelectTrigger id="shiftType" className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SHIFT_LABELS) as [ShiftType, string][]).map(([value, label]) => {
                    const c = SHIFT_COLORS[value]
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${c.badge}`} />
                          {label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Duration preview */}
            {form.startTime && form.endTime && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2">
                Arbetstid:{' '}
                <span className="font-semibold text-gray-700">
                  {calcShiftHours(form.startTime, form.endTime, parseInt(form.breakMinutes) || 0).toFixed(1)} timmar
                </span>{' '}
                (exkl. {form.breakMinutes || 0} min rast)
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Anteckningar (valfritt)</Label>
              <Input
                id="notes"
                className="min-h-[44px]"
                placeholder="T.ex. täcker för sjukfrånvaro…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {editingSchedule && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(editingSchedule.id)}
                  className="min-h-[44px] gap-1.5 mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Ta bort
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => { setDialogOpen(false); setEditingSchedule(null); setForm(DEFAULT_FORM) }}
                className="min-h-[44px] flex-1"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-h-[44px] flex-1 gap-1.5"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingSchedule ? 'Spara ändringar' : 'Skapa pass'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
