
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateCustomerHealthScores, calculateCustomerHealthScore } from '@/lib/customer-health';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // If specific customer requested
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, clinicId: user.clinicId },
      });

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }

      const health = await calculateCustomerHealthScore(customerId);
      return NextResponse.json({ health });
    }

    // Get all customers with health scores
    const customers = await prisma.customer.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        healthScore: true,
        healthStatus: true,
        lastHealthCalculation: true,
        riskFactors: true,
        totalVisits: true,
        lifetimeValue: true,
      },
      orderBy: { healthScore: 'asc' }, // Show at-risk customers first
      take: 100,
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching customer health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer health' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated' }, { status: 400 });
    }

    // Update health scores for all customers
    const results = await updateCustomerHealthScores(user.clinicId);

    return NextResponse.json({
      success: true,
      message: `Updated health scores for ${results.length} customers`,
      results,
    });
  } catch (error) {
    console.error('Error updating customer health:', error);
    return NextResponse.json(
      { error: 'Failed to update customer health' },
      { status: 500 }
    );
  }
}
