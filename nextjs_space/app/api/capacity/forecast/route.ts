
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addDays, addWeeks } from 'date-fns';
import { calculateCapacityForecast } from '@/lib/capacity-forecaster';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const weeksAhead = parseInt(searchParams.get('weeks') || '4');

    // Get future bookings
    const today = new Date();
    const futureDate = addWeeks(today, weeksAhead);

    const [bookings, staff, services, completedBookings] = await Promise.all([
      // Future bookings
      prisma.booking.findMany({
        where: {
          clinicId: session.user.clinicId,
          scheduledTime: {
            gte: today,
            lte: futureDate,
          },
          status: {
            in: ['CONFIRMED', 'SCHEDULED'],
          },
        },
        orderBy: {
          scheduledTime: 'asc',
        },
      }),
      // Staff
      prisma.staff.findMany({
        where: {
          clinicId: session.user.clinicId,
          isActive: true,
        },
      }),
      // Services
      prisma.service.findMany({
        where: {
          clinicId: session.user.clinicId,
        },
      }),
      // Historical completed bookings for no-show rate calculation
      prisma.booking.findMany({
        where: {
          clinicId: session.user.clinicId,
          scheduledTime: {
            gte: addDays(today, -90),
            lt: today,
          },
          status: {
            in: ['COMPLETED', 'NO_SHOW'],
          },
        },
        select: {
          status: true,
        },
      }),
    ]);

    // Calculate historical no-show rate
    const totalHistorical = completedBookings.length;
    const noShows = completedBookings.filter((b) => b.status === 'NO_SHOW').length;
    const noShowRate = totalHistorical > 0 ? noShows / totalHistorical : 0.08;

    // Calculate forecast
    const forecast = await calculateCapacityForecast(
      bookings,
      staff,
      services,
      weeksAhead,
      noShowRate
    );

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Error calculating capacity forecast:', error);
    return NextResponse.json(
      { error: 'Failed to calculate capacity forecast' },
      { status: 500 }
    );
  }
}
