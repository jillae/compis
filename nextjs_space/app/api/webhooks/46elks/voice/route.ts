
import { NextRequest, NextResponse } from 'next/server';
import { verify46ElksIP, logBlockedWebhook } from '@/lib/middleware/verify-46elks-ip';

/**
 * 46elks Voice Webhook
 * Handles incoming voice calls
 * 
 * This endpoint returns IVR instructions in JSON format
 * to handle incoming calls automatically
 */
export async function POST(req: NextRequest) {
  // 🔒 Security: Verify request comes from trusted 46elks IP
  const { verified, ip, reason } = verify46ElksIP(req);
  
  if (!verified) {
    await logBlockedWebhook(ip, '/api/webhooks/46elks/voice', reason || 'IP verification failed');
    return NextResponse.json(
      { error: 'Forbidden' }, 
      { status: 403 }
    );
  }

  try {
    const body = await req.formData();
    
    const from = body.get('from') as string;
    const to = body.get('to') as string;
    const callId = body.get('callid') as string;

    console.log('📞 Incoming call from 46elks:', { from, to, callId });

    // Return IVR response in 46elks format
    // This will play a message and hang up
    return NextResponse.json({
      play: 'https://flow.abacusai.app/audio/welcome.mp3',
      next: 'hangup'
    });

  } catch (error) {
    console.error('Error handling 46elks voice webhook:', error);
    
    // Return hangup instruction on error
    return NextResponse.json({
      next: 'hangup'
    });
  }
}
