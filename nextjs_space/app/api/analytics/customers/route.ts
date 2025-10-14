export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Customer Analytics API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Get clinicId from session for multi-tenant isolation
    const clinicId = (session.user as any).clinicId;
    if (!clinicId) {
      return NextResponse.json(
        { success: false, error: 'No clinic associated with user' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get customer metrics - ALL FILTERED BY CLINICID
    const [
      totalCustomers,
      allCustomersWithFirstBooking,
      returningCustomersInPeriod,
      atRiskCustomers,
      customerLifetimeValue,
    ] = await Promise.all([
      // Total unique customers - FILTERED
      prisma.customer.count({
        where: { clinicId: clinicId }, // SECURITY: Multi-tenant isolation
      }),

      // Get all customers with their first booking date - FILTERED
      prisma.customer.findMany({
        where: { clinicId: clinicId }, // SECURITY: Multi-tenant isolation
        select: {
          id: true,
          bookings: {
            where: { clinicId: clinicId }, // SECURITY: Multi-tenant isolation
            select: {
              bookedAt: true,
            },
            orderBy: {
              bookedAt: 'asc',
            },
            take: 1,
          },
        },
      }),

      // Returning customers (multiple bookings in period) - FILTERED
      prisma.booking.groupBy({
        by: ['customerId'],
        where: {
          clinicId: clinicId, // SECURITY: Multi-tenant isolation
          bookedAt: { gte: startDate },
          status: { in: ['COMPLETED', 'completed'] },
        },
        having: {
          customerId: {
            _count: {
              gt: 1,
            },
          },
        },
        _count: {
          customerId: true,
        },
      }).then((result: any) => result.length),

      // At-risk customers (no booking in period) - FILTERED
      prisma.customer.count({
        where: {
          clinicId: clinicId, // SECURITY: Multi-tenant isolation
          bookings: {
            none: {
              bookedAt: { gte: startDate },
              clinicId: clinicId, // SECURITY: Multi-tenant isolation
            },
          },
        },
      }),

      // Customer lifetime value (average revenue per customer) - FILTERED
      prisma.booking
        .aggregate({
          where: {
            clinicId: clinicId, // SECURITY: Multi-tenant isolation
            status: { in: ['COMPLETED', 'completed'] },
          },
          _avg: {
            price: true,
          },
        })
        .then((result: any) => Number(result._avg.price) || 0),
    ]);

    // Count new customers (first ever booking in period)
    const newCustomers = allCustomersWithFirstBooking.filter(
      (customer) =>
        customer.bookings.length > 0 &&
        new Date(customer.bookings[0].bookedAt) >= startDate
    ).length;

    // Calculate repeat rate (customers with multiple bookings / total customers who booked in period) - FILTERED
    const customersWhoBookedInPeriod = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
        bookedAt: { gte: startDate },
        status: { in: ['COMPLETED', 'completed'] },
      },
      _count: {
        customerId: true,
      },
    });

    const totalCustomersInPeriod = customersWhoBookedInPeriod.length;
    const repeatRate = totalCustomersInPeriod > 0 
      ? (returningCustomersInPeriod / totalCustomersInPeriod) * 100 
      : 0;

    // Customer segmentation by booking frequency - FILTERED
    const customerSegmentation = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
        bookedAt: { gte: startDate },
        status: 'COMPLETED',
      },
      _count: {
        customerId: true,
      },
    });

    const segments = {
      oneTime: 0,
      occasional: 0, // 2-3 bookings
      regular: 0, // 4-6 bookings
      loyal: 0, // 7+ bookings
    };

    customerSegmentation.forEach((customer) => {
      const bookingCount = (customer._count as any).customerId || 0;
      if (bookingCount === 1) segments.oneTime++;
      else if (bookingCount <= 3) segments.occasional++;
      else if (bookingCount <= 6) segments.regular++;
      else segments.loyal++;
    });

    // Top customers by revenue - FILTERED
    const topCustomers = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
        bookedAt: { gte: startDate },
        status: 'COMPLETED',
      },
      _sum: {
        price: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 10,
    });

    // Get customer details - FILTERED
    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        const customerData = await prisma.customer.findUnique({
          where: { 
            id: customer.customerId,
            clinicId: clinicId, // SECURITY: Multi-tenant isolation
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        const totalRevenue = Number(customer._sum.price) || 0;
        return {
          ...customerData,
          totalRevenue,
          bookingCount: customer._count.id,
          averageBookingValue: totalRevenue / customer._count.id,
        };
      })
    );

    // Churn analysis - customers who haven't booked in 60 days - FILTERED
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const churnedCustomers = await prisma.customer.count({
      where: {
        clinicId: clinicId, // SECURITY: Multi-tenant isolation
        bookings: {
          every: {
            bookedAt: { lt: sixtyDaysAgo },
            clinicId: clinicId, // SECURITY: Multi-tenant isolation
          },
        },
      },
    });

    const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

    // Potential revenue from at-risk customers
    const potentialRevenue = atRiskCustomers * customerLifetimeValue;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          newCustomers,
          returningCustomers: returningCustomersInPeriod,
          atRiskCustomers,
          customerLifetimeValue: Math.round(customerLifetimeValue),
          repeatRate: Math.round(repeatRate * 10) / 10,
          churnRate: Math.round(churnRate * 10) / 10,
          churnedCustomers,
          potentialRevenue: Math.round(potentialRevenue),
        },
        segmentation: segments,
        topCustomers: topCustomersWithDetails,
      },
    });
  } catch (error) {
    console.error('[API /analytics/customers] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer analytics',
      },
      { status: 500 }
    );
  }
}
