'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  format,
  parseISO,
  differenceInCalendarDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns'
import { sv } from 'date-fns/locale'
import {
  Plus,
  CalendarDays,
  TableIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  ThumbsUp,
  Stethoscope,
  Sun,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveType = 'VACATION' | 'SICK_LEAVE' | 'PERSONAL' | 'UNPAID' | 'PARENTAL' | 'OTHER'
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

interface StaffMember {
  id: string
  name: string
  role?: string
}

interface LeaveRequest {
  id: string
  staffId: string
  staffName?: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason?: string
  status: LeaveStatus
  createdAt?: string
  rejectionReason?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getClinicId = () => {
  // TODO: Get from session/context
  return typeof window !== 'undefined' ? localStorage.getItem('clinicId') || '' : ''
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  VACATION: 'Semester',
  SICK_LEAVE: 'Sjukfrånvaro',
  PERSONAL: 'Personlig ledighet',
  UNPAID: 'Obetald ledighet',
  PARENTAL: 'Föräldraledighet',
  OTHER: 'Annat',
}

const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Väntande',
  APPROVED: 'Godkänd',
  REJECTED: 'Avvisad',
  CANCELLED: 'Avbruten',
}

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  VACATION: '#3b82f6',    // blue
  SICK_LEAVE: '#ef4444',  // red
  PERSONAL: '#a855f7',    // purple
  UNPAID: '#f97316',      // orange
  PARENTAL: '#ec4899',    // pink
  OTHER: '#6b7280',       // gray
}

const LEAVE_TYPE_CALENDAR_CLASS: Record<LeaveType, string> = {
  VACATION: 'bg-blue-100 text-blue-800 border-blue-200',
  SICK_LEAVE: 'bg-red-100 text-red-800 border-red-200',
  PERSONAL: 'bg-purple-100 text-purple-800 border-purple-200',
  UNPAID: 'bg-orange-100 text-orange-800 border-orange-200',
  PARENTAL: 'bg-pink-100 text-pink-800 border-pink-200',
  OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
}

function getStatusBadgeVariant(status: LeaveStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'APPROVED': return 'default'
    case 'PENDING': return 'secondary'
    case 'REJECTED': return 'destructive'
    case 'CANCELLED': return 'outline'
  }
}

function getStatusBadgeClass(status: LeaveStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
  }
}

