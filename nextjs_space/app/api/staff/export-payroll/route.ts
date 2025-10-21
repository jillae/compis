
/**
 * Payroll Export API
 * 
 * GET /api/staff/export-payroll?clinicId=X&month=10&year=2025&format=fortnox
 * 
 * Export timesheet data to payroll systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, unauthorizedResponse, forbiddenResponse, errorResponse } from '@/lib/multi-tenant-security';
import {
  getTimesheetForMonth,
  exportToFortnoxCSV,
  exportToVismaCSV,
  exportToGenericCSV,
} from '@/lib/integrations/payroll-export';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Authentication & Authorization
    const session = await getAuthSession();

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const format = searchParams.get('format') || 'generic'; // fortnox, visma, generic

    if (!clinicId || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'clinicId, month, and year are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this clinic
    if (session.user.role !== 'SUPER_ADMIN' && session.user.clinicId !== clinicId) {
      return forbiddenResponse();
    }

    console.log('[API] Payroll export requested for clinic:', clinicId, 'Month:', month, 'Year:', year, 'Format:', format);

    // Get timesheet data
    const data = await getTimesheetForMonth(clinicId, parseInt(month), parseInt(year));

    // Export to CSV
    let csvContent: string;
    let filename: string;

    switch (format.toLowerCase()) {
      case 'fortnox':
        csvContent = exportToFortnoxCSV(data);
        filename = `fortnox-timesheet-${year}-${month.padStart(2, '0')}.csv`;
        break;
      case 'visma':
        csvContent = exportToVismaCSV(data);
        filename = `visma-timesheet-${year}-${month.padStart(2, '0')}.csv`;
        break;
      case 'generic':
      default:
        csvContent = exportToGenericCSV(data);
        filename = `timesheet-${year}-${month.padStart(2, '0')}.csv`;
        break;
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Payroll export failed');
  }
}
