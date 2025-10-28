
// Service Marketplace API - List available services

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List all active services from all clinics (marketplace view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {
      isActive: true, // Only show active services
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
      take: 100, // Limit to 100 services
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Marketplace services API error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
