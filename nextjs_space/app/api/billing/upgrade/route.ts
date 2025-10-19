
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTierPrice } from '@/lib/billing';
import { SubscriptionTier } from '@prisma/client';

// POST - Upgrade/downgrade subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newTier, billingInterval = 'MONTHLY' } = body;

    if (!newTier || !Object.values(SubscriptionTier).includes(newTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Validate billingInterval
    if (!['MONTHLY', 'YEARLY'].includes(billingInterval)) {
      return NextResponse.json({ error: 'Invalid billing interval' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: { include: { subscription: true } } },
    });

    if (!user?.clinic?.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const currentTier = user.clinic.subscription.tier;
    const newPrice = getTierPrice(newTier, billingInterval as 'MONTHLY' | 'YEARLY');

    // Update subscription tier
    const updatedSubscription = await prisma.subscription.update({
      where: { id: user.clinic.subscription.id },
      data: {
        tier: newTier,
        monthlyPrice: newPrice,
        billingInterval: billingInterval as 'MONTHLY' | 'YEARLY',
        status: 'ACTIVE', // Activate if upgrading from trial
      },
    });

    // Update clinic tier
    await prisma.clinic.update({
      where: { id: user.clinic.id },
      data: {
        tier: newTier,
        subscriptionStatus: 'ACTIVE',
      },
    });

    const isUpgrade = getTierPrice(newTier) > getTierPrice(currentTier);
    const action = isUpgrade ? 'uppgraderad' : 'nedgraderad';

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: `Prenumeration ${action} till ${newTier}`,
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
