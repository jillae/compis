
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * GET /api/superadmin/sms/templates
 * List all SMS templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clinicId = searchParams.get('clinicId');

    const templates = await prisma.sMSTemplate.findMany({
      where: clinicId ? { clinicId } : undefined,
      include: {
        clinic: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/sms/templates
 * Create new SMS template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      clinicId, 
      name, 
      description,
      category,
      message, 
      variables = [],
      isActive = true
    } = body;

    if (!clinicId || !name || !message) {
      return NextResponse.json({ 
        error: 'clinicId, name, and message are required' 
      }, { status: 400 });
    }

    const template = await prisma.sMSTemplate.create({
      data: {
        clinicId,
        name,
        description,
        category: category || 'marketing',
        message,
        variables,
        isActive
      }
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    );
  }
}
