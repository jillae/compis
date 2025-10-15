
import { SMSProvider, SendSMSParams, SMSResult } from '../types';
import fs from 'fs';
import path from 'path';

export class FortySevenElksProvider implements SMSProvider {
  name = '46elks';
  private username: string;
  private password: string;
  private apiUrl = 'https://api.46elks.com/a1/sms';

  constructor() {
    // Load credentials from auth secrets file
    const secretsPath = path.join(process.env.HOME || '/home/ubuntu', '.config/abacusai_auth_secrets.json');
    
    try {
      const secretsData = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
      const elksSecrets = secretsData['46elks']?.secrets;
      
      this.username = elksSecrets?.api_username?.value || '';
      this.password = elksSecrets?.api_password?.value || '';
      
      if (!this.username || !this.password) {
        throw new Error('46elks credentials not found');
      }
    } catch (error) {
      console.error('Error loading 46elks credentials:', error);
      throw new Error('Failed to load 46elks credentials');
    }
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
        bodyData.whendelivered = 'https://flow.abacusai.app/api/webhooks/46elks/delivery';
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
