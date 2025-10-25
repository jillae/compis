
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
  try {
    // Import RAG retrieval (dynamic to avoid circular dependency)
    const { retrieveContext, buildContextPrompt } = await import('@/lib/rag/retrieval');
    
    // Retrieve relevant knowledge chunks
    const ragResults = await retrieveContext(
      userQuestion,
      context.clinicId,
      5 // Top 5 most relevant chunks
    );

    if (ragResults.length === 0) {
      // Fallback if no relevant knowledge found
      return `Tack för din fråga. Jag har inte tillräckligt med information för att svara på det just nu. Låt mig skapa en förfrågan så kontaktar kliniken dig snart.`;
    }

    // Build context prompt from RAG results
    const contextPrompt = buildContextPrompt(ragResults);

    // Use OpenAI to generate natural response based on RAG context
    const systemPrompt = `Du är en AI-assistent för kliniken. Använd informationen nedan för att svara på kundens fråga på ett naturligt och hjälpsamt sätt.

Om informationen inte helt svarar på frågan, säg att du inte är säker och erbjud att någon ska ringa tillbaka.

VIKTIGT:
- Om kunden frågar om priser, nämn exakt pris från informationen
- Om det finns flera behandlingar, nämn de mest relevanta
- Rekommendera alltid att börja med en konsultation för nya kunder
- Om kunden frågar om klippkort/paket, nämn rabatterbjudanden
- Var varm, professionell och hjälpsam

${contextPrompt}`;

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
          { role: 'user', content: userQuestion },
        ],
        temperature: 0.7,
        max_tokens: 200, // Keep responses concise for voice
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return answer;
  } catch (error) {
    console.error('FAQ intent handling failed:', error);
    return `Tack för din fråga. Just nu kan jag bäst hjälpa dig med bokningar, ombokningar och avbokningar. För andra frågor kommer någon från kliniken att kontakta dig snart.`;
  }
}
