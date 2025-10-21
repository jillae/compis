
'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Plus, Loader2, RefreshCw, Download } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import svLocale from '@fullcalendar/core/locales/sv';
import CreateShiftDialog from '@/components/staff/create-shift-dialog';
import { EventInput, EventDropArg, EventChangeArg } from '@fullcalendar/core';

interface Schedule {
  id: string;
  staffId: string;
  staffName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  shiftType: string;
  status: string;
  notes?: string;
}

export default function StaffSchedulePage() {
  const { data: session } = useSession() || {};
  const [clinicId, setClinicId] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Get clinic ID from session
  useEffect(() => {
    if (session?.user && 'clinicId' in session.user) {
      setClinicId((session.user as any).clinicId || '');
    }
  }, [session]);

  useEffect(() => {
    if (clinicId) {
      loadSchedules();
    }
  }, [clinicId]);

  const loadSchedules = async () => {
    if (!clinicId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ clinicId });

      const res = await fetch(`/api/staff/schedule?${params}`);
      const data = await res.json();

      if (data.success) {
        // Flatten schedules array
        const allSchedules: Schedule[] = [];
        data.schedules?.forEach((staffSchedule: any) => {
          staffSchedule.shifts?.forEach((shift: any) => {
            allSchedules.push({
              ...shift,
              staffId: staffSchedule.staffId,
              staffName: staffSchedule.staffName,
            });
          });
        });
        setSchedules(allSchedules);
      } else {
        toast.error(data.error || 'Kunde inte ladda schema');
      }
    } catch (error: any) {
      console.error('Error loading schedules:', error);
      toast.error('Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  // Convert schedules to FullCalendar events
  const events: EventInput[] = schedules.map((schedule) => ({
    id: schedule.id,
    title: `${schedule.staffName} - ${schedule.shiftType}`,
    start: schedule.startTime,
    end: schedule.endTime,
    backgroundColor: getStatusColor(schedule.status),
    borderColor: getStatusColor(schedule.status),
    extendedProps: {
      ...schedule,
    },
  }));

  function getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return '#3b82f6'; // blue
      case 'CONFIRMED':
        return '#10b981'; // green
      case 'COMPLETED':
        return '#6b7280'; // gray
      case 'CANCELLED':
        return '#ef4444'; // red
      case 'NO_SHOW':
        return '#f59e0b'; // amber
      default:
        return '#3b82f6';
    }
  }

  // Handle event drop (drag-and-drop)
  const handleEventDrop = async (info: EventDropArg) => {
    const event = info.event;
    const scheduleId = event.id;

    try {
      const res = await fetch(`/api/staff/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: event.start?.toISOString(),
          endTime: event.end?.toISOString(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Kunde inte uppdatera schemat');
        info.revert(); // Revert the drop
      } else {
        toast.success('Schemat uppdaterat!');
        await loadSchedules(); // Reload to sync with DB
      }
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      toast.error('Något gick fel');
      info.revert();
    }
  };

  // Handle event resize
  const handleEventResize = async (info: EventChangeArg) => {
    const event = info.event;
    const scheduleId = event.id;

    try {
      const res = await fetch(`/api/staff/schedule/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: event.start?.toISOString(),
          endTime: event.end?.toISOString(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Kunde inte ändra längden');
        info.revert();
      } else {
        toast.success('Passlängd uppdaterad!');
        await loadSchedules();
      }
    } catch (error: any) {
      console.error('Error resizing schedule:', error);
      toast.error('Något gick fel');
      info.revert();
    }
  };

  // Handle date click (create new shift)
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setShowCreateDialog(true);
  };

  // Handle event click (edit shift)
  const handleEventClick = (info: any) => {
    const schedule = info.event.extendedProps as Schedule;
    
    // TODO: Open edit dialog
    toast.info(`Klicka på ${schedule.staffName}'s pass\nStatus: ${schedule.status}`);
  };

  // Sync with Bokadirekt
  const syncWithBokadirekt = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bokadirekt/sync-availabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Synkad! ${data.data.recordsUpserted} scheman skapade`);
        await loadSchedules();
      } else {
        toast.error(data.errors?.[0] || 'Synkning misslyckades');
      }
    } catch (error: any) {
      console.error('Error syncing with Bokadirekt:', error);
      toast.error('Något gick fel vid synkning');
    } finally {
      setLoading(false);
    }
  };

  // Export schedule to CSV
  const exportSchedule = () => {
    const csv = schedules.map((s) => ({
      Personal: s.staffName,
      Datum: new Date(s.startTime).toLocaleDateString('sv-SE'),
      Starttid: new Date(s.startTime).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      Sluttid: new Date(s.endTime).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      Rast: `${s.breakMinutes} min`,
      Typ: s.shiftType,
      Status: s.status,
      Anteckningar: s.notes || '',
    }));

    const csvString = [
      Object.keys(csv[0] || {}).join(','),
      ...csv.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Schema exporterat!');
  };

  if (!clinicId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personalschema</h1>
          <p className="text-muted-foreground">
            Dra och släpp för att flytta pass, ändra storlek för att justera längd
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={syncWithBokadirekt}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synka med Bokadirekt
          </Button>
          <Button
            onClick={exportSchedule}
            variant="outline"
            disabled={schedules.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportera
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Skapa Pass
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schemakalender
          </CardTitle>
          <CardDescription>
            Veckovis och dagvis vy av personalschema. Färger: Blå = Planerat, Grön = Bekräftat, Grå = Genomfört, Röd = Inställt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={svLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={events}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            height="auto"
            nowIndicator={true}
            weekNumbers={true}
            weekNumberFormat={{ week: 'numeric' }}
            slotDuration="00:30:00"
            slotLabelInterval="01:00"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
              startTime: '08:00',
              endTime: '18:00',
            }}
            loading={setLoading}
          />
        </CardContent>
      </Card>

      {/* Create Shift Dialog */}
      <CreateShiftDialog
        clinicId={clinicId}
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setSelectedDate(null);
        }}
        onSuccess={() => {
          loadSchedules();
          setShowCreateDialog(false);
          setSelectedDate(null);
        }}
        initialDate={selectedDate}
      />
    </div>
  );
}
