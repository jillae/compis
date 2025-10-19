
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List all loyalty cards for clinic
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const programId = searchParams.get('programId');
    const isActive = searchParams.get('isActive');

    const where: any = {
      customer: {
        clinicId: session.user.clinicId!,
      },
    };

    if (customerId) where.customerId = customerId;
    if (programId) where.programId = programId;
    if (isActive !== null) where.isActive = isActive === 'true';

    const cards = await prisma.loyaltyCard.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        program: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ cards });

  } catch (error) {
    console.error('Cards fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    );
  }
}
