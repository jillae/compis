
/**
 * 46elks API Client
 * Documentation: https://46elks.se/docs/
 */

interface ElksConfig {
  username: string;
  password: string;
}

interface SMSHistoryItem {
  id: string;
  from: string;
  to: string;
  message: string;
  direction: 'outgoing' | 'incoming';
  status: 'delivered' | 'failed' | 'sent' | 'buffered';
  created: string;
  parts: number;
  cost: number;
  delivered?: string;
  errorcode?: string;
}

interface DeliveryReport {
  id: string;
  status: 'delivered' | 'failed';
  delivered?: string;
  errorcode?: string;
}

interface CallHistoryItem {
  id: string;
  from: string;
  to: string;
  direction: 'outgoing' | 'incoming';
  state: 'success' | 'failed' | 'busy' | 'no-answer';
  created: string;
  duration: number;
  cost: number;
}

interface Recording {
  id: string;
  call: string;
  created: string;
  duration: number;
  file: string; // URL to download
  filetype: string;
}

export class FortySevenElksClient {
  private baseUrl = 'https://api.46elks.com/a1';
  private config: ElksConfig;

  constructor(config?: ElksConfig) {
    this.config = config || {
      username: process.env.FORTYSEVEN_ELKS_API_USERNAME || '',
      password: process.env.FORTYSEVEN_ELKS_API_PASSWORD || ''
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`46elks API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get SMS history
   * https://46elks.se/docs/sms-history
   */
  async getSMSHistory(params?: {
    start?: string; // ISO date or message ID
    limit?: number; // Max 100
  }): Promise<{ data: SMSHistoryItem[] }> {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    const endpoint = `/SMS${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ data: SMSHistoryItem[] }>(endpoint);
  }

  /**
   * Get specific SMS by ID
   */
  async getSMS(messageId: string): Promise<SMSHistoryItem> {
    return this.request<SMSHistoryItem>(`/SMS/${messageId}`);
  }

  /**
   * Get SMS delivery report
   * https://46elks.se/docs/sms-delivery-reports
   */
  async getDeliveryReport(messageId: string): Promise<DeliveryReport> {
    return this.request<DeliveryReport>(`/SMS/${messageId}`);
  }

  /**
   * Get call history
   * https://46elks.se/docs/call-history
   */
  async getCallHistory(params?: {
    start?: string;
    limit?: number;
  }): Promise<{ data: CallHistoryItem[] }> {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    const endpoint = `/Calls${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ data: CallHistoryItem[] }>(endpoint);
  }

  /**
   * Get specific call by ID
   */
  async getCall(callId: string): Promise<CallHistoryItem> {
    return this.request<CallHistoryItem>(`/Calls/${callId}`);
  }

  /**
   * Get recordings
   * https://46elks.se/docs/get-recordings
   */
  async getRecordings(params?: {
    start?: string;
    limit?: number;
  }): Promise<{ data: Recording[] }> {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    const endpoint = `/Recordings${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{ data: Recording[] }>(endpoint);
  }

  /**
   * Get specific recording by ID
   */
  async getRecording(recordingId: string): Promise<Recording> {
    return this.request<Recording>(`/Recordings/${recordingId}`);
  }

  /**
   * Download recording file
   */
  async downloadRecording(recordingUrl: string): Promise<Buffer> {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    
    const response = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Send SMS (for completeness)
   */
  async sendSMS(params: {
    from: string;
    to: string;
    message: string;
    whendelivered?: string; // Callback URL
    dontlog?: 'message'; // Privacy option
  }): Promise<SMSHistoryItem> {
    const body = new URLSearchParams({
      from: params.from,
      to: params.to,
      message: params.message,
      ...(params.whendelivered && { whendelivered: params.whendelivered }),
      ...(params.dontlog && { dontlog: params.dontlog }),
    });

    return this.request<SMSHistoryItem>('/SMS', {
      method: 'POST',
      body: body.toString(),
    });
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ balance: number }> {
    return this.request<{ balance: number }>('/Me');
  }
}

// Export singleton instance
export const elksClient = new FortySevenElksClient();
