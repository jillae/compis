

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { predictNoShowRiskBatch, calculateExpectedLoss } from '@/lib/no-show-predictor';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.clinicId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysAhead = parseInt(searchParams.get('days') || '7');

  try {
    // Get upcoming bookings
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const bookings = await prisma.booking.findMany({
      where: {
        clinicId: session.user.clinicId,
        scheduledTime: {
          gte: now,
          lte: futureDate,
        },
        status: 'CONFIRMED',
      },
      include: {
        customer: true,
        service: true,
        staff: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    });

    // Predict no-show risk for all bookings
    const predictions = predictNoShowRiskBatch(bookings);

    // Calculate expected loss
    const expectedLoss = calculateExpectedLoss(predictions, bookings);

    // Group by risk level
    const highRiskCount = predictions.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
    const mediumRiskCount = predictions.filter((p) => p.riskLevel === 'MEDIUM').length;
    const lowRiskCount = predictions.filter((p) => p.riskLevel === 'LOW').length;

    // Combine predictions with booking data
    const bookingsWithRisk = bookings.map((booking) => {
      const prediction = predictions.find((p) => p.bookingId === booking.id);
      return {
        id: booking.id,
        scheduledAt: booking.scheduledTime,
        customer: {
          firstName: booking.customer.firstName,
          lastName: booking.customer.lastName,
          phone: booking.customer.phone,
          email: booking.customer.email,
        },
        service: {
          name: booking.service?.name || 'Unknown',
        },
        staff: {
          name: booking.staff?.name || 'Unknown',
        },
        price: booking.price,
        prediction,
      };
    });

    return NextResponse.json({
      summary: {
        totalBookings: bookings.length,
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        lowRisk: lowRiskCount,
        expectedLoss: Math.round(expectedLoss),
      },
      bookings: bookingsWithRisk,
    });
  } catch (error: any) {
    console.error('Error predicting no-show risk:', error);
    return NextResponse.json(
      { error: 'Failed to predict no-show risk', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
