
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verify46ElksIP, logBlockedWebhook } from '@/lib/middleware/verify-46elks-ip';

/**
 * 46elks Delivery Receipt Webhook
 * Tracks SMS delivery status and updates logs
 * 
 * Expected payload:
 * - id: Message ID
 * - status: "sent" | "delivered" | "failed"
 * - cost: Cost in SEK (e.g., "0.45")
 * - parts: Number of SMS parts
 * - errorcode: Error code if failed
 */
export async function POST(req: NextRequest) {
  // 🔒 Security: Verify request comes from trusted 46elks IP
  const { verified, ip, reason } = verify46ElksIP(req);
  
  if (!verified) {
    await logBlockedWebhook(ip, '/api/webhooks/46elks/delivery', reason || 'IP verification failed');
    return NextResponse.json(
      { error: 'Forbidden' }, 
      { status: 403 }
    );
  }

  try {
    const body = await req.formData();
    
    const messageId = body.get('id') as string;
    const status = body.get('status') as string;
    const cost = body.get('cost') as string;
    const parts = body.get('parts') as string;
    const errorCode = body.get('errorcode') as string;

    console.log('📬 Delivery receipt from 46elks:', { messageId, status, cost, parts, errorCode });

    // Find the SMS log entry
    const smsLog = await prisma.sMSLog.findFirst({
      where: { providerId: messageId }
    });

    if (!smsLog) {
      console.warn('SMS log not found for messageId:', messageId);
      return NextResponse.json({ success: true });
    }

    // Update SMS log with delivery status
    const updateData: any = {
      providerStatus: status,
      cost: cost ? parseFloat(cost) : null,
      parts: parts ? parseInt(parts) : 1,
    };

    if (status === 'delivered') {
      updateData.status = 'delivered';
      updateData.deliveredAt = new Date();
    } else if (status === 'failed') {
      updateData.status = 'failed';
      updateData.failedAt = new Date();
      updateData.failureReason = errorCode || 'Unknown error';
    }

    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: updateData
    });

    // Update rate limit and cost tracking
    if (cost && smsLog.clinicId !== 'UNKNOWN') {
      const rateLimit = await prisma.sMSRateLimit.findUnique({
        where: { clinicId: smsLog.clinicId }
      });

      if (rateLimit) {
        await prisma.sMSRateLimit.update({
          where: { clinicId: smsLog.clinicId },
          data: {
            spentThisMonth: {
              increment: parseFloat(cost)
            }
          }
        });
      }
    }

    console.log('✅ SMS log updated:', messageId, status);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error handling 46elks delivery webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
