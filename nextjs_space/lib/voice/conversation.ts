
// Conversation Engine for Voice Calls
// Handles intent detection, booking flows, FAQ, and fallback logic

import { VoiceIntentType } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface ConversationContext {
  clinicId: string;
  customerPhone: string;
  customerName?: string;
  callId: string;
}

export interface ConversationTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IntentDetectionResult {
  intent: VoiceIntentType;
  confidence: number;
  entities?: Record<string, any>;
  requiresHumanHandoff?: boolean;
}

/**
 * Detect intent from user input using OpenAI GPT-4
 */
export async function detectIntent(
  userInput: string,
  context: ConversationContext
): Promise<IntentDetectionResult> {
  try {
    const systemPrompt = `Du är en AI-assistent för en skönhetsklinik. Din uppgift är att identifiera vad kunden vill göra.
    
Möjliga intents:
- BOOKING: Kunden vill boka tid
- REBOOKING: Kunden vill omboka en befintlig tid
- CANCELLATION: Kunden vill avboka en tid
- FAQ: Kunden har allmänna frågor
- OTHER: Något annat
- UNKNOWN: Oklart vad kunden vill

Analysera kundens meddelande och returnera ett JSON-objekt med:
{
  "intent": "BOOKING|REBOOKING|CANCELLATION|FAQ|OTHER|UNKNOWN",
  "confidence": 0.0-1.0,
  "entities": {
    // Extrahera relevant information (datum, behandling, etc.)
  },
  "requiresHumanHandoff": true/false
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      intent: result.intent as VoiceIntentType,
      confidence: result.confidence,
      entities: result.entities,
      requiresHumanHandoff: result.requiresHumanHandoff || false,
    };
  } catch (error) {
    console.error('Intent detection failed:', error);
    return {
      intent: VoiceIntentType.UNKNOWN,
      confidence: 0,
      requiresHumanHandoff: true,
    };
  }
}

/**
 * Handle booking intent
 */
export async function handleBookingIntent(
  context: ConversationContext,
  entities: Record<string, any>
): Promise<string> {
  try {
    // Find customer
    const customer = await prisma.customer.findFirst({
      where: {
        clinicId: context.clinicId,
        phone: context.customerPhone,
      },
    });

    if (!customer) {
      return `Hej! Jag kan hjälpa dig att boka tid. Kan du berätta vilket namn bokningen ska vara på?`;
    }

    // Fetch available services
    const services = await prisma.service.findMany({
      where: {
        clinicId: context.clinicId,
        isActive: true,
      },
      take: 5,
    });

    const serviceList = services.map((s) => s.name).join(', ');

    return `Hej ${customer.name}! Jag kan hjälpa dig att boka tid. Vi erbjuder: ${serviceList}. Vilken behandling är du intresserad av?`;
  } catch (error) {
    console.error('Booking intent handler failed:', error);
    return `Jag har problem att hämta tillgängliga tider just nu. Jag skapar en förfrågan så att någon kontaktar dig snart.`;
  }
}

/**
 * Handle rebooking intent
 */
export async function handleRebookingIntent(
  context: ConversationContext,
  entities: Record<string, any>
): Promise<string> {
  try {
    // Find customer's upcoming bookings
    const bookings = await prisma.booking.findMany({
      where: {
        customer: {
          clinicId: context.clinicId,
          phone: context.customerPhone,
        },
        scheduledTime: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
      take: 3,
    });

    if (bookings.length === 0) {
      return `Jag kan inte hitta några kommande bokningar på ditt telefonnummer. Vill du boka en ny tid istället?`;
    }

    const bookingList = bookings
      .map((b, i) => {
        const date = new Date(b.scheduledTime);
        return `${i + 1}. ${b.service?.name || 'Behandling'} den ${date.toLocaleDateString('sv-SE')} kl ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      })
      .join('\n');

    return `Du har följande bokningar:\n${bookingList}\n\nVilken bokning vill du omboka?`;
  } catch (error) {
    console.error('Rebooking intent handler failed:', error);
    return `Jag har problem att hämta dina bokningar just nu. Jag skapar en förfrågan så att någon kontaktar dig snart.`;
  }
}

/**
 * Handle cancellation intent
 */
export async function handleCancellationIntent(
  context: ConversationContext,
  entities: Record<string, any>
): Promise<string> {
  try {
    // Find customer's upcoming bookings
    const bookings = await prisma.booking.findMany({
      where: {
        customer: {
          clinicId: context.clinicId,
          phone: context.customerPhone,
        },
        scheduledTime: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        service: true,
      },
      orderBy: {
        scheduledTime: 'asc',
      },
      take: 3,
    });

    if (bookings.length === 0) {
      return `Jag kan inte hitta några kommande bokningar på ditt telefonnummer att avboka.`;
    }

    const bookingList = bookings
      .map((b, i) => {
        const date = new Date(b.scheduledTime);
        return `${i + 1}. ${b.service?.name || 'Behandling'} den ${date.toLocaleDateString('sv-SE')} kl ${date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}`;
      })
      .join('\n');

    return `Du har följande bokningar:\n${bookingList}\n\nVilken bokning vill du avboka?`;
  } catch (error) {
    console.error('Cancellation intent handler failed:', error);
    return `Jag har problem att hämta dina bokningar just nu. Jag skapar en förfrågan så att någon kontaktar dig snart.`;
  }
}

/**
 * Handle FAQ intent
 */
export async function handleFAQIntent(
  context: ConversationContext,
  userQuestion: string
): Promise<string> {
  // TODO: Implement FAQ knowledge base
  // For now, return a generic response
  return `Tack för din fråga. Just nu kan jag bäst hjälpa dig med bokningar, ombokningar och avbokningar. För andra frågor kommer någon från kliniken att kontakta dig snart.`;
}
