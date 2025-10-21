/**
 * 46elks Subaccount Management Service
 * Docs: https://46elks.se/docs/create-subaccount
 */

import fs from 'fs';
import path from 'path';

interface SubaccountCredentials {
  username: string;
  password: string;
}

interface CreateSubaccountParams {
  clinicId: string;
  clinicName: string;
}

interface Subaccount {
  id: string;
  name: string;
  created: string;
  status: 'active' | 'inactive';
}

export class SubaccountService {
  private baseUrl = 'https://api.46elks.com/a1';
  private credentials: SubaccountCredentials;

  constructor() {
    // Load master account credentials
    const secretsPath = path.join(
      process.env.HOME || '/home/ubuntu',
      '.config/abacusai_auth_secrets.json'
    );

    try {
      const secretsData = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
      const elksSecrets = secretsData['46elks']?.secrets;

      this.credentials = {
        username: elksSecrets?.api_username?.value || '',
        password: elksSecrets?.api_password?.value || '',
      };

      if (!this.credentials.username || !this.credentials.password) {
        throw new Error('46elks master credentials not found');
      }
    } catch (error) {
      console.error('Error loading 46elks credentials:', error);
      throw new Error('Failed to load 46elks credentials');
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const auth = Buffer.from(
      `${this.credentials.username}:${this.credentials.password}`
    ).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
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
   * Create a new subaccount for a clinic
   * https://46elks.se/docs/create-subaccount
   */
  async createSubaccount(params: CreateSubaccountParams): Promise<{
    subaccountId: string;
    username: string;
    password: string;
  }> {
    const { clinicId, clinicName } = params;

    const body = new URLSearchParams({
      name: `${clinicName} (ID: ${clinicId})`,
      // Optional: Set initial balance, permissions, etc.
    });

    const response = await this.request<{
      id: string;
      api_username: string;
      api_password: string;
      name: string;
      created: string;
    }>('/subaccounts', {
      method: 'POST',
      body: body.toString(),
    });

    return {
      subaccountId: response.id,
      username: response.api_username,
      password: response.api_password,
    };
  }

  /**
   * Get all subaccounts
   * https://46elks.se/docs/get-subaccounts
   */
  async listSubaccounts(): Promise<Subaccount[]> {
    const response = await this.request<{ data: Subaccount[] }>('/subaccounts');
    return response.data;
  }

  /**
   * Get specific subaccount
   */
  async getSubaccount(subaccountId: string): Promise<Subaccount> {
    return this.request<Subaccount>(`/subaccounts/${subaccountId}`);
  }

  /**
   * Update subaccount settings
   * https://46elks.se/docs/update-subaccount
   */
  async updateSubaccount(
    subaccountId: string,
    updates: {
      name?: string;
      status?: 'active' | 'inactive';
    }
  ): Promise<Subaccount> {
    const body = new URLSearchParams();
    if (updates.name) body.append('name', updates.name);
    if (updates.status) body.append('status', updates.status);

    return this.request<Subaccount>(`/subaccounts/${subaccountId}`, {
      method: 'PUT',
      body: body.toString(),
    });
  }

  /**
   * Test subaccount credentials
   */
  async testSubaccount(username: string, password: string): Promise<boolean> {
    try {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');

      const response = await fetch(`${this.baseUrl}/Me`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Subaccount test failed:', error);
      return false;
    }
  }
}

// Export singleton
export const subaccountService = new SubaccountService();
