
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { smsService } from '@/lib/sms/sms-service';
import { verify46ElksIP, logBlockedWebhook } from '@/lib/middleware/verify-46elks-ip';

/**
 * 46elks SMS Webhook
 * Handles incoming SMS messages (bidirectional communication)
 * 
 * Expected payload from 46elks:
 * - id: Message ID
 * - from: Sender phone number (+46...)
 * - to: Recipient phone number (our number: +46766866273)
 * - message: SMS content
 * - created: ISO timestamp
 */
export async function POST(req: NextRequest) {
  // 🔒 Security: Verify request comes from trusted 46elks IP
  const { verified, ip, reason } = verify46ElksIP(req);
  
  if (!verified) {
    await logBlockedWebhook(ip, '/api/webhooks/46elks/sms', reason || 'IP verification failed');
    return NextResponse.json(
      { error: 'Forbidden' }, 
      { status: 403 }
    );
  }

  try {
    const body = await req.formData();
    
    const from = body.get('from') as string;
    const to = body.get('to') as string;
    const message = body.get('message') as string;
    const messageId = body.get('id') as string;
    const created = body.get('created') as string;

    console.log('📥 Incoming SMS from 46elks:', { from, to, message, messageId });

    // Find customer by phone number
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: from },
          { phone: from.replace('+', '') },
          { phone: from.replace('+46', '0') }
        ]
      },
      include: {
        clinic: true,
        communicationPreference: true
      }
    });

    // Log the incoming SMS
    await prisma.sMSLog.create({
      data: {
        clinicId: customer?.clinicId || 'UNKNOWN',
        direction: 'inbound',
        from,
        to,
        message,
        provider: '46elks',
        providerId: messageId,
        status: 'delivered',
        deliveredAt: new Date(created),
        customerId: customer?.id,
      }
    });

    // Check for STOP keywords
    const normalizedMessage = message.trim().toUpperCase();
    const stopKeywords = await prisma.sMSStopKeyword.findMany({
      where: { isActive: true }
    });

    const isStopCommand = stopKeywords.some(
      keyword => normalizedMessage === keyword.keyword ||
                 normalizedMessage.startsWith(keyword.keyword + ' ')
    );

    if (isStopCommand) {
      await handleStopCommand(customer, from, to);
      
      // Respond with confirmation
      return new NextResponse('Du är nu avprenumererad från SMS-utskick.', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Check for START/JA keywords (opt back in)
    if (['START', 'JA', 'YES', 'BÖRJA'].includes(normalizedMessage)) {
      await handleStartCommand(customer, from);
      
      return new NextResponse('Välkommen tillbaka! Du kommer åter få SMS från oss.', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Handle other keywords (HELP, INFO, etc.)
    if (['HELP', 'HJÄLP', 'INFO'].includes(normalizedMessage)) {
      return new NextResponse(
        'Svara STOP för att avsluta SMS, START för att börja igen. Kontakta oss på ' + 
        (customer?.clinic?.phone || '...') + ' för support.',
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }

    // Forward to customer service or handle custom logic here
    // For now, send a generic response
    return new NextResponse(
      'Tack för ditt meddelande! Vi återkommer så snart som möjligt.',
      { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );

  } catch (error) {
    console.error('Error handling 46elks SMS webhook:', error);
    
    // Return 200 OK to prevent 46elks from retrying
    return new NextResponse('OK', { status: 200 });
  }
}

/**
 * Handle STOP command - opt out from SMS
 */
async function handleStopCommand(customer: any, from: string, to: string) {
  if (!customer) {
    console.warn('STOP command from unknown number:', from);
    return;
  }

  // Update customer communication preferences
  await prisma.customerCommunicationPreference.upsert({
    where: { customerId: customer.id },
    update: {
      smsEnabled: false,
      marketing: false,
      loyalty: false,
      reminders: false,
      optedOutAt: new Date(),
      optOutMethod: 'sms_stop',
      optOutReason: 'SMS STOP command received'
    },
    create: {
      customerId: customer.id,
      smsEnabled: false,
      emailEnabled: true,
      pushEnabled: false,
      transactional: true,
      marketing: false,
      loyalty: false,
      reminders: false,
      surveys: false,
      optedOutAt: new Date(),
      optOutMethod: 'sms_stop',
      optOutReason: 'SMS STOP command received'
    }
  });

  // Create OptOut record for audit trail
  await prisma.optOut.create({
    data: {
      customerId: customer.id,
      clinicId: customer.clinicId,
      channel: 'sms',
      reason: 'SMS STOP command received'
    }
  });

  console.log('✅ Customer opted out:', customer.id, from);
}

/**
 * Handle START command - opt back in to SMS
 */
async function handleStartCommand(customer: any, from: string) {
  if (!customer) {
    console.warn('START command from unknown number:', from);
    return;
  }

  // Update customer communication preferences
  await prisma.customerCommunicationPreference.upsert({
    where: { customerId: customer.id },
    update: {
      smsEnabled: true,
      optedOutAt: null,
      optOutMethod: null,
      optOutReason: null,
      consentUpdatedAt: new Date(),
      consentMethod: 'sms_reply'
    },
    create: {
      customerId: customer.id,
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      transactional: true,
      marketing: false,
      loyalty: true,
      reminders: true,
      surveys: false,
      consentGivenAt: new Date(),
      consentMethod: 'sms_reply'
    }
  });

  console.log('✅ Customer opted back in:', customer.id, from);
}
