

/**
 * Corex SMS Service via 46elks
 * 
 * Enables SMS communication with customers through Corex AI
 * - Send AI-generated SMS responses
 * - Receive and process inbound SMS
 * - Context-aware conversations via SMS
 */

import { prisma } from '@/lib/db';

interface ElksApiConfig {
  username: string;
  password: string;
  from: string;
}

/**
 * Get 46elks credentials from environment variables
 */
async function getElksConfig(): Promise<ElksApiConfig> {
  const username = process.env.FORTYSEVEN_ELKS_API_USERNAME || '';
  const password = process.env.FORTYSEVEN_ELKS_API_PASSWORD || '';
  
  if (!username || !password) {
    throw new Error('46elks credentials not configured - set FORTYSEVEN_ELKS_API_USERNAME and FORTYSEVEN_ELKS_API_PASSWORD');
  }
  
  return {
    username,
    password,
    from: '+46766866273'
  };
}

/**
 * Send SMS via 46elks API
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    const config = await getElksConfig();
    
    const response = await fetch('https://api.46elks.com/a1/sms', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        from: config.from,
        to: to,
        message: message
      })
    });

    if (!response.ok) {
      console.error('46elks API error:', await response.text());
      return false;
    }

    console.log('✅ SMS sent to', to);
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

/**
 * Process inbound SMS and generate Corex AI response
 */
export async function processInboundSMS(
  from: string,
  message: string
): Promise<string | null> {
  try {
    // Find clinic by phone number (match customer)
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: from },
          { phone: from.replace('+46', '0') }
        ]
      },
      include: { clinic: true }
    });

    if (!customer?.clinic || !customer.clinicId) {
      return 'Tack för ditt meddelande! Vi kunde inte hitta dig i vårt system. Vänligen kontakta oss på [PHONE] för att boka.';
    }

    // Get or create conversation session for this phone number
    let conversation = await prisma.corexConversation.findFirst({
      where: {
        clinicId: customer.clinicId,
        sessionId: `sms_${from}`,
        isActive: true
      }
    });

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    let messages: any[] = [];
    
    if (conversation) {
      messages = (conversation.messages as any[]) || [];
      messages.push(userMessage);
    } else {
      messages = [userMessage];
    }

    // Generate AI response
    const aiResponse = await generateCorexSMSResponse(
      message,
      messages.slice(-5), // Last 5 messages for context
      customer.clinicId,
      customer.name || 'Kund'
    );

    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date().toISOString()
    };

    messages.push(assistantMessage);

    // Save or update conversation
    if (conversation) {
      await prisma.corexConversation.update({
        where: { id: conversation.id },
        data: {
          messages: messages,
          messageCount: messages.length,
          lastInteraction: new Date(),
          keywords: aiResponse.keywords || [],
          sentiment: aiResponse.sentiment || 'neutral'
        }
      });
    } else {
      await prisma.corexConversation.create({
        data: {
          clinicId: customer.clinicId,
          sessionId: `sms_${from}`,
          channel: 'sms',
          messages: messages,
          messageCount: messages.length,
          keywords: aiResponse.keywords || [],
          sentiment: aiResponse.sentiment || 'neutral'
        }
      });
    }

    return aiResponse.content;
  } catch (error) {
    console.error('Inbound SMS processing error:', error);
    return 'Tack för ditt meddelande! Vi svarar dig så snart som möjligt.';
  }
}

/**
 * Generate AI response for SMS (shorter than web chat)
 */
async function generateCorexSMSResponse(
  message: string,
  context: any[],
  clinicId: string,
  customerName: string
) {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        name: true,
        phone: true,
        services: { where: { isActive: true }, select: { name: true } }
      }
    });

    const contextSummary = context.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
    
    const systemPrompt = `Du är Corex, AI-assistenten för ${clinic?.name || 'kliniken'}.
Svara på svenska, kort och koncist (max 160 tecken för SMS).
Kunden heter ${customerName}.
Telefon till kliniken: ${clinic?.phone || 'Ej tillgänglig'}

Tidigare meddelanden:
${contextSummary}

Ny fråga: ${message}

Svara vänligt och hjälpsamt. Om kunden vill boka, ge info om hur man bokar.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Tack för ditt meddelande!';

    // Ensure SMS is not too long (160 chars)
    const truncatedContent = content.length > 160 
      ? content.substring(0, 157) + '...' 
      : content;

    return {
      content: truncatedContent,
      keywords: extractKeywords(message + ' ' + content),
      sentiment: detectSentiment(message)
    };

  } catch (error) {
    console.error('AI generation error:', error);
    return {
      content: 'Tack för ditt meddelande! Vi hör av oss.',
      keywords: [],
      sentiment: 'neutral'
    };
  }
}

function extractKeywords(text: string): string[] {
  const commonWords = ['och', 'att', 'är', 'i', 'på', 'för', 'med', 'det', 'en', 'som', 'av', 'den', 'jag', 'har', 'du', 'kan'];
  const words = text.toLowerCase()
    .replace(/[^\wåäöÅÄÖ\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.includes(w));
  
  return Array.from(new Set(words)).slice(0, 5);
}

function detectSentiment(text: string): string {
  const positiveWords = ['bra', 'tack', 'utmärkt', 'perfekt', 'fantastisk', 'glad'];
  const negativeWords = ['dålig', 'problem', 'fel', 'besviken', 'jobbig', 'arg'];
  
  const lower = text.toLowerCase();
  const hasPositive = positiveWords.some(w => lower.includes(w));
  const hasNegative = negativeWords.some(w => lower.includes(w));
  
  if (hasPositive && !hasNegative) return 'positive';
  if (hasNegative && !hasPositive) return 'negative';
  return 'neutral';
}

/**
 * Send booking confirmation via SMS
 */
export async function sendBookingConfirmationSMS(
  customerId: string,
  bookingDetails: {
    serviceName: string;
    staffName: string;
    date: Date;
    time: string;
  }
): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { clinic: true }
    });

    if (!customer?.phone) {
      console.log('Customer has no phone number');
      return false;
    }

    const message = `Hej ${customer.name || 'kund'}! Din bokning är bekräftad:
${bookingDetails.serviceName}
Med ${bookingDetails.staffName}
${bookingDetails.date.toLocaleDateString('sv-SE')} kl ${bookingDetails.time}
Välkommen! / ${customer.clinic?.name || 'Kliniken'}`;

    return await sendSMS(customer.phone, message);
  } catch (error) {
    console.error('Booking confirmation SMS error:', error);
    return false;
  }
}

/**
 * Send reminder SMS
 */
export async function sendReminderSMS(
  customerId: string,
  bookingDetails: {
    serviceName: string;
    date: Date;
    time: string;
  }
): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { clinic: true }
    });

    if (!customer?.phone) {
      return false;
    }

    const message = `Påminnelse: Du har bokat ${bookingDetails.serviceName} imorgon kl ${bookingDetails.time}. Ses då! / ${customer.clinic?.name || 'Kliniken'}`;

    return await sendSMS(customer.phone, message);
  } catch (error) {
    console.error('Reminder SMS error:', error);
    return false;
  }
}

