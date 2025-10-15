
// TTS Provider Implementation (OpenAI + ElevenLabs)

import { TTSProvider } from '@prisma/client';

export interface TTSRequest {
  text: string;
  provider: TTSProvider;
  config: {
    // OpenAI
    openaiApiKey?: string;
    openaiVoice?: string;
    openaiModel?: string;
    openaiSpeed?: number;
    openaiFormat?: string;
    
    // ElevenLabs
    elevenlabsApiKey?: string;
    elevenlabsVoiceId?: string;
    elevenlabsSpeed?: number;
    elevenlabsFormat?: string;
  };
  timeoutMs?: number;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBuffer?: Buffer;
  provider: TTSProvider;
  error?: string;
  latencyMs?: number;
}

/**
 * Generate speech from text using OpenAI TTS
 */
export async function generateSpeechOpenAI(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.config.openaiApiKey || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.config.openaiModel || 'tts-1',
        input: request.text,
        voice: request.config.openaiVoice || 'nova',
        speed: request.config.openaiSpeed || 1.0,
        response_format: request.config.openaiFormat || 'mp3',
      }),
      signal: request.timeoutMs ? AbortSignal.timeout(request.timeoutMs) : undefined,
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS failed: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      audioBuffer,
      provider: TTSProvider.OPENAI,
      latencyMs,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: TTSProvider.OPENAI,
      error: error.message,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Generate speech from text using ElevenLabs TTS
 */
export async function generateSpeechElevenLabs(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now();
  
  try {
    const voiceId = request.config.elevenlabsVoiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': request.config.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: request.config.elevenlabsSpeed || 1.0,
          },
        }),
        signal: request.timeoutMs ? AbortSignal.timeout(request.timeoutMs) : undefined,
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      audioBuffer,
      provider: TTSProvider.ELEVENLABS,
      latencyMs,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: TTSProvider.ELEVENLABS,
      error: error.message,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Generate speech with automatic fallback
 */
export async function generateSpeechWithFallback(
  text: string,
  primaryProvider: TTSProvider,
  config: TTSRequest['config'],
  enableFallback: boolean = true,
  fallbackTimeoutMs: number = 5000
): Promise<TTSResponse> {
  // Try primary provider
  const primaryRequest: TTSRequest = {
    text,
    provider: primaryProvider,
    config,
    timeoutMs: fallbackTimeoutMs,
  };

  const primaryResult = primaryProvider === TTSProvider.OPENAI
    ? await generateSpeechOpenAI(primaryRequest)
    : await generateSpeechElevenLabs(primaryRequest);

  if (primaryResult.success) {
    return primaryResult;
  }

  // If primary failed and fallback is enabled, try fallback provider
  if (enableFallback) {
    const fallbackProvider = primaryProvider === TTSProvider.OPENAI 
      ? TTSProvider.ELEVENLABS 
      : TTSProvider.OPENAI;

    const fallbackRequest: TTSRequest = {
      text,
      provider: fallbackProvider,
      config,
      timeoutMs: fallbackTimeoutMs,
    };

    const fallbackResult = fallbackProvider === TTSProvider.OPENAI
      ? await generateSpeechOpenAI(fallbackRequest)
      : await generateSpeechElevenLabs(fallbackRequest);

    return {
      ...fallbackResult,
      error: fallbackResult.error 
        ? `Primary (${primaryProvider}) failed: ${primaryResult.error}. Fallback (${fallbackProvider}) failed: ${fallbackResult.error}`
        : `Primary (${primaryProvider}) failed: ${primaryResult.error}. Fallback (${fallbackProvider}) succeeded.`,
    };
  }

  return primaryResult;
}
