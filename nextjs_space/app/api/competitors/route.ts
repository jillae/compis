
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

    const competitors = await prisma.competitorProfile.findMany({
      where: { clinicId: user.clinicId },
      include: {
        priceSnapshots: {
          orderBy: { snapshotDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
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
    const { name, description, website, location, category, tier, services } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    const competitor = await prisma.competitorProfile.create({
      data: {
        clinicId: user.clinicId,
        name,
        description,
        website,
        location,
        category,
        tier,
        services: services || [],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Competitor added successfully',
      competitor,
    });
  } catch (error) {
    console.error('Error creating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to create competitor' },
      { status: 500 }
    );
  }
}
