
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { smsService, SMSService } from '@/lib/sms/sms-service';
import { renderTemplate } from '@/lib/sms/templates';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      recipients, // Array of phone numbers or customer IDs
      message, 
      templateId,
      templateVariables,
      customerIds 
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

    // Send SMS
    const result = await smsService.sendBulk(
      formattedNumbers, 
      finalMessage
    );

    // Log SMS campaign
    await prisma.sMSCampaign.create({
      data: {
        clinicId: session.user.clinicId!,
        name: templateId || 'Manual SMS',
        message: finalMessage,
        recipientCount: formattedNumbers.length,
        successCount: result.successful,
        failedCount: result.failed,
        sentAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      sent: result.successful,
      failed: result.failed,
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
