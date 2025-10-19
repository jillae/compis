
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetSegment, campaignGoal, customContext, stats } = await request.json();

    // Build context-aware prompt
    const systemPrompt = `Du är en expert på SMS-marknadsföring för skönhets- och hälsokliniker i Sverige. 
Du hjälper klinikägare att skapa effektiva, personliga SMS-kampanjer som ökar kundengagemang och återvinner inaktiva kunder.

REGLER:
- SMS ska vara max 160 tecken
- Använd svensk ton (vänlig, professionell)
- Inkludera ett tydligt call-to-action
- Undvik överdrivet säljigt språk
- Personalisera efter målgrupp och mål
- Följ GDPR (kunder har givit samtycke)`;

    const userPrompt = `Generera 3 olika SMS-förslag för en kampanj med följande parametrar:

MÅLGRUPP: ${targetSegment} (${targetSegment === 'inactive' ? stats.inactive : targetSegment === 'active' ? stats.active : stats.total} kunder)
MÅL: ${campaignGoal}
EXTRA KONTEXT: ${customContext || 'Ingen extra kontext'}

KUND STATISTIK:
- Totalt: ${stats.total} kunder
- Aktiva: ${stats.active} kunder
- Inaktiva: ${stats.inactive} kunder

Svara ENDAST med ren JSON i detta format (ingen markdown, inga code blocks):
{
  "suggestions": [
    {
      "message": "SMS-meddelandet här",
      "tone": "vänlig/professionell/entusiastisk",
      "targetSegment": "${targetSegment}",
      "estimatedReach": antal_mottagare,
      "reasoning": "Kort förklaring varför detta meddelande fungerar"
    }
  ]
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Call Abacus LLM API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';
        let partialRead = '';

        try {
          while (true) {
            const { done, value } = await reader?.read() || { done: true, value: undefined };
            if (done) break;

            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Parse final JSON
                  const finalResult = JSON.parse(buffer);
                  const finalData = JSON.stringify({
                    status: 'completed',
                    result: finalResult
                  });
                  controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed.choices?.[0]?.delta?.content || '';
                  
                  // Send progress update
                  const progressData = JSON.stringify({
                    status: 'processing',
                    message: 'Generating SMS suggestions...'
                  });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SMS generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate SMS' 
    }, { status: 500 });
  }
}
