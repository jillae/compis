
// 46elks Voice Webhook Handler
// Receives incoming call events from 46elks

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CallStatus, CallDirection, VoiceIntentType } from '@prisma/client';
import {
  detectIntent,
  handleBookingIntent,
  handleRebookingIntent,
  handleCancellationIntent,
  handleFAQIntent,
} from '@/lib/voice/conversation';
import { createVoiceTicket } from '@/lib/voice/tickets';
import { generateSpeechWithFallback } from '@/lib/voice/tts';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callId = formData.get('callid') as string;
    const from = formData.get('from') as string;
    const to = formData.get('to') as string;
    const direction = formData.get('direction') as string;
    const status = formData.get('status') as string;
    
    // For voice input (STT from 46elks or custom implementation)
    const userInput = formData.get('input') as string;

    console.log('[46elks Webhook]', { callId, from, to, direction, status, userInput });

    // Find clinic by phone number
    const voiceConfig = await prisma.voiceConfiguration.findFirst({
      where: {
        phoneNumber: to,
      },
      include: {
        clinic: true,
      },
    });

    if (!voiceConfig) {
      console.error('[46elks Webhook] No voice config found for number:', to);
      return NextResponse.json({ error: 'No configuration found' }, { status: 404 });
    }

    const clinicId = voiceConfig.clinicId;

    // Handle different call statuses
    if (status === 'ongoing' && userInput) {
      // Call is ongoing and we have user input - process conversation
      
      // Detect intent
      const intentResult = await detectIntent(userInput, {
        clinicId,
        customerPhone: from,
        callId,
      });

      let aiResponse = '';
      
      // Handle intent
      if (intentResult.requiresHumanHandoff || intentResult.confidence < 0.6) {
        // Low confidence or requires human - create ticket
        aiResponse = 'Jag förstår inte riktigt. Jag skapar en förfrågan så att någon från kliniken kontaktar dig inom kort. Tack för ditt samtal!';
        
        await createVoiceTicket({
          clinicId,
          customerPhone: from,
          callId,
          subject: 'Kundsamtal kräver uppföljning',
          description: `Kund ringde men AI kunde inte hantera ärendet.\n\nKundens meddelande: "${userInput}"\n\nDetekterad intent: ${intentResult.intent} (confidence: ${intentResult.confidence})`,
          transcript: userInput,
        });
      } else {
        // Handle based on detected intent
        switch (intentResult.intent) {
          case VoiceIntentType.BOOKING:
            if (voiceConfig.enableBookingIntent) {
              aiResponse = await handleBookingIntent(
                { clinicId, customerPhone: from, callId },
                intentResult.entities || {}
              );
            } else {
              aiResponse = 'Bokning via telefon är inte aktiverat. Vänligen kontakta kliniken direkt.';
            }
            break;

          case VoiceIntentType.REBOOKING:
            if (voiceConfig.enableRebookingIntent) {
              aiResponse = await handleRebookingIntent(
                { clinicId, customerPhone: from, callId },
                intentResult.entities || {}
              );
            } else {
              aiResponse = 'Ombokning via telefon är inte aktiverat. Vänligen kontakta kliniken direkt.';
            }
            break;

          case VoiceIntentType.CANCELLATION:
            if (voiceConfig.enableCancelIntent) {
              aiResponse = await handleCancellationIntent(
                { clinicId, customerPhone: from, callId },
                intentResult.entities || {}
              );
            } else {
              aiResponse = 'Avbokning via telefon är inte aktiverat. Vänligen kontakta kliniken direkt.';
            }
            break;

          case VoiceIntentType.FAQ:
            if (voiceConfig.enableFAQIntent) {
              aiResponse = await handleFAQIntent(
                { clinicId, customerPhone: from, callId },
                userInput
              );
            } else {
              aiResponse = 'FAQ är inte aktiverat ännu. Vänligen kontakta kliniken direkt för frågor.';
            }
            break;

          default:
            // Unknown or OTHER intent - create ticket
            aiResponse = 'Jag skapar en förfrågan så att någon från kliniken kontaktar dig snart. Tack!';
            await createVoiceTicket({
              clinicId,
              customerPhone: from,
              callId,
              subject: 'Kundsamtal kräver uppföljning',
              description: `Kundens meddelande: "${userInput}"`,
              transcript: userInput,
            });
        }
      }

      // Generate TTS response
      const ttsResult = await generateSpeechWithFallback(
        aiResponse,
        voiceConfig.primaryProvider,
        {
          openaiApiKey: voiceConfig.openaiApiKey || undefined,
          openaiVoice: voiceConfig.openaiVoice,
          openaiModel: voiceConfig.openaiModel,
          openaiSpeed: voiceConfig.openaiSpeed,
          openaiFormat: voiceConfig.openaiFormat,
          elevenlabsApiKey: voiceConfig.elevenlabsApiKey || undefined,
          elevenlabsVoiceId: voiceConfig.elevenlabsVoiceId || undefined,
          elevenlabsSpeed: voiceConfig.elevenlabsSpeed,
          elevenlabsFormat: voiceConfig.elevenlabsFormat,
        },
        voiceConfig.enableFallback,
        voiceConfig.fallbackTimeoutMs
      );

      // Log call to database
      await prisma.voiceCall.upsert({
        where: { callId },
        update: {
          transcript: userInput,
          detectedIntent: intentResult.intent,
          intentConfidence: intentResult.confidence,
          ttsProviderUsed: ttsResult.provider,
          ttsFallbackUsed: ttsResult.provider !== voiceConfig.primaryProvider,
          aiResponse: { response: aiResponse, entities: intentResult.entities },
          status: CallStatus.IN_PROGRESS,
        },
        create: {
          clinicId,
          configId: voiceConfig.id,
          callId,
          fromNumber: from,
          toNumber: to,
          direction: direction === 'incoming' ? CallDirection.INBOUND : CallDirection.OUTBOUND,
          status: CallStatus.IN_PROGRESS,
          transcript: userInput,
          detectedIntent: intentResult.intent,
          intentConfidence: intentResult.confidence,
          ttsProviderUsed: ttsResult.provider,
          ttsFallbackUsed: ttsResult.provider !== voiceConfig.primaryProvider,
          aiResponse: { response: aiResponse, entities: intentResult.entities },
        },
      });

      // Return 46elks JSON response with TTS audio
      if (ttsResult.success && ttsResult.audioBuffer) {
        // Convert audio to base64 for 46elks
        const audioBase64 = ttsResult.audioBuffer.toString('base64');
        
        return NextResponse.json({
          play: `data:audio/mp3;base64,${audioBase64}`,
          next: '/api/voice/webhook', // Continue conversation
        });
      } else {
        // Fallback to text-to-speech by 46elks
        return NextResponse.json({
          say: aiResponse,
          voice: 'sv-SE',
          next: '/api/voice/webhook',
        });
      }
    } else if (status === 'completed') {
      // Call completed - update log
      await prisma.voiceCall.updateMany({
        where: { callId },
        data: {
          status: CallStatus.COMPLETED,
          endedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    } else if (status === 'failed') {
      // Call failed
      await prisma.voiceCall.updateMany({
        where: { callId },
        data: {
          status: CallStatus.FAILED,
          endedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    } else {
      // Initial call or ringing - greet customer
      const greeting = 'Hej och välkommen till kliniken! Hur kan jag hjälpa dig idag?';

      // Log initial call
      await prisma.voiceCall.create({
        data: {
          clinicId,
          configId: voiceConfig.id,
          callId,
          fromNumber: from,
          toNumber: to,
          direction: direction === 'incoming' ? CallDirection.INBOUND : CallDirection.OUTBOUND,
          status: CallStatus.ANSWERED,
        },
      });

      return NextResponse.json({
        say: greeting,
        voice: 'sv-SE',
        next: '/api/voice/webhook',
      });
    }
  } catch (error: any) {
    console.error('[46elks Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
