
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer stats
    const totalCustomers = await prisma.customer.count();
    
    const activeCustomers = await prisma.customer.count({
      where: {
        isActive: true,
        lastVisitAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      }
    });

    const inactiveCustomers = await prisma.customer.count({
      where: {
        OR: [
          { isActive: false },
          {
            lastVisitAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      }
    });

    const recentImports = await prisma.customer.count({
      where: {
        importedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      recentImports
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
