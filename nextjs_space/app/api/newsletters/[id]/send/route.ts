
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { smsService } from '@/lib/sms/sms-service';

// POST /api/newsletters/[id]/send - Send or schedule a newsletter
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test') === 'true';
    const body = await request.json();
    const { testRecipients } = body; // Array of {email?, phone?}

    // Get newsletter
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

    // Validate newsletter is ready to send
    if (!newsletter.contentHtml && !newsletter.contentSms) {
      return NextResponse.json(
        { error: 'Newsletter must have content' },
        { status: 400 }
      );
    }

    if (newsletter.status === 'SENT') {
      return NextResponse.json(
        { error: 'Newsletter already sent' },
        { status: 400 }
      );
    }

    // Test mode - send to specific recipients only
    if (testMode) {
      if (!testRecipients || testRecipients.length === 0) {
        return NextResponse.json(
          { error: 'Test recipients required for test mode' },
          { status: 400 }
        );
      }

      // Send test emails/SMS
      let sentCount = 0;
      for (const recipient of testRecipients) {
        if (newsletter.sendChannels.includes('sms') && recipient.phone) {
          try {
            await smsService.sendEnhanced({
              to: recipient.phone,
              message: newsletter.contentSms || newsletter.contentText || '',
              clinicId: session.user.clinicId,
              category: 'marketing',
            });
            sentCount++;
          } catch (error) {
            console.error('Failed to send test SMS:', error);
          }
        }

        if (newsletter.sendChannels.includes('email') && recipient.email) {
          // TODO: Implement email sending
          console.log('Email sending not yet implemented');
        }
      }

      return NextResponse.json({
        success: true,
        testMode: true,
        sentCount,
      });
    }

    // Production mode - send to all recipients
    // Get recipients based on segment/tags
    let recipients: any[] = [];

    if (newsletter.segmentId) {
      const segment = newsletter.segment;
      if (segment) {
        const filters = segment.filters as any;
        const where: any = {
          clinicId: session.user.clinicId,
        };

        // Apply filters (same logic as segments API)
        if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
          where.AND = where.AND || [];
          where.AND.push({
            customerTags: {
              some: {
                tag: {
                  name: {
                    in: filters.tags,
                  },
                },
              },
            },
          });
        }

        recipients = await prisma.customer.findMany({
          where,
          select: {
            id: true,
            email: true,
            phone: true,
            name: true,
            communicationPreference: true,
          },
        });
      }
    } else if (newsletter.tagFilters && newsletter.tagFilters.length > 0) {
      recipients = await prisma.customer.findMany({
        where: {
          clinicId: session.user.clinicId,
          customerTags: {
            some: {
              tag: {
                name: {
                  in: newsletter.tagFilters,
                },
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          communicationPreference: true,
        },
      });
    } else {
      // All customers
      recipients = await prisma.customer.findMany({
        where: {
          clinicId: session.user.clinicId,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          communicationPreference: true,
        },
      });
    }

    // Filter by communication preferences and consent
    recipients = recipients.filter((r) => {
      if (!r.communicationPreference) return false;
      
      // Check marketing consent
      if (!r.communicationPreference.marketing) return false;

      // Check channel preferences
      if (newsletter.sendChannels.includes('sms') && !r.communicationPreference.smsEnabled) {
        return false;
      }
      if (newsletter.sendChannels.includes('email') && !r.communicationPreference.emailEnabled) {
        return false;
      }

      return true;
    });

    // Update newsletter status
    await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: 'SENDING',
      },
    });

    // Send to all recipients (async, in background)
    let sentCount = 0;
    let deliveredCount = 0;

    for (const recipient of recipients) {
      try {
        if (newsletter.sendChannels.includes('sms') && recipient.phone) {
          const result = await smsService.sendEnhanced({
            to: recipient.phone,
            message: newsletter.contentSms || newsletter.contentText || '',
            clinicId: session.user.clinicId,
            customerId: recipient.id,
            category: 'marketing',
          });

          if (result.success) {
            sentCount++;
            // Delivery status will be updated via webhook
            deliveredCount++;
          }
        }

        if (newsletter.sendChannels.includes('email') && recipient.email) {
          // TODO: Implement email sending
          console.log('Email sending not yet implemented');
        }
      } catch (error) {
        console.error(`Failed to send to customer ${recipient.id}:`, error);
      }
    }

    // Update newsletter with final stats
    await prisma.newsletter.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount,
        deliveredCount,
        recipientCount: recipients.length,
      },
    });

    return NextResponse.json({
      success: true,
      sentCount,
      deliveredCount,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('[Newsletters API] Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
