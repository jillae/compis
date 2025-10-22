
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY,
  baseURL: 'https://api.abacus.ai/v1',
});

export interface CustomerContext {
  name: string;
  phone: string;
  currentStamps?: number;
  stampsRequired?: number;
  rewardDescription?: string;
  isCompleted?: boolean;
  programName?: string;
}

export async function generateAIResponse(
  userMessage: string,
  customerContext?: CustomerContext,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
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

${customerContext ? `
KUNDINFORMATION:
- Namn: ${customerContext.name}
- Telefon: ${customerContext.phone}
${customerContext.programName ? `- Program: ${customerContext.programName}` : ''}
${customerContext.currentStamps !== undefined ? `- Nuvarande stämplar: ${customerContext.currentStamps}/${customerContext.stampsRequired}` : ''}
${customerContext.rewardDescription ? `- Belöning: ${customerContext.rewardDescription}` : ''}
${customerContext.isCompleted ? '- Status: Alla stämplar samlade! Belöning tillgänglig.' : ''}
` : ''}

OM DU INTE VET:
"Jag är inte säker på det. Jag rekommenderar att du kontaktar support eller kollar dokumentationen."

VIKTIGT:
- Ge ALDRIG falsk information
- Förklara ALLTID dina resonemang
- Var TRANSPARENT om begränsningar`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      max_tokens: 2000, // Utökat kontextminne
      temperature: 0.3, // Låg temp = mindre hallucineringar
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
    });

    return response.choices[0]?.message?.content || 'Förlåt, jag kunde inte generera ett svar.';
  } catch (error) {
    console.error('AI response error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export async function generateSpeech(text: string): Promise<Buffer> {
  try {
    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Female Swedish-sounding voice
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('TTS error:', error);
    throw new Error('Failed to generate speech');
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Note: OpenAI's transcription requires a file-like object
    // In a real implementation, you'd save the buffer temporarily or use a different approach
    const response = await client.audio.transcriptions.create({
      file: audioBuffer as any,
      model: 'whisper-1',
      language: 'sv',
    });

    return response.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}
