
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getResendClient } from '@/lib/email';

export const dynamic = 'force-dynamic';


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      customerId, 
      subject, 
      body: emailBody, 
      triggerId,
      from,
    } = body;

    if (!customerId || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, subject, body' },
        { status: 400 }
      );
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        consentEmail: true,
        clinicId: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (!customer.email) {
      return NextResponse.json({ error: 'Customer has no email address' }, { status: 400 });
    }

    if (!customer.consentEmail) {
      return NextResponse.json({ error: 'Customer has not consented to email' }, { status: 400 });
    }

    // Get clinic info for sender
    const clinic = await prisma.clinic.findUnique({
      where: { id: customer.clinicId! },
      select: {
        name: true,
        email: true,
      },
    });

    const fromEmail = from || clinic?.email || 'no-reply@klinikflow.app';
    const fromName = clinic?.name || 'Klinik Flow';

    // Send email via Resend
    const { data, error } = await getResendClient().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [customer.email],
      subject,
      html: emailBody.replace(/\n/g, '<br>'),
    });

    if (error) {
      console.error('Resend error:', error);
      
      // Log failed message
      await prisma.message.create({
        data: {
          clinicId: customer.clinicId!,
          customerId: customer.id,
          channel: 'email',
          subject,
          body: emailBody,
          to: customer.email,
          from: fromEmail,
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
          providerName: 'resend',
        },
      });

      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        clinicId: customer.clinicId!,
        customerId: customer.id,
        channel: 'email',
        subject,
        body: emailBody,
        to: customer.email,
        from: fromEmail,
        status: 'sent',
        sentAt: new Date(),
        providerId: data?.id || undefined,
        providerName: 'resend',
      },
    });

    // If this is part of a trigger, create execution record
    if (triggerId) {
      await prisma.triggerExecution.create({
        data: {
          triggerId,
          customerId: customer.id,
          clinicId: customer.clinicId!,
          status: 'sent',
          sentAt: new Date(),
        },
      });

      // Update trigger stats
      await prisma.marketingTrigger.update({
        where: { id: triggerId },
        data: {
          totalExecutions: { increment: 1 },
          successfulSends: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: message.id,
      providerId: data?.id,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
