
// Marketplace Booking Requests API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// POST - Create booking request from marketplace
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, preferredDate, preferredTime, notes } = body;

    if (!serviceId || !preferredDate || !preferredTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            users: {
              where: { role: 'ADMIN' },
              select: { email: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Create booking request
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, clinicId: true },
    });

    // Log the booking request (you can create a BookingRequest model)
    // For now, just send notification email

    const adminEmail = service.clinic?.users[0]?.email;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Ny bokningsförfrågan från marknadsplatsen - ${service.name}`,
        html: `
          <h2>Ny bokningsförfrågan</h2>
          <p><strong>Tjänst:</strong> ${service.name}</p>
          <p><strong>Kund:</strong> ${user?.name || user?.email}</p>
          <p><strong>Email:</strong> ${user?.email}</p>
          <p><strong>Önskat datum:</strong> ${preferredDate}</p>
          <p><strong>Önskad tid:</strong> ${preferredTime}</p>
          ${notes ? `<p><strong>Anteckningar:</strong> ${notes}</p>` : ''}
          <p>Logga in på Flow för att hantera bokningsförfrågan.</p>
        `,
      });
    }

    // Send confirmation to customer
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `Bokningsförfrågan mottagen - ${service.name}`,
        html: `
          <h2>Tack för din bokningsförfrågan!</h2>
          <p>Vi har mottagit din förfrågan för <strong>${service.name}</strong>.</p>
          <p><strong>Önskat datum:</strong> ${preferredDate}</p>
          <p><strong>Önskad tid:</strong> ${preferredTime}</p>
          <p>${service.clinic?.name || 'Kliniken'} kommer att kontakta dig inom kort för att bekräfta din bokning.</p>
          <p>Med vänliga hälsningar,<br>Flow Team</p>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'Booking request sent' });
  } catch (error) {
    console.error('Marketplace booking API error:', error);
    return NextResponse.json({ error: 'Failed to create booking request' }, { status: 500 });
  }
}
