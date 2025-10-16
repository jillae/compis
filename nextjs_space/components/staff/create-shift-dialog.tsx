
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface CreateShiftDialogProps {
  clinicId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateShiftDialog({ clinicId, open, onClose, onSuccess }: CreateShiftDialogProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    staffId: '',
    shiftDate: '',
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: '30',
    shiftType: 'REGULAR',
    notes: '',
  });

  useEffect(() => {
    if (open && clinicId) {
      loadStaff();
    }
  }, [open, clinicId]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();

      if (data.success) {
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staffId || !formData.shiftDate || !formData.startTime || !formData.endTime) {
      toast.error('Alla obligatoriska fält krävs');
      return;
    }

    // Combine date and time
    const startDateTime = new Date(`${formData.shiftDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.shiftDate}T${formData.endTime}`);

    setSubmitting(true);
    try {
      const res = await fetch('/api/staff/schedule/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          staffId: formData.staffId,
          shiftDate: formData.shiftDate,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          breakMinutes: parseInt(formData.breakMinutes),
          shiftType: formData.shiftType,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Pass skapat!');
        onSuccess();
      } else {
        toast.error(data.error || 'Kunde inte skapa pass');
      }
    } catch (error: any) {
      console.error('Error creating shift:', error);
      toast.error('Något gick fel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Skapa nytt pass</DialogTitle>
          <DialogDescription>
            Lägg till ett arbetspass för en personal i schemat
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staffId">Personal *</Label>
            <Select
              value={formData.staffId}
              onValueChange={(value) => setFormData({ ...formData, staffId: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj personal" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.role && `(${s.role})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shiftDate">Datum *</Label>
            <Input
              id="shiftDate"
              type="date"
              value={formData.shiftDate}
              onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Starttid *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Sluttid *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Rast (minuter)</Label>
              <Input
                id="breakMinutes"
                type="number"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                min="0"
                step="15"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shiftType">Passtyp</Label>
              <Select
                value={formData.shiftType}
                onValueChange={(value) => setFormData({ ...formData, shiftType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REGULAR">Ordinarie</SelectItem>
                  <SelectItem value="MORNING">Morgon</SelectItem>
                  <SelectItem value="AFTERNOON">Eftermiddag</SelectItem>
                  <SelectItem value="EVENING">Kväll</SelectItem>
                  <SelectItem value="ON_CALL">Jour</SelectItem>
                  <SelectItem value="EXTRA">Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Valfria anteckningar om passet..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Avbryt
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Skapa pass
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