function countDays(startDate: string, endDate: string): number {
  try {
    return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
  } catch {
    return 0
  }
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterStaff, setFilterStaff] = useState<string>('ALL')
  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR)

  // View toggle
  const [view, setView] = useState<'table' | 'calendar'>('table')

  // Calendar month navigation
  const [calendarDate, setCalendarDate] = useState(new Date())

  // New request dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({
    staffId: '',
    leaveType: '' as LeaveType | '',
    startDate: '',
    endDate: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null)
  const [deleting, setDeleting] = useState(false)

  const clinicId = getClinicId()

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ clinicId, year: String(filterYear) })
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      const res = await fetch(`/api/staff/leave?${params}`)
      if (!res.ok) throw new Error('Kunde inte hämta ledighetsansökningar')
      const data = await res.json()
      setLeaves(Array.isArray(data) ? data : data.leaves ?? [])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ett fel uppstod'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [clinicId, filterYear, filterStatus])

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff?clinicId=${clinicId}`)
      if (!res.ok) return
      const data = await res.json()
      setStaff(Array.isArray(data) ? data : data.staff ?? [])
    } catch {
      // Non-critical
    }
  }, [clinicId])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // ── Filtered leaves ─────────────────────────────────────────────────────────

  const filteredLeaves = leaves.filter((l) => {
    if (filterStaff !== 'ALL' && l.staffId !== filterStaff) return false
    return true
  })

  // ── Summary stats ───────────────────────────────────────────────────────────

  const totalVacationDays = filteredLeaves
    .filter((l) => l.leaveType === 'VACATION' && l.status === 'APPROVED')
    .reduce((acc, l) => acc + countDays(l.startDate, l.endDate), 0)

  const pendingCount = filteredLeaves.filter((l) => l.status === 'PENDING').length
  const approvedCount = filteredLeaves.filter((l) => l.status === 'APPROVED').length
  const sickDays = filteredLeaves
    .filter((l) => l.leaveType === 'SICK_LEAVE' && l.status === 'APPROVED')
    .reduce((acc, l) => acc + countDays(l.startDate, l.endDate), 0)

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleApprove = async (leave: LeaveRequest) => {
    try {
      const res = await fetch(`/api/staff/leave/${leave.id}/approve`, { method: 'PUT' })
      if (!res.ok) throw new Error('Kunde inte godkänna ansökan')
      toast.success('Ansökan godkänd')
      fetchLeaves()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ett fel uppstod')
    }
  }

  const openRejectDialog = (leave: LeaveRequest) => {
    setRejectTarget(leave)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setRejecting(true)
    try {
      const res = await fetch(`/api/staff/leave/${rejectTarget.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (!res.ok) throw new Error('Kunde inte avvisa ansökan')
      toast.success('Ansökan avvisad')
      setRejectDialogOpen(false)
      fetchLeaves()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setRejecting(false)
    }
  }

  const openDeleteDialog = (leave: LeaveRequest) => {
    setDeleteTarget(leave)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/staff/leave/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Kunde inte radera ansökan')
      toast.success('Ansökan raderad')
      setDeleteDialogOpen(false)
      fetchLeaves()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmitNew = async () => {
    if (!newForm.staffId || !newForm.leaveType || !newForm.startDate || !newForm.endDate) {
      toast.error('Fyll i alla obligatoriska fält')
      return
    }
    if (newForm.startDate > newForm.endDate) {
      toast.error('Startdatum måste vara före slutdatum')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/staff/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          staffId: newForm.staffId,
          leaveType: newForm.leaveType,
          startDate: newForm.startDate,
          endDate: newForm.endDate,
          reason: newForm.reason,
        }),
      })
      if (!res.ok) throw new Error('Kunde inte skapa ansökan')
      toast.success('Ledighetsansökan skapad')
      setDialogOpen(false)
      setNewForm({ staffId: '', leaveType: '', startDate: '', endDate: '', reason: '' })
      fetchLeaves()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Calendar helpers ────────────────────────────────────────────────────────

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(calendarDate),
    end: endOfMonth(calendarDate),
  })

  // pad start: Monday = 0
  const firstDayOfWeek = (getDay(startOfMonth(calendarDate)) + 6) % 7 // convert Sun=0 to Mon=0
  const paddingDays = Array.from({ length: firstDayOfWeek })

  const getLeaveForDay = (day: Date): LeaveRequest[] => {
    return filteredLeaves.filter((l) => {
      try {
        const start = parseISO(l.startDate)
        const end = parseISO(l.endDate)
        return day >= start && day <= end && l.status !== 'CANCELLED'
      } catch {
        return false
      }
    })
  }

  const staffName = (id: string) => {
    const member = staff.find((s) => s.id === id)
    return member?.name ?? 'Okänd personal'
  }

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Semester &amp; Frånvaro</h1>
          <p className="text-sm text-gray-500 mt-1">Hantera ledighetsansökningar och frånvaro för personalen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Ny ansökan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Ny ledighetsansökan</DialogTitle>
              <DialogDescription>
                Fyll i uppgifterna nedan för att skapa en ny ledighetsansökan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Staff picker */}
              <div className="grid gap-1.5">
                <Label htmlFor="new-staff">Personal <span className="text-red-500">*</span></Label>
                <Select
                  value={newForm.staffId}
                  onValueChange={(v) => setNewForm((f) => ({ ...f, staffId: v }))}
                >
                  <SelectTrigger id="new-staff">
                    <SelectValue placeholder="Välj personal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Leave type */}
              <div className="grid gap-1.5">
                <Label htmlFor="new-type">Typ av ledighet <span className="text-red-500">*</span></Label>
                <Select
                  value={newForm.leaveType}
                  onValueChange={(v) => setNewForm((f) => ({ ...f, leaveType: v as LeaveType }))}
                >
                  <SelectTrigger id="new-type">
                    <SelectValue placeholder="Välj typ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="new-start">Startdatum <span className="text-red-500">*</span></Label>
                  <Input
                    id="new-start"
                    type="date"
                    value={newForm.startDate}
                    onChange={(e) => setNewForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="new-end">Slutdatum <span className="text-red-500">*</span></Label>
                  <Input
                    id="new-end"
                    type="date"
                    value={newForm.endDate}
                    min={newForm.startDate}
                    onChange={(e) => setNewForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Duration preview */}
              {newForm.startDate && newForm.endDate && newForm.startDate <= newForm.endDate && (
                <p className="text-sm text-gray-500 -mt-1">
                  Antal dagar: <span className="font-semibold text-gray-800">{countDays(newForm.startDate, newForm.endDate)}</span>
                </p>
              )}

              {/* Reason */}
              <div className="grid gap-1.5">
                <Label htmlFor="new-reason">Anledning</Label>
                <Textarea
                  id="new-reason"
                  placeholder="Frivillig kommentar..."
                  value={newForm.reason}
                  onChange={(e) => setNewForm((f) => ({ ...f, reason: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Avbryt</Button>
              <Button onClick={handleSubmitNew} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Skapa ansökan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Semesterdagar (godkända)</CardTitle>
            <Sun className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVacationDays}</div>
            <p className="text-xs text-gray-500 mt-1">dagar totalt {filterYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Pågående ansökningar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-gray-500 mt-1">väntar på beslut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Godkända</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-gray-500 mt-1">ansökningar godkända</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Sjukdagar</CardTitle>
            <Stethoscope className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sickDays}</div>
            <p className="text-xs text-gray-500 mt-1">sjukdagar {filterYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter bar + View toggle ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alla statusar</SelectItem>
              <SelectItem value="PENDING">Väntande</SelectItem>
              <SelectItem value="APPROVED">Godkända</SelectItem>
              <SelectItem value="REJECTED">Avvisade</SelectItem>
              <SelectItem value="CANCELLED">Avbrutna</SelectItem>
            </SelectContent>
          </Select>

          {/* Staff filter */}
          <Select value={filterStaff} onValueChange={setFilterStaff}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Personal..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All personal</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year filter */}
          <Select value={String(filterYear)} onValueChange={(v) => setFilterYear(Number(v))}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="År..." />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-md border p-1 bg-gray-50 w-fit">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setView('table')}
          >
            <TableIcon className="h-3.5 w-3.5" />
            Tabell
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => setView('calendar')}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Kalender
          </Button>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Table view ── */}
      {view === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ledighetsansökningar</CardTitle>
            <CardDescription>
              {loading ? 'Laddar...' : `${filteredLeaves.length} ansökning${filteredLeaves.length !== 1 ? 'ar' : ''} hittades`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Laddar ansökningar...</span>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <CalendarDays className="h-10 w-10 opacity-30" />
                <p className="text-sm">Inga ansökningar hittades</p>
                <p className="text-xs">Prova att ändra filtren eller skapa en ny ansökan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Personal</TableHead>
                      <TableHead className="font-semibold">Typ</TableHead>
                      <TableHead className="font-semibold">Period</TableHead>
                      <TableHead className="font-semibold text-right">Antal dagar</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaves.map((leave) => {
                      const days = countDays(leave.startDate, leave.endDate)
                      const name = leave.staffName ?? staffName(leave.staffId)
                      return (
                        <TableRow key={leave.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="font-medium text-gray-900">{name}</div>
                            {leave.reason && (
                              <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]" title={leave.reason}>
                                {leave.reason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border"
                              style={{
                                backgroundColor: LEAVE_TYPE_COLORS[leave.leaveType] + '18',
                                borderColor: LEAVE_TYPE_COLORS[leave.leaveType] + '44',
                                color: LEAVE_TYPE_COLORS[leave.leaveType],
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: LEAVE_TYPE_COLORS[leave.leaveType] }}
                              />
                              {LEAVE_TYPE_LABELS[leave.leaveType]}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">
                            <div>
                              {format(parseISO(leave.startDate), 'd MMM yyyy', { locale: sv })}
                            </div>
                            <div className="text-xs text-gray-400">
                              → {format(parseISO(leave.endDate), 'd MMM yyyy', { locale: sv })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-800">
                            {days}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusBadgeClass(leave.status)}`}
                            >
                              {LEAVE_STATUS_LABELS[leave.status]}
                            </Badge>
                            {leave.status === 'REJECTED' && leave.rejectionReason && (
                              <div className="text-xs text-red-400 mt-0.5 truncate max-w-[160px]" title={leave.rejectionReason}>
                                {leave.rejectionReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {leave.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                    onClick={() => handleApprove(leave)}
                                    title="Godkänn"
                                  >
                                    <Check className="h-3 w-3" />
                                    Godkänn
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => openRejectDialog(leave)}
                                    title="Avvisa"
                                  >
                                    <X className="h-3 w-3" />
                                    Avvisa
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                onClick={() => openDeleteDialog(leave)}
                                title="Radera"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Calendar view ── */}
      {view === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base capitalize">
                  {format(calendarDate, 'MMMM yyyy', { locale: sv })}
                </CardTitle>
                <CardDescription>Ledigheter per dag</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCalendarDate((d) => subMonths(d, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => setCalendarDate(new Date())}
                >
                  Idag
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCalendarDate((d) => addMonths(d, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-2">
              {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveType, string][]).map(([key, label]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: LEAVE_TYPE_COLORS[key] }}
                  />
                  {label}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
              {/* Padding cells */}
              {paddingDays.map((_, i) => (
                <div key={`pad-${i}`} className="bg-gray-50 min-h-[80px] p-1" />
              ))}

              {/* Day cells */}
              {calendarDays.map((day) => {
                const dayLeaves = getLeaveForDay(day)
                const inMonth = isSameMonth(day, calendarDate)
                const today = isToday(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-white min-h-[80px] p-1.5 flex flex-col gap-1 ${!inMonth ? 'opacity-40' : ''}`}
                  >
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full shrink-0 ${
                        today
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayLeaves.slice(0, 3).map((leave) => {
                        const name = leave.staffName ?? staffName(leave.staffId)
                        const shortName = name.split(' ')[0]
                        return (
                          <span
                            key={leave.id}
                            className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate border ${LEAVE_TYPE_CALENDAR_CLASS[leave.leaveType]}`}
                            title={`${name} – ${LEAVE_TYPE_LABELS[leave.leaveType]}`}
                          >
                            {shortName}
                          </span>
                        )
                      })}
                      {dayLeaves.length > 3 && (
                        <span className="text-[10px] text-gray-400 pl-1">
                          +{dayLeaves.length - 3} till
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reject dialog ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Avvisa ansökan</DialogTitle>
            <DialogDescription>
              {rejectTarget && (
                <>
                  Avvisa ledighetsansökan för{' '}
                  <strong>{rejectTarget.staffName ?? staffName(rejectTarget.staffId)}</strong>{' '}
                  ({format(parseISO(rejectTarget.startDate), 'd MMM', { locale: sv })}–{format(parseISO(rejectTarget.endDate), 'd MMM yyyy', { locale: sv })}).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="reject-reason">Anledning till avvisning</Label>
              <Textarea
                id="reject-reason"
                placeholder="Ange anledning (valfritt)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Avbryt</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Avvisa ansökan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Radera ansökan</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Är du säker på att du vill radera ledighetsansökan för{' '}
                  <strong>{deleteTarget.staffName ?? staffName(deleteTarget.staffId)}</strong>?
                  Åtgärden kan inte ångras.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Avbryt</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Radera
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
