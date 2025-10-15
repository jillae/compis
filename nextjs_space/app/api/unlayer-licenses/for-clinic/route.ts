

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get license for current clinic
    const license = await prisma.unlayerLicense.findUnique({
      where: {
        clinicId: session.user.clinicId,
      },
    });

    // If no license exists, return FREE plan
    if (!license) {
      return NextResponse.json({
        plan: 'FREE',
        status: 'ACTIVE',
        apiKey: null,
      });
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error('Error fetching clinic license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

