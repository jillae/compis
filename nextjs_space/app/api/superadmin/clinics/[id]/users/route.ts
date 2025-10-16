
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: { clinicId: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        onboardingCompletedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching clinic users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name || `${body.firstName} ${body.lastName}`,
        firstName: body.firstName,
        lastName: body.lastName,
        password: hashedPassword,
        role: body.role || UserRole.STAFF,
        clinicId: params.id,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
