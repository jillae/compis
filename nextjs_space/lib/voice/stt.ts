
/**
 * STT Provider Service - Speech-to-Text with KB-Whisper and OpenAI fallback
 * Implements automatic fallback mechanism for reliable transcription
 */

export enum STTProvider {
  OPENAI = 'OPENAI',
  KB_WHISPER_PUDUN = 'KB_WHISPER_PUDUN',
  KB_WHISPER_FLOW_SPEAK = 'KB_WHISPER_FLOW_SPEAK'
}

export interface STTProviderConfig {
  id: string;
  provider_name: STTProvider;
  display_name: string;
  api_endpoint: string | null;
  port: number | null;
  is_active: boolean;
  priority_order: number;
  max_retry_attempts: number;
  timeout_seconds: number;
  config_json: Record<string, any>;
}

export interface STTResponse {
  text: string;
  language: string;
  duration?: number;
  processing_time?: number;
  confidence?: number;
  word_count?: number;
  provider_used: string;
  fallback_used?: boolean;
}

export interface STTRequest {
  audioFile: File | Blob;
  language?: string;
  provider?: STTProvider;
}

/**
 * Main STT Provider Service class
 */
export class STTProviderService {
  
  /**
   * Fetch active providers ordered by priority
   */
  async getActiveProviders(): Promise<STTProviderConfig[]> {
    const response = await fetch('/api/stt/providers');
    
    if (!response.ok) {
      throw new Error('Failed to fetch STT providers');
    }
    
    const data = await response.json();
    return data.providers || [];
  }

  /**
   * Main transcription method with automatic fallback
   */
  async transcribe(
    audioFile: File | Blob,
    clinicId?: string
  ): Promise<STTResponse> {
    const providers = await this.getActiveProviders();
    
    if (providers.length === 0) {
      throw new Error('No active STT providers configured');
    }

    let lastError: Error | null = null;
    
    for (const provider of providers) {
      try {
        console.log(`[STT] Attempting transcription with: ${provider.display_name}`);
        
        const result = await this.transcribeWithProvider(audioFile, provider);
        
        console.log(`[STT] Success with ${provider.display_name}`);
        
        // Log success to backend
        if (clinicId) {
          await this.logUsage(clinicId, provider.id, result, true, provider.priority_order > 1);
        }
        
        return {
          ...result,
          provider_used: provider.display_name,
          fallback_used: provider.priority_order > 1
        };
        
      } catch (error: any) {
        console.error(`[STT] Provider ${provider.display_name} failed:`, error.message);
        lastError = error;
        
        // Log failure to backend
        if (clinicId) {
          await this.logUsage(clinicId, provider.id, null, false, true, error.message);
        }
        
        // Continue to next provider (fallback)
        continue;
      }
    }
    
    throw new Error(`All STT providers failed. Last error: ${lastError?.message || 'Unknown'}`);
  }

  /**
   * Provider-specific transcription
   */
  private async transcribeWithProvider(
    audioFile: File | Blob,
    provider: STTProviderConfig
  ): Promise<Omit<STTResponse, 'provider_used' | 'fallback_used'>> {
    
    switch (provider.provider_name) {
      case STTProvider.OPENAI:
        return await this.transcribeWithOpenAI(audioFile, provider);
      
      case STTProvider.KB_WHISPER_FLOW_SPEAK:
      case STTProvider.KB_WHISPER_PUDUN:
        return await this.transcribeWithKBWhisper(audioFile, provider);
      
      default:
        throw new Error(`Unknown provider: ${provider.provider_name}`);
    }
  }

  /**
   * OpenAI Whisper implementation
   */
  private async transcribeWithOpenAI(
    audioFile: File | Blob,
    provider: STTProviderConfig
  ): Promise<any> {
    
    const formData = new FormData();
    formData.append('file', audioFile, 'audio.mp3');
    formData.append('model', provider.config_json.model || 'whisper-1');
    formData.append('language', provider.config_json.language || 'sv');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout_seconds * 1000);

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      return {
        text: data.text,
        language: provider.config_json.language || 'sv',
        duration: data.duration
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('OpenAI request timeout');
      }
      
      throw error;
    }
  }

  /**
   * KB-Whisper implementation (both Pudun and Flow-Speak)
   */
  private async transcribeWithKBWhisper(
    audioFile: File | Blob,
    provider: STTProviderConfig
  ): Promise<any> {
    
    const formData = new FormData();
    formData.append('file', audioFile, 'audio.mp3');
    formData.append('language', provider.config_json.language || 'sv');

    // Add optional parameters
    if (provider.config_json.beam_size) {
      formData.append('beam_size', provider.config_json.beam_size.toString());
    }
    
    if (provider.config_json.best_of) {
      formData.append('best_of', provider.config_json.best_of.toString());
    }

    const url = `${provider.api_endpoint}:${provider.port}/transcribe`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout_seconds * 1000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`KB-Whisper API error: ${response.status} ${response.statusText} - ${errorText}`);
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('KB-Whisper request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Log usage to backend
   */
  private async logUsage(
    clinicId: string,
    providerId: string,
    result: any,
    success: boolean,
    fallbackUsed: boolean,
    errorMessage?: string
  ) {
    try {
      await fetch('/api/stt/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clinicId,
          providerId,
          audio_duration_seconds: result?.duration,
          processing_time_seconds: result?.processing_time,
          success,
          fallback_used: fallbackUsed,
          error_message: errorMessage || null
        })
      });
    } catch (error) {
      console.error('[STT] Failed to log usage:', error);
      // Don't throw - logging should not break the main flow
    }
  }
}

// Export singleton instance
export const sttProviderService = new STTProviderService();
