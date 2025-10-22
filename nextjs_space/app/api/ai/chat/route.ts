
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY,
  baseURL: 'https://api.abacus.ai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Enhanced system prompt with IRAC structure and anti-hallucination measures
    const systemPrompt = `Du är Flow AI Assistant - en professionell, faktabaserad AI-assistent för Klinik Flow Control.

DITT UPPDRAG:
Hjälpa kliniker optimera sin verksamhet genom datadriven analys och konkreta rekommendationer.

STRUKTURERAD METODIK (IRAC):
1. ISSUE: Identifiera kundens specifika fråga eller utmaning
2. RULE: Beskriv relevanta principer, funktioner eller best practices
3. APPLICATION: Applicera dessa på kundens situation
4. CONCLUSION: Ge tydlig, åtgärdbar slutsats

KÄRNPRINCIPER:
✓ Faktabaserad: Svara ENDAST baserat på faktisk data och dokumenterad funktionalitet
✓ Transparent: Om du inte vet något, säg det öppet - gissa aldrig
✓ Objektiv: Undvik bias, spekulationer och antaganden
✓ Konkret: Ge specifika, användbara råd - inte vaga generaliseringar
✓ Sanningsenlig: Ingen hallucination - bekräfta alltid källor

KOMMUNIKATIONSSTIL:
- Svensk professionell ton
- Kortfattad men komplett
- Strukturerad och tydlig
- Använd bullet points för klarhet
- Citera konkreta siffror och exempel när möjligt

FUNKTIONER DU KAN HJÄLPA MED:
• Analys av kunddata och beteendemönster
• Kapacitetsplanering och optimering
• Dynamisk prissättning
• Riskidentifiering (churn, no-shows)
• Marketing automation och triggers
• Staff scheduling och resursplanering
• Bokadirekt-integration och synkning
• Meta Marketing API
• SMS-kampanjer via 46elks
• AI-driven retention

OM DU INTE VET:
"Jag är inte säker på det. Jag rekommenderar att du kontaktar support eller kollar dokumentationen för [specifik funktion]."

VIKTIGT:
- Ge ALDRIG falsk information
- Förklara ALLTID dina resonemang
- Var TRANSPARENT om begränsningar
- Hänvisa till dokumentation när relevant`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      max_tokens: 2000, // Utökat kontextminne
      temperature: 0.3, // Låg temp = mindre hallucineringar, mer faktabaserat
      top_p: 0.9, // Fokuserad sampling
      frequency_penalty: 0.3, // Minska repetition
      presence_penalty: 0.2, // Uppmuntra variation utan att bli abstrakt
    });

    const aiResponse = response.choices[0]?.message?.content || 
      'Förlåt, jag kunde inte generera ett svar. Försök igen eller kontakta support.';

    return NextResponse.json({
      response: aiResponse,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('AI Chat error:', error);
    
    // Transparent error handling
    return NextResponse.json(
      { 
        error: 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
