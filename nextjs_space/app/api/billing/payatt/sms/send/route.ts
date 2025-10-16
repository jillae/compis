
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smsService, SMSService } from '@/lib/sms/sms-service';
import { renderTemplate } from '@/lib/sms/templates';
import { prisma } from '@/lib/db';
import { MessageCategory } from '@/lib/sms/consent-checker';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      recipients, // Array of phone numbers
      message, 
      templateId,
      templateVariables,
      customerIds,
      category = 'marketing' as MessageCategory
    } = body;

    // If customerIds provided, fetch their phone numbers
    let phoneNumbers: string[] = [];
    
    if (customerIds && customerIds.length > 0) {
      const customers = await prisma.customer.findMany({
        where: {
          id: { in: customerIds },
          clinicId: session.user.clinicId,
          consentSms: true, // Only send to customers who opted in
        },
        select: {
          phone: true,
        }
      });
      
      phoneNumbers = customers
        .map(c => c.phone)
        .filter((phone): phone is string => !!phone);
    } else if (recipients) {
      phoneNumbers = recipients;
    }

    if (phoneNumbers.length === 0) {
      return NextResponse.json({ 
        error: 'No valid recipients found' 
      }, { status: 400 });
    }

    // Format phone numbers
    const formattedNumbers = phoneNumbers.map(phone => 
      SMSService.formatPhoneNumber(phone)
    );

    // Prepare message
    let finalMessage = message;
    
    if (templateId && templateVariables) {
      finalMessage = renderTemplate(templateId, templateVariables);
    }

    // Create campaign record first
    const campaign = await prisma.sMSCampaign.create({
      data: {
        clinicId: session.user.clinicId!,
        name: templateId || 'Manual SMS',
        message: finalMessage,
        recipientCount: formattedNumbers.length,
        successCount: 0,
        failedCount: 0,
      }
    });

    // Send SMS with enhanced service (rate limiting, consent checking, retry logic)
    const result = await smsService.sendBulk(
      formattedNumbers, 
      finalMessage,
      'KlinikFlow',
      {
        clinicId: session.user.clinicId!,
        campaignId: campaign.id,
        category
      }
    );

    // Update campaign with results
    await prisma.sMSCampaign.update({
      where: { id: campaign.id },
      data: {
        successCount: result.successful,
        failedCount: result.failed,
        sentAt: new Date(),
        // Calculate cost (estimate: 0.40 SEK per SMS)
        totalCost: result.successful * 0.40
      }
    });

    return NextResponse.json({
      success: true,
      sent: result.successful,
      failed: result.failed,
      blocked: result.blocked,
      campaignId: campaign.id,
      details: result.results
    });

  } catch (error) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
