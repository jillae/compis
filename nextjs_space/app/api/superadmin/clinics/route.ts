

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        subscriptionStatus: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ clinics });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

