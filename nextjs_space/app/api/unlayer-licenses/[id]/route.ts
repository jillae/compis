

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plan, status, apiKey, projectId, pricePerMonth, expiresAt } = body;

    // Update license
    const license = await prisma.unlayerLicense.update({
      where: { id },
      data: {
        ...(plan && { plan }),
        ...(status && { status }),
        ...(apiKey !== undefined && { apiKey }),
        ...(projectId !== undefined && { projectId }),
        ...(pricePerMonth !== undefined && { pricePerMonth }),
        ...(expiresAt !== undefined && { 
          expiresAt: expiresAt ? new Date(expiresAt) : null 
        }),
        lastSyncedAt: new Date(),
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
      },
    });

    return NextResponse.json(license);
  } catch (error) {
    console.error('Error updating license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.unlayerLicense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting license:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

