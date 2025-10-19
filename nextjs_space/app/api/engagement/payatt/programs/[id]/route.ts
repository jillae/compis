
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const program = await prisma.loyaltyProgram.findUnique({
      where: { id },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Get program error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verify ownership
    const existingProgram = await prisma.loyaltyProgram.findUnique({
      where: { id },
    });

    if (!existingProgram || existingProgram.clinicId !== session.user.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const program = await prisma.loyaltyProgram.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        redeemRule: body.redeemRule,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    console.error('Update program error:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
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

    const { id } = params;

    // Verify ownership
    const existingProgram = await prisma.loyaltyProgram.findUnique({
      where: { id },
    });

    if (!existingProgram || existingProgram.clinicId !== session.user.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.loyaltyProgram.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete program error:', error);
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}
