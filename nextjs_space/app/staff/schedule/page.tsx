
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import CreateShiftDialog from '@/components/staff/create-shift-dialog';

interface Schedule {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  shiftType: string;
  status: string;
  notes?: string;
}

interface StaffSchedule {
  staffId: string;
  staffName: string;
  staffEmail: string;
  role: string;
  shifts: Schedule[];
}

export default function StaffSchedulePage() {
  const { data: session } = useSession() || {};
  const [clinicId, setClinicId] = useState<string>('');
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
  }, [clinicId, currentWeekStart]);

  const loadSchedules = async () => {
    if (!clinicId) return;

    setLoading(true);
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const params = new URLSearchParams({
        clinicId,
        startDate: format(currentWeekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
      });

      const res = await fetch(`/api/staff/schedule?${params}`);
      const data = await res.json();

      if (data.success) {
        setSchedules(data.schedules || []);
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

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });

  const getShiftsForDay = (staffId: string, date: Date) => {
    const staff = schedules.find((s) => s.staffId === staffId);
    if (!staff) return [];

    const dateStr = format(date, 'yyyy-MM-dd');
    return staff.shifts.filter((shift) => {
      const shiftDateStr = format(parseISO(shift.shiftDate), 'yyyy-MM-dd');
      return shiftDateStr === dateStr;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500';
      case 'CONFIRMED':
        return 'bg-green-500';
      case 'COMPLETED':
        return 'bg-gray-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Logga in för att se schema</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Personalschema
          </h1>
          <p className="text-muted-foreground mt-2">
            Schemaläggning och arbetsschemanför all personal
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nytt pass
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Vecka {format(currentWeekStart, 'w', { locale: sv })} · {format(currentWeekStart, 'yyyy')}
              </CardTitle>
              <CardDescription>
                {format(currentWeekStart, 'd MMMM', { locale: sv })} -{' '}
                {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'd MMMM', { locale: sv })}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Idag
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Inga scheman för denna vecka</p>
              <Button variant="link" onClick={() => setShowCreateDialog(true)} className="mt-2">
                Skapa första passet
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Personal</th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="text-center p-3 font-medium min-w-[120px]">
                        <div className="text-sm">
                          {format(day, 'EEE', { locale: sv })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(day, 'd MMM', { locale: sv })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((staff) => (
                    <tr key={staff.staffId} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{staff.staffName}</div>
                          {staff.role && (
                            <div className="text-xs text-muted-foreground">{staff.role}</div>
                          )}
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const shifts = getShiftsForDay(staff.staffId, day);
                        return (
                          <td key={day.toISOString()} className="p-3 align-top">
                            <div className="space-y-1">
                              {shifts.map((shift) => (
                                <div
                                  key={shift.id}
                                  className="text-xs p-2 rounded bg-muted border-l-4 hover:bg-muted/80 cursor-pointer transition"
                                  style={{ borderLeftColor: getStatusColor(shift.status) }}
                                >
                                  <div className="font-medium">
                                    {format(parseISO(shift.startTime), 'HH:mm')} -{' '}
                                    {format(parseISO(shift.endTime), 'HH:mm')}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.shiftType}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateDialog && (
        <CreateShiftDialog
          clinicId={clinicId}
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadSchedules();
          }}
        />
      )}
    </div>
  );
}
