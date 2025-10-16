
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: {
        dynamicPricingEnabled: true,
        dynamicPricingMinPercent: true,
        dynamicPricingMaxPercent: true,
        dynamicPricingLastToggled: true,
      },
    });

    return NextResponse.json({ settings: clinic });
  } catch (error) {
    console.error('Error fetching dynamic pricing settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { minPercent, maxPercent } = body;

    if (minPercent < 0 || minPercent > 50) {
      return NextResponse.json(
        { error: 'Min percent must be between 0 and 50' },
        { status: 400 }
      );
    }

    if (maxPercent < 0 || maxPercent > 100) {
      return NextResponse.json(
        { error: 'Max percent must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (minPercent >= maxPercent) {
      return NextResponse.json(
        { error: 'Min percent must be less than max percent' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    const updated = await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        dynamicPricingMinPercent: minPercent,
        dynamicPricingMaxPercent: maxPercent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Price range updated successfully',
      settings: {
        dynamicPricingMinPercent: updated.dynamicPricingMinPercent,
        dynamicPricingMaxPercent: updated.dynamicPricingMaxPercent,
      },
    });
  } catch (error) {
    console.error('Error updating dynamic pricing settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
