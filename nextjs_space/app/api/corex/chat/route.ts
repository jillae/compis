
/**
 * Corex AI Chat API - Med långt kontextminne
 * WAVE 8: Intelligent assistent som kommer ihåg tidigare konversationer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, sessionId, channel = 'web' } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Hämta eller skapa konversation
    let conversation = await prisma.corexConversation.findFirst({
      where: {
        clinicId: session.user.clinicId,
        sessionId: sessionId || `session_${Date.now()}`,
        isActive: true
      }
    });

    const newMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    let messages: any[] = [];
    
    if (conversation) {
      // Hämta befintliga meddelanden
      messages = (conversation.messages as any[]) || [];
      messages.push(newMessage);
    } else {
      // Skapa ny konversation
      messages = [newMessage];
    }

    // Generera AI-svar med kontextmedvetenhet
    const aiResponse = await generateCorexResponse(
      message,
      messages.slice(-10), // Senaste 10 meddelandena för kontext
      session.user.clinicId
    );

    const assistantMessage = {
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date().toISOString()
    };

    messages.push(assistantMessage);

    // Uppdatera eller skapa konversation i databasen
    if (conversation) {
      conversation = await prisma.corexConversation.update({
        where: { id: conversation.id },
        data: {
          messages: messages,
          messageCount: messages.length,
          lastInteraction: new Date(),
          keywords: aiResponse.keywords || [],
          sentiment: aiResponse.sentiment || 'neutral',
          summary: aiResponse.summary
        }
      });
    } else {
      conversation = await prisma.corexConversation.create({
        data: {
          clinicId: session.user.clinicId,
          userId: session.user.id,
          sessionId: sessionId || `session_${Date.now()}`,
          channel,
          messages: messages,
          messageCount: messages.length,
          keywords: aiResponse.keywords || [],
          sentiment: aiResponse.sentiment || 'neutral'
        }
      });
    }

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      sessionId: conversation.sessionId,
      conversationId: conversation.id,
      messageCount: messages.length,
      sentiment: aiResponse.sentiment
    });

  } catch (error) {
    console.error('Corex chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function generateCorexResponse(
  message: string,
  context: any[],
  clinicId: string
) {
  // Hämta klinikdata för personaliserade svar
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      name: true,
      services: { where: { isActive: true }, select: { name: true, category: true } },
      staff: { where: { isActive: true }, select: { name: true, specialization: true } }
    }
  });

  // Bygg context-medveten prompt
  const contextSummary = context.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
  
  const systemPrompt = `Du är Corex, den intelligenta assistenten för ${clinic?.name || 'kliniken'}.
Du hjälper kunder med bokningar, information om behandlingar och svarar på frågor.

Tillgängliga tjänster: ${clinic?.services.map(s => s.name).join(', ') || 'Inga tjänster'}
Personal: ${clinic?.staff.map(s => s.name).join(', ') || 'Ingen personal'}

Tidigare konversation:
${contextSummary}

Användarens nya fråga: ${message}

Ge ett hjälpsamt, vänligt och professionellt svar på svenska.`;

  try {
    // Använd AbacusAI API (redan konfigurerad i .env)
    const response = await fetch('https://abacus.ai/api/v0/chatllm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'Förlåt, jag kunde inte generera ett svar just nu.';

    // Extrahera nyckelord och sentiment (enkel implementation)
    const keywords = extractKeywords(message + ' ' + content);
    const sentiment = detectSentiment(message);

    return {
      content,
      keywords,
      sentiment,
      summary: content.substring(0, 100) + '...'
    };

  } catch (error) {
    console.error('AI generation error:', error);
    return {
      content: 'Förlåt, jag har tekniska problem just nu. Kan du försöka igen om en stund?',
      keywords: [],
      sentiment: 'neutral'
    };
  }
}

function extractKeywords(text: string): string[] {
  // Enkel keyword extraction - tar ut vanliga ord
  const commonWords = ['och', 'att', 'är', 'i', 'på', 'för', 'med', 'det', 'en', 'som', 'av', 'den', 'jag', 'har', 'du', 'kan'];
  const words = text.toLowerCase()
    .replace(/[^\wåäöÅÄÖ\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.includes(w));
  
  // Ta de 5 mest unika orden
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

// GET endpoint för att hämta konversationshistorik
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      // Returnera alla aktiva konversationer för användaren
      const conversations = await prisma.corexConversation.findMany({
        where: {
          clinicId: session.user.clinicId,
          userId: session.user.id,
          isActive: true
        },
        orderBy: { lastInteraction: 'desc' },
        take: 10
      });

      return NextResponse.json({
        success: true,
        conversations: conversations.map(c => ({
          id: c.id,
          sessionId: c.sessionId,
          messageCount: c.messageCount,
          lastInteraction: c.lastInteraction,
          summary: c.summary,
          sentiment: c.sentiment
        }))
      });
    }

    // Hämta specifik konversation
    const conversation = await prisma.corexConversation.findFirst({
      where: {
        clinicId: session.user.clinicId,
        sessionId: sessionId,
        isActive: true
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        sessionId: conversation.sessionId,
        messages: conversation.messages,
        messageCount: conversation.messageCount,
        lastInteraction: conversation.lastInteraction,
        keywords: conversation.keywords,
        sentiment: conversation.sentiment
      }
    });

  } catch (error) {
    console.error('Corex conversation fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
