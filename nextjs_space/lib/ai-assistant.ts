
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
    const systemPrompt = `Du är en vänlig och hjälpsam AI-assistent för Klinik Flow Control's lojalitetsprogram. 
    
Din uppgift är att hjälpa kunder med:
- Information om deras stämpelkort och poäng
- Hur lojalitetsprogrammet fungerar
- När de kan få sina belöningar
- Boka tider och svara på vanliga frågor

Viktiga regler:
- Svara alltid på svenska
- Var kortfattad och tydlig
- Var vänlig och professionell
- Om du inte vet svaret, erkänn det och be kunden kontakta kliniken direkt

${customerContext ? `
KUNDINFORMATION:
- Namn: ${customerContext.name}
- Telefon: ${customerContext.phone}
${customerContext.programName ? `- Program: ${customerContext.programName}` : ''}
${customerContext.currentStamps !== undefined ? `- Nuvarande stämplar: ${customerContext.currentStamps}/${customerContext.stampsRequired}` : ''}
${customerContext.rewardDescription ? `- Belöning: ${customerContext.rewardDescription}` : ''}
${customerContext.isCompleted ? '- Status: Alla stämplar samlade! Belöning tillgänglig.' : ''}
` : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
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
