
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/customers/tags?customerId=xxx - Get tags for a customer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    const customerTags = await prisma.customerTag.findMany({
      where: {
        customerId,
      },
      include: {
        tag: true,
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    return NextResponse.json(customerTags);
  } catch (error) {
    console.error('[Customer Tags API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer tags' },
      { status: 500 }
    );
  }
}

// POST /api/customers/tags - Apply tag to customer(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerIds, tagId, source = 'MANUAL' } = body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'customerIds array is required' },
        { status: 400 }
      );
    }

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      );
    }

    // Verify tag belongs to clinic
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        clinicId: session.user.clinicId,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Apply tags (upsert to handle existing tags)
    const results = await Promise.all(
      customerIds.map(async (customerId) => {
        try {
          return await prisma.customerTag.upsert({
            where: {
              customerId_tagId: {
                customerId,
                tagId,
              },
            },
            create: {
              customerId,
              tagId,
              source,
              appliedBy: session.user.id,
            },
            update: {
              // Just update the timestamp
              appliedAt: new Date(),
              appliedBy: session.user.id,
            },
          });
        } catch (error) {
          console.error(`Failed to tag customer ${customerId}:`, error);
          return null;
        }
      })
    );

    const successCount = results.filter((r) => r !== null).length;

    // Update tag customer count
    const count = await prisma.customerTag.count({
      where: { tagId },
    });

    await prisma.tag.update({
      where: { id: tagId },
      data: { customerCount: count },
    });

    return NextResponse.json({
      success: true,
      applied: successCount,
      failed: customerIds.length - successCount,
    });
  } catch (error) {
    console.error('[Customer Tags API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to apply tags' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/tags - Remove tag from customer(s)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerIds, tagId } = body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { error: 'customerIds array is required' },
        { status: 400 }
      );
    }

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId is required' },
        { status: 400 }
      );
    }

    // Delete tags
    const result = await prisma.customerTag.deleteMany({
      where: {
        customerId: {
          in: customerIds,
        },
        tagId,
      },
    });

    // Update tag customer count
    const count = await prisma.customerTag.count({
      where: { tagId },
    });

    await prisma.tag.update({
      where: { id: tagId },
      data: { customerCount: count },
    });

    return NextResponse.json({
      success: true,
      removed: result.count,
    });
  } catch (error) {
    console.error('[Customer Tags API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to remove tags' },
      { status: 500 }
    );
  }
}
