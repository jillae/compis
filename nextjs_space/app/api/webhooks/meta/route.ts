
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Meta Marketing API Webhook
 * Handles verification and incoming events from Facebook/Instagram
 * 
 * GET: Webhook verification (Meta requires this for setup)
 * POST: Incoming events (lead ads, messages, etc.)
 */

// Webhook Verification (GET)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('📥 Meta webhook verification request:', { mode, token, challenge });

    // Verify token matches
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Meta webhook verified successfully');
      
      // Return challenge to complete verification
      return new NextResponse(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.error('❌ Meta webhook verification failed:', { mode, token, expected: VERIFY_TOKEN });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    
  } catch (error) {
    console.error('Error in Meta webhook verification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Webhook Events (POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('📥 Meta webhook event received:', JSON.stringify(body, null, 2));

    // Verify signature (optional but recommended)
    const signature = req.headers.get('x-hub-signature-256');
    if (signature) {
      // TODO: Verify signature using META_APP_SECRET
      // const isValid = verifySignature(body, signature, process.env.META_APP_SECRET);
      // if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Process each entry
    for (const entry of body.entry || []) {
      console.log('Processing entry:', entry.id);
      
      // Handle different event types
      if (entry.changes) {
        for (const change of entry.changes) {
          await handleChange(change);
        }
      }
      
      if (entry.messaging) {
        for (const message of entry.messaging) {
          await handleMessage(message);
        }
      }
    }

    // Log webhook event
    await prisma.metaWebhookLog.create({
      data: {
        eventType: body.object || 'unknown',
        payload: body,
        receivedAt: new Date(),
      },
    });

    // Always return 200 OK to Meta
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing Meta webhook:', error);
    
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * Handle leadgen, ad insights, etc.
 */
async function handleChange(change: any) {
  console.log('📊 Change event:', change.field, change.value);
  
  switch (change.field) {
    case 'leadgen':
      await handleLeadgen(change.value);
      break;
    case 'feed':
      // Handle feed updates
      break;
    default:
      console.log('Unhandled change type:', change.field);
  }
}

/**
 * Handle incoming messages
 */
async function handleMessage(message: any) {
  console.log('💬 Message event:', message);
  // Handle Instagram/Facebook messages
}

/**
 * Handle new lead from Lead Ads
 */
async function handleLeadgen(value: any) {
  console.log('🎯 New lead:', value);
  
  // Extract lead data
  const leadId = value.leadgen_id;
  const pageId = value.page_id;
  const adId = value.ad_id;
  const formId = value.form_id;
  
  // TODO: Fetch full lead data from Graph API
  // Then create customer in database
  
  console.log('Lead data:', { leadId, pageId, adId, formId });
}
