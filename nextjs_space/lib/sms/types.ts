
// SMS Provider Types
export interface SMSProvider {
  name: string;
  send(params: SendSMSParams): Promise<SMSResult>;
}

export interface SendSMSParams {
  to: string; // Phone number in E.164 format (+46701234567)
  message: string;
  from?: string; // Sender ID (optional)
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  cost?: number;
  parts?: number;
}

export interface SMSTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
}

export interface CampaignSMSParams {
  customerIds: string[];
  templateId: string;
  variables?: Record<string, string>;
  scheduledAt?: Date;
}
