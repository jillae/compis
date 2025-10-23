
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const competitorId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Verify competitor belongs to clinic
    const competitor = await prisma.competitorProfile.findFirst({
      where: { 
        id: competitorId,
        clinicId: user.clinicId,
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    // Update competitor
    const updated = await prisma.competitorProfile.update({
      where: { id: competitorId },
      data: {
        ...body,
        lastCheckedAt: body.isMonitoring !== undefined && body.isMonitoring 
          ? new Date() 
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Competitor updated successfully',
      competitor: updated,
    });
  } catch (error) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: 'Failed to update competitor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const competitorId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Verify competitor belongs to clinic
    const competitor = await prisma.competitorProfile.findFirst({
      where: { 
        id: competitorId,
        clinicId: user.clinicId,
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    // Delete competitor (will cascade to price snapshots)
    await prisma.competitorProfile.delete({
      where: { id: competitorId },
    });

    return NextResponse.json({
      success: true,
      message: 'Competitor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}
