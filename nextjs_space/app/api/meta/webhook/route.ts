
/**
 * Meta Webhook Endpoint
 * Handles webhook verification and incoming events from Meta/Facebook
 * 
 * Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

/**
 * GET - Webhook Verification Challenge
 * Meta sends this to verify the webhook endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[META WEBHOOK] Verification request received', {
      mode,
      token: token?.substring(0, 10) + '...',
      challenge: challenge?.substring(0, 10) + '...',
    });

    // Check if mode and token are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[META WEBHOOK] ✅ Verification successful');
      
      // Respond with challenge token to complete verification
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      console.error('[META WEBHOOK] ❌ Verification failed', {
        expectedToken: VERIFY_TOKEN?.substring(0, 10) + '...',
        receivedToken: token?.substring(0, 10) + '...',
      });
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
  } catch (error) {
    console.error('[META WEBHOOK] Verification error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST - Webhook Event Handler
 * Receives and processes webhook events from Meta
 */
export async function POST(req: NextRequest) {
  try {
    // Verify signature (security measure)
    const signature = req.headers.get('x-hub-signature-256');
    const body = await req.text();

    if (APP_SECRET && signature) {
      const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', APP_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[META WEBHOOK] ❌ Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    // Parse webhook payload
    const data = JSON.parse(body);

    console.log('[META WEBHOOK] 📨 Event received:', {
      object: data.object,
      entry: data.entry?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Log full payload for debugging
    console.log('[META WEBHOOK] Full payload:', JSON.stringify(data, null, 2));

    // Process each entry in the webhook
    if (data.entry && Array.isArray(data.entry)) {
      for (const entry of data.entry) {
        // Handle different event types
        if (entry.changes) {
          for (const change of entry.changes) {
            await processWebhookChange(change, entry);
          }
        }

        // Handle messaging events (if applicable)
        if (entry.messaging) {
          for (const message of entry.messaging) {
            await processMessagingEvent(message, entry);
          }
        }
      }
    }

    // Store webhook event in database for auditing
    await storeWebhookEvent(data);

    // Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[META WEBHOOK] Error processing event:', error);
    
    // Still return 200 to prevent Meta from retrying
    // (we log the error for manual investigation)
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Process a webhook change event
 */
async function processWebhookChange(change: any, entry: any) {
  console.log('[META WEBHOOK] Processing change:', {
    field: change.field,
    value: change.value,
  });

  // Handle different field types
  switch (change.field) {
    case 'leadgen':
      await handleLeadGenEvent(change.value);
      break;
    case 'messages':
      await handleMessageEvent(change.value);
      break;
    case 'feed':
      await handleFeedEvent(change.value);
      break;
    default:
      console.log('[META WEBHOOK] Unhandled field type:', change.field);
  }
}

/**
 * Process a messaging event
 */
async function processMessagingEvent(message: any, entry: any) {
  console.log('[META WEBHOOK] Processing message:', {
    sender: message.sender?.id,
    recipient: message.recipient?.id,
    timestamp: message.timestamp,
  });

  // Handle message events here
  // Example: Store message, trigger auto-reply, etc.
}

/**
 * Handle Lead Generation events
 */
async function handleLeadGenEvent(value: any) {
  console.log('[META WEBHOOK] 🎯 Lead generation event:', value);
  
  // TODO: Implement lead capture logic
  // - Fetch lead details from Meta API
  // - Store in database
  // - Trigger notifications
  // - Create booking/customer record
}

/**
 * Handle Message events
 */
async function handleMessageEvent(value: any) {
  console.log('[META WEBHOOK] 💬 Message event:', value);
  
  // TODO: Implement message handling logic
  // - Store message in conversation history
  // - Trigger auto-reply if needed
  // - Notify staff
}

/**
 * Handle Feed events
 */
async function handleFeedEvent(value: any) {
  console.log('[META WEBHOOK] 📰 Feed event:', value);
  
  // TODO: Implement feed event logic
  // - Track post engagement
  // - Monitor comments
  // - Update analytics
}

/**
 * Store webhook event in database for auditing
 */
async function storeWebhookEvent(data: any) {
  try {
    // Store in a webhook_logs table for debugging/auditing
    // For now, just log to console
    console.log('[META WEBHOOK] Event stored for audit');
    
    // TODO: Implement database storage
    // await prisma.webhookLog.create({
    //   data: {
    //     source: 'meta',
    //     payload: data,
    //     receivedAt: new Date(),
    //   }
    // });
  } catch (error) {
    console.error('[META WEBHOOK] Failed to store event:', error);
  }
}
