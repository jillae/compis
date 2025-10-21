
/**
 * 46elks Subaccounts API
 * 
 * Endpoints:
 * - GET /api/46elks/subaccounts - List all subaccounts (SuperAdmin only)
 * - POST /api/46elks/subaccounts - Create subaccount for a clinic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  listAllSubaccounts,
  createSubaccountForClinic,
} from '@/lib/46elks/subaccount-service';

/**
 * GET /api/46elks/subaccounts
 * List all subaccounts (SuperAdmin only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - SuperAdmin access required' },
        { status: 401 }
      );
    }

    const result = await listAllSubaccounts();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subaccounts: result.subaccounts,
    });
  } catch (error: any) {
    console.error('GET /api/46elks/subaccounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/46elks/subaccounts
 * Create subaccount for a clinic
 * 
 * Body: { clinicId: string, clinicName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - SuperAdmin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { clinicId, clinicName } = body;

    if (!clinicId || !clinicName) {
      return NextResponse.json(
        { error: 'Missing required fields: clinicId, clinicName' },
        { status: 400 }
      );
    }

    const result = await createSubaccountForClinic({
      clinicId,
      clinicName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subaccountId: result.subaccountId,
      message: 'Subaccount created successfully',
    });
  } catch (error: any) {
    console.error('POST /api/46elks/subaccounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
