
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get single loyalty program
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const program = await prisma.loyaltyProgram.findUnique({
      where: {
        id: params.id,
        clinicId: session.user.clinicId!,
      },
      include: {
        _count: {
          select: {
            loyaltyCards: true,
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({ program });

  } catch (error) {
    console.error('Program fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PATCH - Update loyalty program
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      stampsRequired,
      rewardDescription,
      backgroundColor,
      isActive,
      isDraft,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDraft !== undefined) updateData.isDraft = isDraft;

    if (stampsRequired !== undefined || rewardDescription !== undefined) {
      const currentProgram = await prisma.loyaltyProgram.findUnique({
        where: { id: params.id },
      });

      if (currentProgram) {
        const redeemRule = currentProgram.redeemRule as any;
        const newStampsRequired = stampsRequired || Object.keys(redeemRule)[0];
        const newRewardDescription = rewardDescription || redeemRule[newStampsRequired];

        updateData.redeemRule = {
          [newStampsRequired]: newRewardDescription,
        };
      }
    }

    const program = await prisma.loyaltyProgram.update({
      where: {
        id: params.id,
        clinicId: session.user.clinicId!,
      },
      data: updateData,
    });

    return NextResponse.json({ program });

  } catch (error) {
    console.error('Program update error:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE - Delete loyalty program
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if program has active cards
    const activeCards = await prisma.loyaltyCard.count({
      where: {
        programId: params.id,
        isActive: true,
      },
    });

    if (activeCards > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program with active cards. Deactivate it instead.' },
        { status: 400 }
      );
    }

    await prisma.loyaltyProgram.delete({
      where: {
        id: params.id,
        clinicId: session.user.clinicId!,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Program deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}
