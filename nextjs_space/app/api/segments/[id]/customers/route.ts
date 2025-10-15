
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
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

    // Get customers from segment filters
    const filters = segment.filters as any;
    const tagNames = filters?.tags || [];

    const customers = await prisma.customer.findMany({
      where: {
        clinicId: session.user.clinicId,
        tags: {
          hasSome: tagNames,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        tags: true,
      },
    });

    // Transform to include tag objects
    const tagObjects = await prisma.tag.findMany({
      where: {
        clinicId: session.user.clinicId,
        name: {
          in: tagNames,
        },
      },
    });

    const customersWithTagObjects = customers.map(customer => ({
      ...customer,
      tags: customer.tags.map(tagName => ({
        tag: tagObjects.find(t => t.name === tagName) || { id: '', name: tagName, color: 'gray' },
      })),
    }));

    return NextResponse.json(customersWithTagObjects);
  } catch (error) {
    console.error('Error fetching segment customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
