
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/newsletters/[id] - Get a specific newsletter
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newsletter = await prisma.newsletter.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
      include: {
        segment: true,
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('[Newsletters API] GET [id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter' },
      { status: 500 }
    );
  }
}

// PUT /api/newsletters/[id] - Update a newsletter
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

    // Check if newsletter exists
    const existing = await prisma.newsletter.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Can't edit sent newsletters
    if (existing.status === 'SENT' || existing.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Cannot edit sent or sending newsletters' },
        { status: 400 }
      );
    }

    const newsletter = await prisma.newsletter.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('[Newsletters API] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update newsletter' },
      { status: 500 }
    );
  }
}

// DELETE /api/newsletters/[id] - Delete a newsletter
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if newsletter exists
    const existing = await prisma.newsletter.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    // Can't delete sent newsletters
    if (existing.status === 'SENT' || existing.status === 'SENDING') {
      return NextResponse.json(
        { error: 'Cannot delete sent or sending newsletters' },
        { status: 400 }
      );
    }

    await prisma.newsletter.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Newsletters API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete newsletter' },
      { status: 500 }
    );
  }
}
