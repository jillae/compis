
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, getClinicFilter, unauthorizedResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function GET(request: NextRequest) {
  try {
    // 🔒 Authentication & Multi-tenant Security
    const session = await getAuthSession();
    const clinicFilter = getClinicFilter(session);

    const staff = await prisma.staff.findMany({
      where: {
        ...clinicFilter,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to fetch staff');
  }
}
