
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

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    // Convert to buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a File-like object for OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    const response = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'sv',
    });

    return NextResponse.json({
      text: response.text,
    });
  } catch (error: any) {
    console.error('STT error:', error);
    return NextResponse.json(
      { 
        error: 'Transkribering misslyckades. Försök igen.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
