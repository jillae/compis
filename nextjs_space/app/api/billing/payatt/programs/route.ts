
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List all loyalty programs for clinic
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const programs = await prisma.loyaltyProgram.findMany({
      where: {
        clinicId: session.user.clinicId!,
      },
      include: {
        _count: {
          select: {
            loyaltyCards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ programs });

  } catch (error) {
    console.error('Programs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST - Create new loyalty program
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      stampsRequired = 10,
      rewardDescription,
      rewardType = 'discount',
      rewardValue,
      backgroundColor = '#6366f1',
      isActive = true,
      isDraft = false,
    } = body;

    // Create earn rule (1 stamp per booking)
    const earnRule = {
      type: 'per_booking',
      value: 1,
      minSpend: 0,
    };

    // Create redeem rule
    const redeemRule = {
      [stampsRequired]: rewardDescription || `${rewardValue}% rabatt`,
    };

    const program = await prisma.loyaltyProgram.create({
      data: {
        name,
        description,
        earnRule,
        redeemRule,
        backgroundColor,
        isActive,
        isDraft,
        clinicId: session.user.clinicId!,
      },
    });

    return NextResponse.json({ program });

  } catch (error) {
    console.error('Program creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}
