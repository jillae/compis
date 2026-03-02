'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Users,
  UserCheck,
  Clock,
  BarChart2,
  Plus,
  Pencil,
  Calendar,
  Umbrella,
  Trash2,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EmploymentType =
  | 'FULLTIME'
  | 'PARTTIME'
  | 'HOURLY'
  | 'CONTRACTOR'
  | 'TEMPORARY';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  weeklyHours?: number;
  employmentType?: EmploymentType;
  specialization?: string;
  hourlyRate?: number;
  startDate?: string;
}

interface StaffFormData {
  name: string;
  role: string;
  email: string;
  phone: string;
  employmentType: EmploymentType | '';
  weeklyHours: string;
  hourlyRate: string;
  startDate: string;
  specialization: string;
}

const EMPTY_FORM: StaffFormData = {
  name: '',
  role: '',
  email: '',
  phone: '',
  employmentType: '',
  weeklyHours: '40',
  hourlyRate: '',
  startDate: '',
  specialization: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getClinicId = () =>
  typeof window !== 'undefined' ? localStorage.getItem('clinicId') || '' : '';

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FULLTIME: 'Heltid',
  PARTTIME: 'Deltid',
  HOURLY: 'Timanställd',
  CONTRACTOR: 'Konsult',
  TEMPORARY: 'Vikarie',
};

