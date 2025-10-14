
import { SMSProvider, SendSMSParams, SMSResult } from './types';
import { FortySevenElksProvider } from './providers/46elks';
import { TwilioProvider } from './providers/twilio';

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
   * Send SMS with automatic fallback to secondary providers
   */
  async send(params: SendSMSParams): Promise<SMSResult> {
    // Try primary provider first
    let result = await this.primaryProvider.send(params);
    
    if (result.success) {
      return result;
    }

    // Fallback to other providers if primary fails
    console.warn(`Primary provider ${this.primaryProvider.name} failed, trying fallback providers...`);
    
    for (const provider of this.providers.slice(1)) {
      result = await provider.send(params);
      if (result.success) {
        console.log(`Fallback provider ${provider.name} succeeded`);
        return result;
      }
    }

    // All providers failed
    return result;
  }

  /**
   * Send SMS to multiple recipients
   */
  async sendBulk(recipients: string[], message: string, from?: string): Promise<{
    successful: number;
    failed: number;
    results: SMSResult[];
  }> {
    const results = await Promise.all(
      recipients.map(to => this.send({ to, message, from }))
    );

    return {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
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
