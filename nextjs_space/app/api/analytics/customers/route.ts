export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Customer Analytics API
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get customer metrics
    const [
      totalCustomers,
      newCustomers,
      returningCustomers,
      atRiskCustomers,
      customerLifetimeValue,
      repeatRate,
    ] = await Promise.all([
      // Total unique customers
      prisma.customer.count(),

      // New customers (first booking in period)
      prisma.customer.count({
        where: {
          bookings: {
            some: {
              bookedAt: { gte: startDate },
            },
          },
        },
      }),

      // Returning customers (multiple bookings)
      prisma.booking.groupBy({
        by: ['customerId'],
        where: {
          bookedAt: { gte: startDate },
          status: 'COMPLETED',
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

      // At-risk customers (no booking in last 30 days)
      prisma.customer.count({
        where: {
          bookings: {
            none: {
              bookedAt: { gte: startDate },
            },
          },
        },
      }),

      // Customer lifetime value (average revenue per customer)
      prisma.booking
        .aggregate({
          where: {
            status: 'COMPLETED',
          },
          _avg: {
            price: true,
          },
        })
        .then((result: any) => Number(result._avg.price) || 0),

      // Repeat rate
      prisma.booking
        .groupBy({
          by: ['customerId'],
          where: {
            status: 'COMPLETED',
          },
          _count: {
            customerId: true,
          },
        })
        .then((result: any) => {
          const returningCount = result.filter((r: any) => r._count.customerId > 1).length;
          const totalCount = result.length;
          return totalCount > 0 ? (returningCount / totalCount) * 100 : 0;
        }),
    ]);

    // Customer segmentation by booking frequency
    const customerSegmentation = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
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

    // Top customers by revenue
    const topCustomers = await prisma.booking.groupBy({
      by: ['customerId'],
      where: {
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

    // Get customer details
    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        const customerData = await prisma.customer.findUnique({
          where: { id: customer.customerId },
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

    // Churn analysis - customers who haven't booked in 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const churnedCustomers = await prisma.customer.count({
      where: {
        bookings: {
          every: {
            bookedAt: { lt: sixtyDaysAgo },
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
          returningCustomers,
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
