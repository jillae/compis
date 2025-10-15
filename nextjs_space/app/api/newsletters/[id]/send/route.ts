
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify newsletter belongs to clinic
    const newsletter = await prisma.newsletter.findFirst({
      where: {
        id: params.id,
        clinicId: session.user.clinicId,
      },
      include: {
        segment: true,
      },
    });

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 });
    }

    if (newsletter.status === 'SENT') {
      return NextResponse.json(
        { error: 'Newsletter already sent' },
        { status: 400 }
      );
    }

    // Get customers from segment using tag filters
    let customers: any[] = [];
    if (newsletter.segment) {
      const filters = newsletter.segment.filters as any;
      if (filters?.tags && filters.tags.length > 0) {
        customers = await prisma.customer.findMany({
          where: {
            clinicId: session.user.clinicId,
            tags: {
              hasSome: filters.tags,
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
      }
    }

    // In a real implementation, you would:
    // 1. Integrate with an email service (SendGrid, Mailgun, etc.)
    // 2. Send emails to all customers in the segment
    // 3. Track opens and clicks
    // 4. Handle bounces and unsubscribes

    // For now, we'll simulate the send
    const recipientCount = customers.length;

    // Create newsletter subscribers
    if (customers.length > 0 && session.user.clinicId) {
      // Only create for customers with emails
      const validSubscribers = customers
        .filter((c: any) => c.email)
        .map((customer: any) => ({
          customerId: customer.id,
          clinicId: session.user.clinicId!,
        }));
      
      if (validSubscribers.length > 0) {
        await prisma.newsletterSubscriber.createMany({
          data: validSubscribers,
          skipDuplicates: true,
        });
      }
    }

    // Update newsletter status
    const updatedNewsletter = await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipientCount,
      },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`Newsletter "${newsletter.subject}" sent to ${recipientCount} recipients`);

    return NextResponse.json(updatedNewsletter);
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
