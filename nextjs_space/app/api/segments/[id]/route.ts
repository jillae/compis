
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/segments/[id] - Get a specific segment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error('[Segments API] GET [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment' },
      { status: 500 }
    );
  }
}

// PUT /api/segments/[id] - Update a segment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, filters, isActive } = body;

    // Check if segment exists
    const existing = await prisma.customerSegment.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Recalculate if filters changed
    let customerCount = existing.customerCount;
    let totalValue = existing.totalValue;

    if (filters) {
      // TODO: Implement recalculation logic
      customerCount = 0;
      totalValue = new Prisma.Decimal(0);
    }

    const segment = await prisma.customerSegment.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters, customerCount, totalValue, lastCalculatedAt: new Date() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error('[Segments API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update segment' },
      { status: 500 }
    );
  }
}

// DELETE /api/segments/[id] - Delete a segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if segment exists
    const existing = await prisma.customerSegment.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    await prisma.customerSegment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Segments API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete segment' },
      { status: 500 }
    );
  }
}
