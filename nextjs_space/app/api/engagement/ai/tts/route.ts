
/**
 * Text-to-Speech API
 * Konverterar text till tal med svensk röst
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text required' }, { status: 400 });
    }

    // Använd AbacusAI för TTS
    const response = await fetch('https://apps.abacus.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // En av de bästa rösterna för svenska
        response_format: 'mp3',
        speed: 1.0
      })
    });

    if (!response.ok) {
      throw new Error('TTS API request failed');
    }

    // Returnera audio som stream
    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
