/**
 * Flow External API — Customer Insights for Marknadscentral
 * 
 * GET /api/external/customers?clinicId=xxx
 * 
 * Exposes customer segment data, health distribution, and marketing-relevant
 * metrics for Marknadscentral to display and use for campaign targeting.
 * 
 * Auth: X-FLOW-API-KEY header
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-FLOW-API-KEY, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-FLOW-API-KEY');
  const validKey = process.env.FLOW_EXTERNAL_API_KEY;
  if (!validKey || !apiKey) return false;
  return apiKey === validKey;
}

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');

    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'clinicId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const where = { clinicId, isActive: true };

    // Parallel queries for maximum performance
    const [
      totalCustomers,
      inactiveCustomers,
      healthCounts,
      consentCounts,
      revenueStats,
      topCustomers,
      recentCustomers,
      churnRiskCount,
      sourceCounts,
      monthlyGrowth,
    ] = await Promise.all([
      // Total active
      prisma.customer.count({ where }),
      // Inactive
      prisma.customer.count({ where: { clinicId, isActive: false } }),
      // Health distribution
      prisma.customer.groupBy({
        by: ['healthStatus'],
        where,
        _count: { id: true },
      }),
      // Marketing consent
      prisma.customer.aggregate({
        where,
        _sum: {
          // These are boolean but Prisma aggregate won't sum booleans,
          // so we'll count separately
        },
        _avg: { healthScore: true },
      }),
      // Revenue stats
      prisma.customer.aggregate({
        where,
        _sum: { lifetimeValue: true, totalSpent: true },
        _avg: { averageSpend: true, lifetimeValue: true, totalBookings: true },
        _max: { lifetimeValue: true },
      }),
      // Top 10 by lifetime value
      prisma.customer.findMany({
        where,
        orderBy: { lifetimeValue: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          lifetimeValue: true,
          totalBookings: true,
          healthStatus: true,
          lastVisitAt: true,
          tags: true,
        },
      }),
      // Last 30 days new customers
      prisma.customer.count({
        where: {
          ...where,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // High churn risk
      prisma.customer.count({
        where: {
          ...where,
          healthStatus: { in: ['CRITICAL', 'AT_RISK'] },
        },
      }),
      // Source distribution
      prisma.customer.groupBy({
        by: ['source'],
        where,
        _count: { id: true },
      }),
      // Monthly growth (last 6 months)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("createdAt", 'YYYY-MM') as month,
          COUNT(*)::int as new_customers
        FROM "Customer"
        WHERE "clinicId" = ${clinicId} AND "isActive" = true
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      ` as Promise<Array<{ month: string; new_customers: number }>>,
    ]);

    // Count consent types separately
    const [smsConsent, emailConsent, marketingConsent] = await Promise.all([
      prisma.customer.count({ where: { ...where, consentSms: true } }),
      prisma.customer.count({ where: { ...where, consentEmail: true } }),
      prisma.customer.count({ where: { ...where, consentMarketing: true } }),
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

    // Source distribution
    const sourceDistribution: Record<string, number> = {};
    for (const s of sourceCounts) {
      sourceDistribution[s.source] = s._count.id;
    }

    const response = {
      success: true,
      generatedAt: new Date().toISOString(),
      clinic: { id: clinic.id, name: clinic.name },
      summary: {
        totalActive: totalCustomers,
        totalInactive: inactiveCustomers,
        newLast30Days: recentCustomers,
        atRiskCount: churnRiskCount,
        avgHealthScore: Math.round(Number(consentCounts._avg.healthScore || 50)),
      },
      healthDistribution,
      consent: {
        sms: smsConsent,
        email: emailConsent,
        marketing: marketingConsent,
        smsRate: totalCustomers > 0 ? Math.round((smsConsent / totalCustomers) * 100) : 0,
        emailRate: totalCustomers > 0 ? Math.round((emailConsent / totalCustomers) * 100) : 0,
        marketingRate: totalCustomers > 0 ? Math.round((marketingConsent / totalCustomers) * 100) : 0,
      },
      revenue: {
        totalLifetimeValue: Math.round(Number(revenueStats._sum.lifetimeValue || 0)),
        avgLifetimeValue: Math.round(Number(revenueStats._avg.lifetimeValue || 0)),
        avgSpendPerVisit: Math.round(Number(revenueStats._avg.averageSpend || 0)),
        avgBookingsPerCustomer: Math.round(Number(revenueStats._avg.totalBookings || 0) * 10) / 10,
        topCustomerValue: Math.round(Number(revenueStats._max.lifetimeValue || 0)),
      },
      sourceDistribution,
      monthlyGrowth: monthlyGrowth || [],
      topCustomers: topCustomers.map(c => ({
        id: c.id,
        name: c.name || 'Okänd',
        lifetimeValue: Number(c.lifetimeValue),
        totalBookings: c.totalBookings,
        healthStatus: c.healthStatus,
        lastVisitAt: c.lastVisitAt?.toISOString() || null,
        tags: c.tags,
      })),
    };

    return NextResponse.json(response, { headers: corsHeaders });

  } catch (error) {
    console.error('[External Customers API]', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
