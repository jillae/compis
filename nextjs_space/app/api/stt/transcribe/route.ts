
/**
 * STT Transcription API - Main endpoint for speech-to-text
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('file') as File | null;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    const clinicId = session.user.clinicId || 'unknown';

    // Get active providers ordered by priority
    const providers = await prisma.$queryRaw<any[]>`
      SELECT * FROM stt_provider_config 
      WHERE is_active = true 
      ORDER BY priority_order ASC
    `;

    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'No active STT providers configured' },
        { status: 503 }
      );
    }

    let lastError: string | null = null;

    // Try each provider in order
    for (const provider of providers) {
      try {
        console.log(`[STT API] Attempting with ${provider.display_name}`);
        
        const result = await transcribeWithProvider(audioFile, provider);
        
        // Log success
        await prisma.$executeRaw`
          INSERT INTO stt_provider_usage_logs 
          (id, clinic_id, provider_id, audio_duration_seconds, processing_time_seconds, success, fallback_used, created_at)
          VALUES (
            gen_random_uuid()::text,
            ${clinicId},
            ${provider.id},
            ${result.duration || 0},
            ${result.processing_time || 0},
            true,
            ${provider.priority_order > 1},
            NOW()
          )
        `;

        return NextResponse.json({
          success: true,
          text: result.text,
          language: result.language,
          duration: result.duration,
          processing_time: result.processing_time || null,
          confidence: result.confidence || null,
          word_count: result.word_count || null,
          provider_used: provider.display_name,
          fallback_used: provider.priority_order > 1
        });

      } catch (error: any) {
        console.error(`[STT API] ${provider.display_name} failed:`, error.message);
        lastError = error.message;
        
        // Log failure
        await prisma.$executeRaw`
          INSERT INTO stt_provider_usage_logs 
          (id, clinic_id, provider_id, success, fallback_used, error_message, created_at)
          VALUES (
            gen_random_uuid()::text,
            ${clinicId},
            ${provider.id},
            false,
            true,
            ${error.message},
            NOW()
          )
        `;
        
        // Continue to next provider
        continue;
      }
    }

    return NextResponse.json(
      { error: `All STT providers failed. Last error: ${lastError}` },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('[STT API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

async function transcribeWithProvider(audioFile: File, provider: any) {
  const config = provider.config_json || {};

  if (provider.provider_name === 'OPENAI') {
    return await transcribeWithOpenAI(audioFile, config);
  } else if (provider.provider_name === 'KB_WHISPER_FLOW_SPEAK' || provider.provider_name === 'KB_WHISPER_PUDUN') {
    return await transcribeWithKBWhisper(audioFile, provider, config);
  } else {
    throw new Error(`Unknown provider: ${provider.provider_name}`);
  }
}

async function transcribeWithOpenAI(audioFile: File, config: any) {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('model', config.model || 'whisper-1');
  formData.append('language', config.language || 'sv');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    text: data.text,
    language: config.language || 'sv',
    duration: data.duration,
    processing_time: null,
    confidence: null,
    word_count: data.text?.split(' ').length || null
  };
}

async function transcribeWithKBWhisper(audioFile: File, provider: any, config: any) {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('language', config.language || 'sv');

  if (config.beam_size) {
    formData.append('beam_size', config.beam_size.toString());
  }

  const url = `${provider.api_endpoint}:${provider.port}/transcribe`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`KB-Whisper error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    text: data.text,
    language: data.language || 'sv',
    duration: data.duration,
    processing_time: data.processing_time,
    confidence: data.confidence,
    word_count: data.word_count || data.text?.split(' ').length
  };
}
