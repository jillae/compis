
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/newsletters - List all newsletters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const newsletters = await prisma.newsletter.findMany({
      where: {
        clinicId: session.user.clinicId,
        ...(status && { status: status as any }),
      },
      include: {
        segment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(newsletters);
  } catch (error) {
    console.error('[Newsletters API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    );
  }
}

// POST /api/newsletters - Create a new newsletter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      subject,
      contentHtml,
      contentText,
      contentSms,
      sendChannels,
      segmentId,
      tagFilters,
      scheduledAt,
      isAbTest,
      variantName,
      parentId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!sendChannels || sendChannels.length === 0) {
      return NextResponse.json(
        { error: 'At least one send channel is required' },
        { status: 400 }
      );
    }

    // Calculate recipient count based on segment/tags
    let recipientCount = 0;
    if (segmentId) {
      const segment = await prisma.customerSegment.findFirst({
        where: {
          id: segmentId,
          clinicId: session.user.clinicId,
        },
      });
      if (segment) {
        recipientCount = segment.customerCount;
      }
    } else if (tagFilters && tagFilters.length > 0) {
      // Count customers with these tags
      recipientCount = await prisma.customer.count({
        where: {
          clinicId: session.user.clinicId,
          customerTags: {
            some: {
              tag: {
                name: {
                  in: tagFilters,
                },
              },
            },
          },
        },
      });
    } else {
      // All customers
      recipientCount = await prisma.customer.count({
        where: {
          clinicId: session.user.clinicId,
        },
      });
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        clinicId: session.user.clinicId,
        name,
        description,
        subject,
        contentHtml,
        contentText,
        contentSms,
        sendChannels,
        segmentId,
        tagFilters: tagFilters || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        isAbTest: isAbTest || false,
        variantName,
        parentId,
        recipientCount,
      },
    });

    return NextResponse.json(newsletter, { status: 201 });
  } catch (error) {
    console.error('[Newsletters API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    );
  }
}
