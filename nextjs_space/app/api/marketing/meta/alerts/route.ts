
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MetaMarketingService } from '@/lib/meta-marketing';
import { prisma } from '@/lib/db';

/**
 * GET /api/marketing/meta/alerts
 * 
 * Returns proactive META advertising alerts
 * This endpoint analyzes:
 * - Current ad spend vs historical patterns
 * - Lead quality and conversion rates
 * - Booking lag and its impact on future calendar
 * - Creative fatigue and ROAS trends
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Check if META credentials are configured
    const metaAccessToken = process.env.META_ACCESS_TOKEN;
    const metaAdAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!metaAccessToken || !metaAdAccountId) {
      return NextResponse.json({
        success: false,
        error: 'META Marketing API not configured',
        setupRequired: true,
        setupInstructions: {
          message: 'För att aktivera META-integrationen, konfigurera följande i dina miljövariabler:',
          required: [
            'META_ACCESS_TOKEN - Din META Marketing API access token',
            'META_AD_ACCOUNT_ID - Ditt META ad account ID'
          ],
          guide: 'https://developers.facebook.com/docs/marketing-api/get-started'
        }
      }, { status: 200 });
    }

    // Initialize META service
    const metaService = new MetaMarketingService(metaAccessToken, metaAdAccountId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Fetch current and historical metrics
    const [currentMetrics, historicalMetrics] = await Promise.all([
      metaService.getCampaignMetrics(
        formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        formatDate(endDate)
      ),
      metaService.getCampaignMetrics(
        formatDate(startDate),
        formatDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000))
      )
    ]);

    // Fetch booking data to calculate lag
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledTime: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      select: {
        scheduledTime: true
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    // Group bookings by date
    const bookingsByDate = new Map<string, number>();
    bookings.forEach(b => {
      const dateKey = b.scheduledTime.toISOString().split('T')[0];
      bookingsByDate.set(dateKey, (bookingsByDate.get(dateKey) || 0) + 1);
    });

    const bookingData = Array.from(bookingsByDate.entries()).map(([date, count]) => ({
      date,
      count
    }));

    // Analyze booking lag
    const bookingLag = await metaService.analyzeBookingLag(historicalMetrics, bookingData);

    // Get upcoming bookings for impact prediction
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + bookingLag + 14);
    
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        scheduledTime: {
          gte: endDate,
          lte: futureDate
        }
      },
      select: {
        scheduledTime: true
      },
      orderBy: {
        scheduledTime: 'asc'
      }
    });

    // Group upcoming bookings by date
    const upcomingByDate = new Map<string, number>();
    upcomingBookings.forEach(b => {
      const dateKey = b.scheduledTime.toISOString().split('T')[0];
      upcomingByDate.set(dateKey, (upcomingByDate.get(dateKey) || 0) + 1);
    });

    const upcomingBookingData = Array.from(upcomingByDate.entries()).map(([date, count]) => ({
      date,
      count
    }));

    // Generate proactive alerts
    const alerts = await metaService.generateProactiveAlerts(
      currentMetrics,
      historicalMetrics,
      bookingLag,
      upcomingBookingData
    );

    // Calculate budget recommendation
    const avgBookingsPerDay = bookingData.reduce((sum, b) => sum + b.count, 0) / bookingData.length;
    const targetBookings = Math.ceil(avgBookingsPerDay * 1.1); // 10% growth target
    const historicalCostPerBooking = 
      currentMetrics.reduce((sum, m) => sum + m.spend, 0) / 
      bookingData.reduce((sum, b) => sum + b.count, 0);

    const budgetRecommendation = await metaService.recommendBudgetOptimization(
      currentMetrics,
      targetBookings,
      historicalCostPerBooking
    );

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        bookingLag: {
          days: bookingLag,
          description: `Det tar i genomsnitt ${bookingLag} dagar från att någon ser din annons till att de bokar`
        },
        budgetRecommendation,
        metrics: {
          current: {
            totalSpend: currentMetrics.reduce((sum, m) => sum + m.spend, 0),
            avgROAS: currentMetrics.reduce((sum, m) => sum + m.roas, 0) / currentMetrics.length,
            totalConversions: currentMetrics.reduce((sum, m) => sum + m.conversions, 0)
          },
          historical: {
            totalSpend: historicalMetrics.reduce((sum, m) => sum + m.spend, 0),
            avgROAS: historicalMetrics.reduce((sum, m) => sum + m.roas, 0) / historicalMetrics.length,
            totalConversions: historicalMetrics.reduce((sum, m) => sum + m.conversions, 0)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching META alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch META alerts' 
      },
      { status: 500 }
    );
  }
}
