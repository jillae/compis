
// Voice Tickets API
// GET: List tickets for a clinic
// POST: Create a new ticket

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { createVoiceTicket, resolveVoiceTicket } from '@/lib/voice/tickets';

// GET - List voice tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get('clinicId') || session.user.clinicId;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!clinicId) {
      return NextResponse.json({ error: 'Clinic ID required' }, { status: 400 });
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.clinicId !== clinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tickets = await prisma.voiceTicket.findMany({
      where: {
        clinicId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error('GET /api/voice/tickets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clinicId, customerPhone, customerName, customerId, callId, subject, description, transcript, priority } = body;

    const targetClinicId = clinicId || session.user.clinicId;

    if (!targetClinicId || !customerPhone || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: clinicId, customerPhone, subject, description' },
        { status: 400 }
      );
    }

    // Check permissions
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.clinicId !== targetClinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticketId = await createVoiceTicket({
      clinicId: targetClinicId,
      customerPhone,
      customerName,
      customerId,
      callId,
      subject,
      description,
      transcript,
      priority,
    });

    const ticket = await prisma.voiceTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('POST /api/voice/tickets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Resolve a ticket
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, resolution } = body;

    if (!ticketId || !resolution) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketId, resolution' },
        { status: 400 }
      );
    }

    // Check if ticket exists and user has permission
    const ticket = await prisma.voiceTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.clinicId !== ticket.clinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await resolveVoiceTicket(ticketId, session.user.id, resolution);

    const updatedTicket = await prisma.voiceTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error: any) {
    console.error('PATCH /api/voice/tickets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
