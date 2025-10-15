
import { SMSProvider, SendSMSParams, SMSResult } from './types';
import { FortySevenElksProvider } from './providers/46elks';
import { TwilioProvider } from './providers/twilio';
import { SMSRateLimiter } from './rate-limiter';
import { SMSConsentChecker, MessageCategory } from './consent-checker';
import { prisma } from '@/lib/db';

export interface EnhancedSendParams extends SendSMSParams {
  clinicId: string;
  customerId?: string;
  campaignId?: string;
  category?: MessageCategory;
  skipConsentCheck?: boolean;
  skipRateLimitCheck?: boolean;
}

export class SMSService {
  private providers: SMSProvider[];
  private primaryProvider: SMSProvider;

  constructor() {
    // Initialize providers with 46elks as primary
    this.providers = [
      new FortySevenElksProvider(),
      new TwilioProvider(),
    ];
    
    this.primaryProvider = this.providers[0];
  }

  /**
   * Send SMS with rate limiting, consent checking, and retry logic
   */
  async sendEnhanced(params: EnhancedSendParams): Promise<SMSResult> {
    const { 
      clinicId, 
      customerId, 
      campaignId,
      category = 'marketing',
      skipConsentCheck = false,
      skipRateLimitCheck = false,
      ...smsParams 
    } = params;

    // Check rate limits
    if (!skipRateLimitCheck) {
      const rateLimitCheck = await SMSRateLimiter.canSend(clinicId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason || 'Rate limit exceeded',
          provider: 'rate-limiter'
        };
      }
    }

    // Check consent
    if (customerId && !skipConsentCheck) {
      const consentCheck = await SMSConsentChecker.canSendTo(customerId, category);
      if (!consentCheck.allowed) {
        // Log blocked SMS
        await this.logSMS({
          clinicId,
          customerId,
          campaignId,
          direction: 'outbound',
          from: smsParams.from || 'KlinikFlow',
          to: smsParams.to,
          message: smsParams.message,
          provider: 'blocked',
          status: 'stopped',
          failureReason: consentCheck.reason
        });

        return {
          success: false,
          error: consentCheck.reason || 'Customer has not consented',
          provider: 'consent-checker'
        };
      }
    }

    // Create pending log entry
    const smsLog = await this.logSMS({
      clinicId,
      customerId,
      campaignId,
      direction: 'outbound',
      from: smsParams.from || 'KlinikFlow',
      to: smsParams.to,
      message: smsParams.message,
      provider: this.primaryProvider.name,
      status: 'pending'
    });

    // Try to send with retry logic
    const result = await this.sendWithRetry(smsParams, smsLog.id);

    // Update log with result
    await prisma.sMSLog.update({
      where: { id: smsLog.id },
      data: {
        status: result.success ? 'sent' : 'failed',
        providerId: result.messageId,
        providerStatus: result.success ? 'sent' : 'failed',
        cost: result.cost,
        parts: result.parts,
        failedAt: result.success ? null : new Date(),
        failureReason: result.error
      }
    });

    // Increment rate limit counters on success
    if (result.success && !skipRateLimitCheck) {
      await SMSRateLimiter.incrementCounters(clinicId);
    }

    return result;
  }

  /**
   * Send SMS with automatic retry on failure
   */
  private async sendWithRetry(
    params: SendSMSParams, 
    logId: string,
    maxRetries: number = 3
  ): Promise<SMSResult> {
    let lastResult: SMSResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Try primary provider first
      lastResult = await this.primaryProvider.send(params);
      
      if (lastResult.success) {
        return lastResult;
      }

      // Update retry count in log
      await prisma.sMSLog.update({
        where: { id: logId },
        data: {
          retryCount: attempt + 1,
          nextRetryAt: attempt < maxRetries 
            ? new Date(Date.now() + (attempt + 1) * 60000) // Exponential backoff
            : null
        }
      });

      // Wait before retry (exponential backoff: 1min, 2min, 4min)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 60000));
      }
    }

    // All retries failed, try fallback providers
    console.warn(`Primary provider ${this.primaryProvider.name} failed after ${maxRetries} retries, trying fallback providers...`);
    
    for (const provider of this.providers.slice(1)) {
      lastResult = await provider.send(params);
      if (lastResult.success) {
        console.log(`Fallback provider ${provider.name} succeeded`);
        
        // Update provider in log
        await prisma.sMSLog.update({
          where: { id: logId },
          data: { provider: provider.name }
        });
        
        return lastResult;
      }
    }

    // All providers failed
    return lastResult!;
  }

  /**
   * Legacy send method (for backwards compatibility)
   */
  async send(params: SendSMSParams): Promise<SMSResult> {
    return await this.primaryProvider.send(params);
  }

  /**
   * Send SMS to multiple recipients with consent and rate limit checks
   */
  async sendBulk(
    recipients: string[], 
    message: string, 
    from?: string,
    options?: {
      clinicId: string;
      campaignId?: string;
      category?: MessageCategory;
    }
  ): Promise<{
    successful: number;
    failed: number;
    blocked: number;
    results: SMSResult[];
  }> {
    if (!options?.clinicId) {
      // Legacy mode without rate limiting
      const results = await Promise.all(
        recipients.map(to => this.send({ to, message, from }))
      );

      return {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        blocked: 0,
        results
      };
    }

    // Enhanced mode with all checks
    const results = await Promise.all(
      recipients.map(async (to) => {
        // Try to find customer by phone
        const customer = await prisma.customer.findFirst({
          where: {
            clinicId: options.clinicId,
            OR: [
              { phone: to },
              { phone: to.replace('+', '') },
              { phone: to.replace('+46', '0') }
            ]
          }
        });

        return await this.sendEnhanced({
          to,
          message,
          from,
          clinicId: options.clinicId,
          customerId: customer?.id,
          campaignId: options.campaignId,
          category: options.category
        });
      })
    );

    return {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success && r.provider !== 'consent-checker').length,
      blocked: results.filter(r => !r.success && r.provider === 'consent-checker').length,
      results
    };
  }

  /**
   * Log SMS to database
   */
  private async logSMS(data: {
    clinicId: string;
    customerId?: string;
    campaignId?: string;
    direction: 'outbound' | 'inbound';
    from: string;
    to: string;
    message: string;
    provider: string;
    providerId?: string;
    status: string;
    cost?: number;
    parts?: number;
    failureReason?: string;
  }) {
    return await prisma.sMSLog.create({
      data: {
        clinicId: data.clinicId,
        customerId: data.customerId,
        campaignId: data.campaignId,
        direction: data.direction,
        from: data.from,
        to: data.to,
        message: data.message,
        provider: data.provider,
        providerId: data.providerId,
        status: data.status,
        cost: data.cost,
        parts: data.parts || 1,
        failureReason: data.failureReason
      }
    });
  }

  /**
   * Format phone number to E.164 format
   */
  static formatPhoneNumber(phone: string, countryCode = '46'): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      cleaned = countryCode + cleaned.substring(1);
    }
    
    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    // Basic validation for Swedish phone numbers
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

// Export singleton instance
export const smsService = new SMSService();
