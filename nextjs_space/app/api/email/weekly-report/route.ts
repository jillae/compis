
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendWeeklyReport } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { clinic: true }
    });

    if (!user || !user.clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    // Calculate week range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const weekRange = `${startDate.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short' 
    })} - ${endDate.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    })}`;

    // Calculate previous week for comparison
    const prevWeekStart = new Date(startDate);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(startDate);

    // Fetch current week metrics
    const currentWeekBookings = await prisma.booking.findMany({
      where: {
        clinicId: user.clinicId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Fetch previous week metrics for comparison
    const prevWeekBookings = await prisma.booking.findMany({
      where: {
        clinicId: user.clinicId,
        startTime: {
          gte: prevWeekStart,
          lte: prevWeekEnd
        }
      }
    });

    const currentMetrics = {
      total: currentWeekBookings.length,
      completed: currentWeekBookings.filter(b => b.status === 'COMPLETED').length,
      revenue: currentWeekBookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0),
      noShows: currentWeekBookings.filter(b => b.status === 'NO_SHOW').length
    };

    const prevMetrics = {
      total: prevWeekBookings.length,
      revenue: prevWeekBookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0)
    };

    // Calculate week-over-week changes
    const bookingsChange = prevMetrics.total > 0 
      ? Math.round(((currentMetrics.total - prevMetrics.total) / prevMetrics.total) * 100)
      : 0;
    
    const revenueChange = prevMetrics.revenue > 0
      ? Math.round(((currentMetrics.revenue - prevMetrics.revenue) / prevMetrics.revenue) * 100)
      : 0;

    // Fetch AI insights (last 3)
    const insightsResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/dashboard/ai-insights?days=7`,
      { headers: { 'Cookie': request.headers.get('cookie') || '' } }
    );
    
    let insights: any[] = [];
    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      if (insightsData.success && insightsData.data) {
        insights = Object.values(insightsData.data).slice(0, 3).map((insight: any) => ({
          title: insight.title,
          description: insight.description,
          impact: insight.impact > 0 ? `Potential: +${Math.round(insight.impact).toLocaleString('sv-SE')} kr/månad` : undefined
        }));
      }
    }

    const reportData = {
      clinicName: user.clinic.name,
      weekRange,
      metrics: {
        totalBookings: currentMetrics.total,
        completedBookings: currentMetrics.completed,
        totalRevenue: currentMetrics.revenue,
        noShowRate: currentMetrics.total > 0 
          ? ((currentMetrics.noShows / currentMetrics.total) * 100).toFixed(1)
          : '0.0',
        completionRate: currentMetrics.total > 0
          ? ((currentMetrics.completed / currentMetrics.total) * 100).toFixed(1)
          : '0.0',
        weekOverWeekChange: {
          bookings: bookingsChange,
          revenue: revenueChange
        }
      },
      insights,
      dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
    };

    const result = await sendWeeklyReport(session.user.email, reportData);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Veckorapport skickad!',
        data: reportData
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send email' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending weekly report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET endpoint to manually trigger weekly report for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
