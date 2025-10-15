
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

    const segments = await prisma.customerSegment.findMany({
      where: {
        clinicId: session.user.clinicId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get tags for each segment from filters
    const segmentsWithTags = await Promise.all(
      segments.map(async (segment) => {
        const filters = segment.filters as any;
        const tagNames = filters?.tags || [];
        
        // Fetch tag objects
        const tags = await prisma.tag.findMany({
          where: {
            clinicId: session.user.clinicId,
            name: {
              in: tagNames,
            },
          },
          select: {
            id: true,
            name: true,
            color: true,
          },
        });

        return {
          id: segment.id,
          name: segment.name,
          description: segment.description,
          tags,
          _count: {
            customers: segment.customerCount,
          },
          createdAt: segment.createdAt,
        };
      })
    );

    return NextResponse.json(segmentsWithTags);
  } catch (error) {
    console.error('Error fetching segments:', error);
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
    const { name, description, tagIds } = body;

    if (!name || !tagIds || tagIds.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one tag are required' },
        { status: 400 }
      );
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

    // Create segment with JSON filters
    const segment = await prisma.customerSegment.create({
      data: {
        name,
        description,
        clinicId: session.user.clinicId,
        filters: {
          tags: tagNames,
        },
        customerCount: customersWithTags.length,
      },
    });

    // Transform response
    const transformedSegment = {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      tags,
      _count: {
        customers: customersWithTags.length,
      },
      createdAt: segment.createdAt,
    };

    return NextResponse.json(transformedSegment);
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
