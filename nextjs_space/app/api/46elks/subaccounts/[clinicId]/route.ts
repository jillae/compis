
/**
 * 46elks Subaccount Details API
 * 
 * GET /api/46elks/subaccounts/[clinicId]
 * Get subaccount details for a specific clinic
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClinicSubaccount } from '@/lib/46elks/subaccount-service';

interface RouteContext {
  params: {
    clinicId: string;
  };
}

/**
 * GET /api/46elks/subaccounts/[clinicId]
 * Get subaccount for a specific clinic (SuperAdmin only)
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - SuperAdmin access required' },
        { status: 401 }
      );
    }

    const { clinicId } = context.params;

    const result = await getClinicSubaccount(clinicId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subaccount: result.subaccount,
    });
  } catch (error: any) {
    console.error('GET /api/46elks/subaccounts/[clinicId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
