
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newsletters = await prisma.newsletter.findMany({
      where: {
        clinicId: session.user.clinicId,
      },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, content, segmentId, scheduledFor, status } = body;

    if (!subject || !content || !segmentId) {
      return NextResponse.json(
        { error: 'Subject, content, and segment are required' },
        { status: 400 }
      );
    }

    // Get segment to count recipients
    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: segmentId,
        clinicId: session.user.clinicId,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Create newsletter
    const newsletter = await prisma.newsletter.create({
      data: {
        name: subject,
        subject,
        contentHtml: content,
        contentText: content,
        status: status || 'DRAFT',
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        recipientCount: segment.customerCount,
        clinicId: session.user.clinicId,
        segmentId,
      },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error('Error creating newsletter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
