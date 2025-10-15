
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Update action status (mark as completed or dismissed)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, steps, dismissReason } = await req.json();
    const actionId = params.id;

    // Get action and verify ownership
    const action = await prisma.weeklyAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Verify user has access to this clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.clinicId !== action.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update action
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (steps) updateData.steps = steps;
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status === 'DISMISSED') {
      updateData.dismissedAt = new Date();
      if (dismissReason) updateData.dismissReason = dismissReason;
    }

    const updatedAction = await prisma.weeklyAction.update({
      where: { id: actionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      action: updatedAction,
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// Delete action
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actionId = params.id;

    // Get action and verify ownership
    const action = await prisma.weeklyAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Verify user has access to this clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.clinicId !== action.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete action
    await prisma.weeklyAction.delete({
      where: { id: actionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Action deleted',
    });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
