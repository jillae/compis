
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/segments - List all segments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const segments = await prisma.customerSegment.findMany({
      where: {
        clinicId: session.user.clinicId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(segments);
  } catch (error) {
    console.error('[Segments API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

// POST /api/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, filters } = body;

    if (!name || !filters) {
      return NextResponse.json(
        { error: 'Name and filters are required' },
        { status: 400 }
      );
    }

    // Calculate customer count based on filters
    const customerCount = await calculateSegmentSize(session.user.clinicId, filters);
    
    // Calculate total value
    const customers = await getSegmentCustomers(session.user.clinicId, filters);
    const totalValue = customers.reduce(
      (sum, c) => sum + parseFloat(c.lifetimeValue?.toString() || '0'),
      0
    );

    const segment = await prisma.customerSegment.create({
      data: {
        clinicId: session.user.clinicId,
        name,
        description,
        filters,
        customerCount,
        totalValue,
        lastCalculatedAt: new Date(),
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error('[Segments API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    );
  }
}

// Helper function to calculate segment size
async function calculateSegmentSize(clinicId: string, filters: any): Promise<number> {
  const customers = await getSegmentCustomers(clinicId, filters);
  return customers.length;
}

// Helper function to get customers matching segment filters
async function getSegmentCustomers(clinicId: string, filters: any) {
  const where: any = {
    clinicId,
  };

  // Apply tag filters
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    where.AND = where.AND || [];
    where.AND.push({
      customerTags: {
        some: {
          tag: {
            name: {
              in: filters.tags,
            },
          },
        },
      },
    });
  }

  // Apply LTV filters
  if (filters.ltvMin !== undefined) {
    where.lifetimeValue = where.lifetimeValue || {};
    where.lifetimeValue.gte = filters.ltvMin;
  }
  if (filters.ltvMax !== undefined) {
    where.lifetimeValue = where.lifetimeValue || {};
    where.lifetimeValue.lte = filters.ltvMax;
  }

  // Apply visit frequency filters
  if (filters.totalVisitsMin !== undefined) {
    where.totalVisits = where.totalVisits || {};
    where.totalVisits.gte = filters.totalVisitsMin;
  }
  if (filters.totalVisitsMax !== undefined) {
    where.totalVisits = where.totalVisits || {};
    where.totalVisits.lte = filters.totalVisitsMax;
  }

  // Apply churn risk filter
  if (filters.churnRisk) {
    where.churnRisk = filters.churnRisk;
  }

  // Apply last visit date filter
  if (filters.lastVisitDaysAgo !== undefined) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.lastVisitDaysAgo);
    where.lastVisitAt = {
      lte: daysAgo,
    };
  }

  return await prisma.customer.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      lifetimeValue: true,
      totalVisits: true,
      lastVisitAt: true,
    },
  });
}
