
// FAQ Management API - SuperAdmin and Owner only

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

// GET all FAQs for a clinic
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only SUPER_ADMIN and ADMIN can manage FAQs
    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Build where clause
    const where: any = { clinicId };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { keywords: { hasSome: [search] } },
      ];
    }

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Get categories for filter
    const categories = await prisma.fAQ.findMany({
      where: { clinicId },
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      faqs,
      categories: categories.map(c => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('FAQ GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

// POST - Create new FAQ
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clinicId, question, answer, category, keywords, priority } = body;

    if (!clinicId || !question || !answer) {
      return NextResponse.json(
        { error: 'Clinic ID, question, and answer are required' },
        { status: 400 }
      );
    }

    const faq = await prisma.fAQ.create({
      data: {
        clinicId,
        question,
        answer,
        category: category || null,
        keywords: keywords || [],
        priority: priority || 0,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(faq, { status: 201 });
  } catch (error) {
    console.error('FAQ POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}

// PUT - Update FAQ
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, question, answer, category, keywords, priority, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID required' }, { status: 400 });
    }

    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        question,
        answer,
        category,
        keywords,
        priority,
        isActive,
      },
    });

    return NextResponse.json(faq);
  } catch (error) {
    console.error('FAQ PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID required' }, { status: 400 });
    }

    await prisma.fAQ.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FAQ DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}
