
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/tags - List all tags for a clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const tags = await prisma.tag.findMany({
      where: {
        clinicId: session.user.clinicId,
        ...(! includeInactive && { isActive: true }),
      },
      include: {
        customerTags: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate actual customer count
    const tagsWithCount = tags.map(tag => ({
      ...tag,
      customerCount: tag.customerTags.length,
      customerTags: undefined, // Remove from response
    }));

    return NextResponse.json(tagsWithCount);
  } catch (error) {
    console.error('[Tags API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon, isAutoTag, autoTagRule } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if tag already exists
    const existing = await prisma.tag.findUnique({
      where: {
        clinicId_name: {
          clinicId: session.user.clinicId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        clinicId: session.user.clinicId,
        name,
        description,
        color,
        icon,
        isAutoTag: isAutoTag || false,
        autoTagRule,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('[Tags API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
