
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch invoices
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinic) {
      return NextResponse.json({ error: 'No clinic found' }, { status: 404 });
    }

    const invoices = await prisma.invoice.findMany({
      where: { clinicId: user.clinic.id },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