const EMPLOYMENT_BADGE_CLASSES: Record<EmploymentType, string> = {
  FULLTIME:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PARTTIME: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HOURLY:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONTRACTOR:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  TEMPORARY:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

/** Generate a deterministic HSL color from a role string */
function roleColor(role: string): string {
  let hash = 0;
  for (let i = 0; i < role.length; i++) {
    hash = role.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

/** Return up-to-2-letter initials */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Summary card component
// ---------------------------------------------------------------------------

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6 pb-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Staff card component
// ---------------------------------------------------------------------------

function StaffCard({
  member,
  onEdit,
  onDelete,
}: {
  member: StaffMember;
  onEdit: (m: StaffMember) => void;
  onDelete: (id: string) => void;
}) {
  const type = member.employmentType;
  const hours = member.weeklyHours ?? 0;
  const hoursPercent = Math.min(100, Math.round((hours / 40) * 100));
  const avatarColor = roleColor(member.role || member.name);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col flex-1 p-5 gap-4">
        {/* Avatar + name + role */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
            style={{ backgroundColor: avatarColor }}
          >
            {initials(member.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base leading-tight truncate">
              {member.name}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {member.role}
            </p>
            {type && (
              <span
                className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${EMPLOYMENT_BADGE_CLASSES[type]}`}
              >
                {EMPLOYMENT_LABELS[type]}
              </span>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1 text-sm text-muted-foreground">
          {member.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>

        {/* Weekly hours progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Veckotimmar
            </span>
            <span>
              {hours}h / 40h
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${hoursPercent}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] text-xs"
            onClick={() => onEdit(member)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Redigera
          </Button>
          <Link href="/dashboard/staff/schedule" className="flex">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs w-full"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Schema
            </Button>
          </Link>
          <Link href="/dashboard/staff/leave" className="flex">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs w-full"
            >
              <Umbrella className="w-3.5 h-3.5 mr-1.5" />
              Ledighet
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(member.id)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Radera
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

function StaffDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: StaffMember | null;
  onSave: (data: StaffFormData) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              role: initial.role,
              email: initial.email ?? '',
              phone: initial.phone ?? '',
              employmentType: initial.employmentType ?? '',
              weeklyHours: String(initial.weeklyHours ?? 40),
              hourlyRate: String(initial.hourlyRate ?? ''),
              startDate: initial.startDate ?? '',
              specialization: initial.specialization ?? '',
            }
          : EMPTY_FORM,
      );
    }
  }, [open, initial]);

  const set = (key: keyof StaffFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error('Namn och roll är obligatoriska fält.');
      return;
    }
    await onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? 'Redigera personal' : 'Lägg till personal'}
          </DialogTitle>
          <DialogDescription>
            {initial
              ? 'Uppdatera personalens uppgifter nedan.'
              : 'Fyll i uppgifterna för den nya medarbetaren.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Namn */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">
              Namn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="staff-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Anna Svensson"
              required
            />
          </div>

          {/* Roll */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-role">
              Roll <span className="text-destructive">*</span>
            </Label>
            <Input
              id="staff-role"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              placeholder="Hudterapeut"
              required
            />
          </div>

          {/* E-post */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-email">E-post</Label>
            <Input
              id="staff-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="anna@klinik.se"
            />
          </div>

          {/* Telefon */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-phone">Telefon</Label>
            <Input
              id="staff-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="070-000 00 00"
            />
          </div>

          {/* Anställningsform */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-employment">Anställningsform</Label>
            <Select
              value={form.employmentType}
              onValueChange={(v) => set('employmentType', v as EmploymentType)}
            >
              <SelectTrigger id="staff-employment" className="min-h-[44px]">
                <SelectValue placeholder="Välj anställningsform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULLTIME">Heltid</SelectItem>
                <SelectItem value="PARTTIME">Deltid</SelectItem>
                <SelectItem value="HOURLY">Timanställd</SelectItem>
                <SelectItem value="CONTRACTOR">Konsult</SelectItem>
                <SelectItem value="TEMPORARY">Vikarie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Veckotimmar */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-hours">Veckotimmar</Label>
            <Input
              id="staff-hours"
              type="number"
              min={0}
              max={168}
              value={form.weeklyHours}
              onChange={(e) => set('weeklyHours', e.target.value)}
              placeholder="40"
            />
          </div>

          {/* Timlön */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-rate">Timlön (kr)</Label>
            <Input
              id="staff-rate"
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => set('hourlyRate', e.target.value)}
              placeholder="Valfritt"
            />
          </div>

          {/* Startdatum */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-start">Startdatum</Label>
            <Input
              id="staff-start"
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>

          {/* Specialisering */}
          <div className="space-y-1.5">
            <Label htmlFor="staff-spec">Specialisering</Label>
            <Input
              id="staff-spec"
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
              placeholder="t.ex. Laserbehandling"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-h-[44px]"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              className="flex-1 min-h-[44px]"
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? 'Spara ändringar' : 'Lägg till'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- Data fetching -------------------------------------------------------

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Nätverksfel');
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff ?? []);
      } else {
        toast.error('Kunde inte hämta personal.');
      }
    } catch {
      toast.error('Fel vid hämtning av personal.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  // ---- Computed stats -------------------------------------------------------

  const totalStaff = staff.length;
  const fulltime = staff.filter((s) => s.employmentType === 'FULLTIME').length;
  const partOrHourly = staff.filter(
    (s) => s.employmentType === 'PARTTIME' || s.employmentType === 'HOURLY',
  ).length;
  const avgHours =
    staff.length > 0
      ? Math.round(
          staff.reduce((sum, s) => sum + (s.weeklyHours ?? 0), 0) /
            staff.length,
        )
      : 0;

  // ---- CRUD ----------------------------------------------------------------

  async function handleSave(form: StaffFormData) {
    setSaving(true);
    const clinicId = getClinicId();

    const body: Record<string, unknown> = {
      clinicId,
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      employmentType: form.employmentType || undefined,
      weeklyHours: form.weeklyHours ? Number(form.weeklyHours) : undefined,
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
      startDate: form.startDate || undefined,
      specialization: form.specialization.trim() || undefined,
    };

    try {
      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/staff/${editTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) throw new Error('Serverfel');
      const data = await res.json();
      if (data.success === false) throw new Error(data.message ?? 'Serverfel');

      toast.success(
        editTarget ? 'Personaluppgifter uppdaterade.' : 'Personal tillagd.',
      );
      setDialogOpen(false);
      await loadStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Okänt fel';
      toast.error(`Något gick fel: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Är du säker på att du vill radera denna person?')) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Serverfel');
      toast.success('Personalen har raderats.');
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error('Kunde inte radera personal.');
    }
  }

  function openAdd() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditTarget(member);
    setDialogOpen(true);
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Personalöversikt</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Hantera klinikens personal, roller och anställningsinformation
            </p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="min-h-[44px] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till personal
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Total personal"
          value={totalStaff}
          color="bg-blue-100 dark:bg-blue-900/30"
        />
        <SummaryCard
          icon={<UserCheck className="w-5 h-5 text-green-600" />}
          label="Heltid"
          value={fulltime}
          color="bg-green-100 dark:bg-green-900/30"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          label="Deltid / Timvikarie"
          value={partOrHourly}
          color="bg-amber-100 dark:bg-amber-900/30"
        />
        <SummaryCard
          icon={<BarChart2 className="w-5 h-5 text-purple-600" />}
          label="Genomsnittliga veckotimmar"
          value={`${avgHours}h`}
          color="bg-purple-100 dark:bg-purple-900/30"
        />
      </div>

      {/* Staff grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            Hämtar personal...
          </span>
        </div>
      ) : staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <Users className="w-14 h-14 text-muted-foreground/40" />
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">Ingen personal hittades</p>
              <p className="text-muted-foreground text-sm">
                Lägg till din första medarbetare för att komma igång.
              </p>
            </div>
            <Button onClick={openAdd} className="min-h-[44px]">
              <Plus className="w-4 h-4 mr-2" />
              Lägg till personal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {staff.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editTarget}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
