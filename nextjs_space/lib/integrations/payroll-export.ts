
/**
 * Payroll Export Service
 * 
 * Export staff timesheet data to payroll systems:
 * - Fortnox
 * - Visma
 * - CSV/Excel format
 */

import { prisma } from '../db';
import { format, startOfMonth, endOfMonth, differenceInHours } from 'date-fns';

export interface TimesheetEntry {
  staffId: string;
  staffName: string;
  email: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workedHours: number;
  overtimeHours: number;
  shiftType: string;
  status: string;
}

export interface PayrollExport {
  clinicId: string;
  clinicName: string;
  month: string;
  year: number;
  entries: TimesheetEntry[];
  summary: {
    totalStaff: number;
    totalHours: number;
    totalOvertimeHours: number;
  };
}

/**
 * Calculate worked hours for a time entry
 */
function calculateWorkedHours(startTime: Date, endTime: Date, breakMinutes: number): number {
  const totalMinutes = differenceInHours(endTime, startTime) * 60;
  const workedMinutes = totalMinutes - breakMinutes;
  return Math.round((workedMinutes / 60) * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate overtime hours (> 40 hours/week or 8 hours/day)
 */
function calculateOvertimeHours(workedHours: number, dailyLimit = 8): number {
  if (workedHours > dailyLimit) {
    return workedHours - dailyLimit;
  }
  return 0;
}

/**
 * Get timesheet data for a specific month
 */
export async function getTimesheetForMonth(
  clinicId: string,
  month: number,
  year: number
): Promise<PayrollExport> {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(startDate);

  // Get clinic info
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true },
  });

  // Get all time entries for the month
  const timeEntries = await prisma.staffTimeEntry.findMany({
    where: {
      staffId: {
        in: (await prisma.staff.findMany({
          where: { clinicId },
          select: { id: true },
        })).map((s) => s.id),
      },
      clockInAt: {
        gte: startDate,
        lte: endDate,
      },
      clockOutAt: { not: null },
    },
    include: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      clockInAt: 'asc',
    },
  });

  const entries: TimesheetEntry[] = timeEntries.map((entry) => {
    const workedHours = entry.workMinutes
      ? Number(entry.workMinutes) / 60
      : entry.clockOutAt
      ? calculateWorkedHours(
          entry.clockInAt,
          entry.clockOutAt,
          entry.breakMinutes || 0
        )
      : 0;

    return {
      staffId: entry.staff.id,
      staffName: entry.staff.name,
      email: entry.staff.email || '',
      date: format(entry.clockInAt, 'yyyy-MM-dd'),
      startTime: format(entry.clockInAt, 'HH:mm'),
      endTime: entry.clockOutAt ? format(entry.clockOutAt, 'HH:mm') : '',
      breakMinutes: entry.breakMinutes || 0,
      workedHours,
      overtimeHours: calculateOvertimeHours(workedHours),
      shiftType: 'REGULAR', // TODO: Get from StaffSchedule if linked
      status: 'COMPLETED',
    };
  });

  // Calculate summary
  const uniqueStaff = new Set(entries.map((e) => e.staffId));
  const totalHours = entries.reduce((sum, e) => sum + e.workedHours, 0);
  const totalOvertimeHours = entries.reduce((sum, e) => sum + e.overtimeHours, 0);

  return {
    clinicId,
    clinicName: clinic?.name || 'Unknown Clinic',
    month: format(startDate, 'MMMM', { locale: require('date-fns/locale/sv') }),
    year,
    entries,
    summary: {
      totalStaff: uniqueStaff.size,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    },
  };
}

/**
 * Export to Fortnox CSV format
 */
export function exportToFortnoxCSV(data: PayrollExport): string {
  const lines: string[] = [];

  // Header
  lines.push('PersonalID,Namn,Datum,Starttid,Sluttid,Rast(min),Arbetade timmar,Övertid,Typ');

  // Data rows
  data.entries.forEach((entry) => {
    lines.push([
      entry.staffId,
      `"${entry.staffName}"`,
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.breakMinutes,
      entry.workedHours.toFixed(2),
      entry.overtimeHours.toFixed(2),
      entry.shiftType,
    ].join(','));
  });

  // Summary row
  lines.push('');
  lines.push(`Totalt,${data.summary.totalStaff} personer,,,,,${data.summary.totalHours.toFixed(2)},${data.summary.totalOvertimeHours.toFixed(2)},`);

  return lines.join('\n');
}

/**
 * Export to Visma CSV format
 */
export function exportToVismaCSV(data: PayrollExport): string {
  const lines: string[] = [];

  // Header (Visma-specific format)
  lines.push('Anställningsnummer,Namn,E-post,Datum,Från,Till,Rast,Arbetat,Övertid,Lönetyp');

  // Data rows
  data.entries.forEach((entry) => {
    lines.push([
      entry.staffId,
      `"${entry.staffName}"`,
      entry.email,
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.breakMinutes,
      entry.workedHours.toFixed(2),
      entry.overtimeHours.toFixed(2),
      entry.shiftType === 'REGULAR' ? 'Normal' : 'Extra',
    ].join(','));
  });

  // Summary row
  lines.push('');
  lines.push(`SAMMANFATTNING:,${data.summary.totalStaff} anställda,,,,,${data.summary.totalHours.toFixed(2)} h,${data.summary.totalOvertimeHours.toFixed(2)} h,,`);

  return lines.join('\n');
}

/**
 * Export to generic Excel-compatible CSV
 */
export function exportToGenericCSV(data: PayrollExport): string {
  const lines: string[] = [];

  // Header
  lines.push('Staff ID,Name,Email,Date,Start Time,End Time,Break (min),Worked Hours,Overtime,Shift Type,Status');

  // Data rows
  data.entries.forEach((entry) => {
    lines.push([
      entry.staffId,
      `"${entry.staffName}"`,
      entry.email,
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.breakMinutes,
      entry.workedHours.toFixed(2),
      entry.overtimeHours.toFixed(2),
      entry.shiftType,
      entry.status,
    ].join(','));
  });

  // Summary
  lines.push('');
  lines.push(`Total Staff:,${data.summary.totalStaff}`);
  lines.push(`Total Hours:,${data.summary.totalHours.toFixed(2)}`);
  lines.push(`Total Overtime:,${data.summary.totalOvertimeHours.toFixed(2)}`);

  return lines.join('\n');
}
