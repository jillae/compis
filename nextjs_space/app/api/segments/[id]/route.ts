
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
    const { name, description, tagIds } = body;

    // Verify segment belongs to clinic
    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Get tag names from IDs
    const tags = await prisma.tag.findMany({
      where: {
        id: {
          in: tagIds,
        },
        clinicId: session.user.clinicId,
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const tagNames = tags.map(t => t.name);

    // Find all customers with any of these tags
    const customersWithTags = await prisma.customer.findMany({
      where: {
        clinicId: session.user.clinicId,
        tags: {
          hasSome: tagNames,
        },
      },
      select: {
        id: true,
      },
    });

    // Update segment
    const updatedSegment = await prisma.customerSegment.update({
      where: { id: params.id },
      data: {
        name,
        description,
        filters: {
          tags: tagNames,
        },
        customerCount: customersWithTags.length,
      },
    });

    const transformedSegment = {
      id: updatedSegment.id,
      name: updatedSegment.name,
      description: updatedSegment.description,
      tags,
      _count: {
        customers: customersWithTags.length,
      },
      createdAt: updatedSegment.createdAt,
    };

    return NextResponse.json(transformedSegment);
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify segment belongs to clinic
    const segment = await prisma.customerSegment.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Delete segment
    await prisma.customerSegment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
