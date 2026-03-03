
import { SMSProvider, SendSMSParams, SMSResult } from '../types';

export class FortySevenElksProvider implements SMSProvider {
  name = '46elks';
  private username: string;
  private password: string;
  private apiUrl = 'https://api.46elks.com/a1/sms';

  constructor() {
    this.username = process.env.FORTYSEVEN_ELKS_API_USERNAME || '';
    this.password = process.env.FORTYSEVEN_ELKS_API_PASSWORD || '';
  }

  async send(params: SendSMSParams): Promise<SMSResult> {
    try {
      const { to, message, from = 'KlinikFlow' } = params;

      // Validate phone number format
      if (!to.startsWith('+')) {
        return {
          success: false,
          error: 'Phone number must be in E.164 format (+46701234567)',
          provider: this.name
        };
      }

      // Prepare request body
      const bodyData: Record<string, string> = {
        from,
        to,
        message,
      };

      // Add delivery receipt webhook (only in production)
      if (process.env.NODE_ENV === 'production' || process.env.ENABLE_46ELKS_WEBHOOKS === 'true') {
        bodyData.whendelivered = `${process.env.NEXTAUTH_URL || 'https://goto.klinikflow.app'}/api/webhooks/46elks/delivery`;
      }

      const body = new URLSearchParams(bodyData);

      // Send SMS via 46elks API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to send SMS',
          provider: this.name
        };
      }

      return {
        success: true,
        messageId: data.id,
        provider: this.name,
        cost: data.cost ? parseFloat(data.cost) : undefined,
        parts: data.parts || 1
      };
    } catch (error) {
      console.error('46elks SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name
      };
    }
  }
}
