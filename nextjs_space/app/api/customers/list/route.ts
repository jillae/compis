/**
 * Customer List API — Paginated, Searchable, Filterable
 * 
 * GET /api/customers/list?page=1&limit=20&search=Anna&status=HEALTHY&sort=lastVisitAt&order=desc
 * 
 * Query params:
 *   page: number (default 1)
 *   limit: number (default 20, max 100)
 *   search: string (searches name, email, phone)
 *   status: HealthStatus filter (CRITICAL, AT_RISK, HEALTHY, EXCELLENT)
 *   tag: string (filter by tag)
 *   sort: field to sort by (name, lastVisitAt, totalSpent, healthScore, totalBookings)
 *   order: asc | desc (default desc)
 *   active: boolean (default true)
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthSession, getClinicFilter, unauthorizedResponse, errorResponse } from '@/lib/multi-tenant-security';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const clinicFilter = getClinicFilter(session);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || '';
    const tag = searchParams.get('tag') || '';
    const sort = searchParams.get('sort') || 'lastVisitAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const active = searchParams.get('active') !== 'false';

    // Build where clause
    const where: any = {
      ...clinicFilter,
      isActive: active,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Health status filter
    if (status && ['CRITICAL', 'AT_RISK', 'HEALTHY', 'EXCELLENT'].includes(status)) {
      where.healthStatus = status;
    }

    // Tag filter
    if (tag) {
      where.tags = { has: tag };
    }

    // Build sort
    const validSortFields = ['name', 'lastVisitAt', 'totalSpent', 'healthScore', 'totalBookings', 'lifetimeValue', 'createdAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'lastVisitAt';
    const orderBy: any = { [sortField]: order };

    // Execute query with count
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          tags: true,
          city: true,
          totalBookings: true,
          noShowCount: true,
          totalSpent: true,
          lifetimeValue: true,
          healthScore: true,
          healthStatus: true,
          churnRisk: true,
          churnScore: true,
          totalVisits: true,
          firstVisitAt: true,
          lastVisitAt: true,
          averageSpend: true,
          consentSms: true,
          consentEmail: true,
          consentMarketing: true,
          isActive: true,
          source: true,
          isCompany: true,
          companyName: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    // Get aggregate stats for this clinic
    const statsWhere = { ...clinicFilter, isActive: active };
    const [
      totalCustomers,
      activeCustomers,
      healthCounts,
      revenueAgg,
      avgHealthScore,
    ] = await Promise.all([
      prisma.customer.count({ where: { ...clinicFilter } }),
      prisma.customer.count({ where: statsWhere }),
      prisma.customer.groupBy({
        by: ['healthStatus'],
        where: statsWhere,
        _count: { id: true },
      }),
      prisma.customer.aggregate({
        where: statsWhere,
        _sum: { lifetimeValue: true, totalSpent: true },
        _avg: { lifetimeValue: true, averageSpend: true, totalBookings: true },
      }),
      prisma.customer.aggregate({
        where: { ...statsWhere, healthScore: { not: null } },
        _avg: { healthScore: true },
      }),
    ]);

    // Build health distribution
    const healthDistribution: Record<string, number> = {
      EXCELLENT: 0,
      HEALTHY: 0,
      AT_RISK: 0,
      CRITICAL: 0,
    };
    for (const h of healthCounts) {
      if (h.healthStatus) {
        healthDistribution[h.healthStatus] = h._count.id;
      }
    }

    // Get unique tags for filter options
    const allTags = await prisma.customer.findMany({
      where: { ...clinicFilter, isActive: true },
      select: { tags: true },
      distinct: ['tags'],
    });
    const uniqueTags = [...new Set(allTags.flatMap(c => c.tags))].sort();

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
      stats: {
        totalCustomers,
        activeCustomers,
        healthDistribution,
        avgHealthScore: Math.round(avgHealthScore._avg.healthScore || 50),
        totalLifetimeValue: Number(revenueAgg._sum.lifetimeValue || 0),
        avgLifetimeValue: Math.round(Number(revenueAgg._avg.lifetimeValue || 0)),
        avgSpend: Math.round(Number(revenueAgg._avg.averageSpend || 0)),
        avgBookings: Math.round(Number(revenueAgg._avg.totalBookings || 0)),
      },
      filters: {
        availableTags: uniqueTags,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error, 'Failed to fetch customers');
  }
}
