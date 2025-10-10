
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.id;

    // Get all leaves for this staff member
    const leaves = await prisma.staffLeave.findMany({
      where: {
        staffId
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: leaves 
    });

  } catch (error: any) {
    console.error('Error fetching staff leaves:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaves' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = params.id;
    const { startDate, endDate, leaveType, reason } = await req.json();

    if (!startDate || !endDate || !leaveType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create leave record
    const leave = await prisma.staffLeave.create({
      data: {
        staffId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        leaveType,
        reason,
        status: 'APPROVED' // Auto-approve for now
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: leave 
    });

  } catch (error: any) {
    console.error('Error creating staff leave:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create leave' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leaveId = searchParams.get('leaveId');

    if (!leaveId) {
      return NextResponse.json({ error: 'Missing leaveId' }, { status: 400 });
    }

    // Delete leave record
    await prisma.staffLeave.delete({
      where: { id: leaveId }
    });

    return NextResponse.json({ 
      success: true 
    });

  } catch (error: any) {
    console.error('Error deleting staff leave:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete leave' },
      { status: 500 }
    );
  }
}
