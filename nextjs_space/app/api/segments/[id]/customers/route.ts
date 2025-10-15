
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/segments/[id]/customers - Get customers in a segment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get segment
    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Build filter query
    const filters = segment.filters as any;
    const where: any = {
      clinicId: session.user.clinicId,
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

    // Get customers
    const customers = await prisma.customer.findMany({
      where,
      include: {
        customerTags: {
          include: {
            tag: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        lifetimeValue: 'desc',
      },
    });

    // Get total count
    const total = await prisma.customer.count({ where });

    return NextResponse.json({
      customers,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Segments API] GET customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment customers' },
      { status: 500 }
    );
  }
}
