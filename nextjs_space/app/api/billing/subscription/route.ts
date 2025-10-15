
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculatePeriodEnd, calculateTrialEndDate, getTierPrice } from '@/lib/billing';
import { SubscriptionTier } from '@prisma/client';

// GET - Fetch current subscription
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        clinic: {
          include: {
            subscription: {
              include: {
                invoices: {
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                },
                billingAlerts: {
                  where: { resolved: false },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.clinic) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscription: user.clinic.subscription,
      clinic: {
        tier: user.clinic.tier,
        subscriptionStatus: user.clinic.subscriptionStatus,
        trialEndsAt: user.clinic.trialEndsAt,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// POST - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, paymentMethod } = body;

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    const now = new Date();
    const trialStart = now;
    const trialEnd = calculateTrialEndDate();
    const periodStart = now;
    const periodEnd = calculatePeriodEnd(now);
    const monthlyPrice = getTierPrice(tier);

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { clinicId: user.clinic.id },
      create: {
        clinicId: user.clinic.id,
        tier,
        status: 'TRIAL',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        trialStart,
        trialEnd,
        monthlyPrice,
        currency: 'SEK',
      },
      update: {
        tier,
        monthlyPrice,
        updatedAt: now,
      },
    });

    // Update clinic tier
    await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: {
        tier,
        subscriptionStatus: 'TRIAL',
        trialEndsAt: trialEnd,
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: { include: { subscription: true } } },
    });

    if (!user?.clinic?.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const now = new Date();

    // Cancel subscription at period end
    await prisma.subscription.update({
      where: { id: user.clinic.subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelledAt: now,
      },
    });

    // Create billing alert
    await prisma.billingAlert.create({
      data: {
        clinicId: user.clinic.id,
        subscriptionId: user.clinic.subscription.id,
        type: 'SUBSCRIPTION_CANCELLED',
        severity: 'WARNING',
        message: `Prenumeration avslutad. Tillgång fortsätter till ${user.clinic.subscription.currentPeriodEnd.toLocaleDateString('sv-SE')}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at period end',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
