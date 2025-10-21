
/**
 * 46elks Subaccount Management Service
 * 
 * Manages subaccounts for each clinic to provide:
 * - Isolated API credentials per clinic
 * - Separate billing tracking
 * - Usage analytics per clinic
 * 
 * Documentation: https://46elks.se/docs/subaccounts
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

interface SubaccountCreateParams {
  clinicId: string;
  clinicName: string;
}

interface SubaccountResponse {
  id: string; // usXXXXXXXX format
  name: string;
  username: string; // API username for subaccount
  password: string; // API password for subaccount
  created: string; // ISO timestamp
  balance?: number;
}

interface SubaccountListResponse {
  data: SubaccountResponse[];
}

/**
 * 46elks Subaccounts API Client
 */
class ElksSubaccountClient {
  private baseUrl = 'https://api.46elks.com/a1';
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.FORTYSEVEN_ELKS_API_USERNAME || '';
    this.password = process.env.FORTYSEVEN_ELKS_API_PASSWORD || '';

    if (!this.username || !this.password) {
      throw new Error('46elks credentials not configured. Set FORTYSEVEN_ELKS_API_USERNAME and FORTYSEVEN_ELKS_API_PASSWORD');
    }
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    
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
   * Create a new subaccount
   * POST /subaccounts
   */
  async createSubaccount(name: string): Promise<SubaccountResponse> {
    const body = new URLSearchParams({ name });

    return this.request<SubaccountResponse>('/subaccounts', {
      method: 'POST',
      body: body.toString(),
    });
  }

  /**
   * List all subaccounts
   * GET /subaccounts
   */
  async listSubaccounts(): Promise<SubaccountListResponse> {
    return this.request<SubaccountListResponse>('/subaccounts');
  }

  /**
   * Get subaccount by ID
   * GET /subaccounts/{id}
   */
  async getSubaccount(subaccountId: string): Promise<SubaccountResponse> {
    return this.request<SubaccountResponse>(`/subaccounts/${subaccountId}`);
  }

  /**
   * Get subaccount balance
   * GET /subaccounts/{id}/Me
   */
  async getSubaccountBalance(subaccountId: string): Promise<{ balance: number }> {
    return this.request<{ balance: number }>(`/subaccounts/${subaccountId}/Me`);
  }
}

/**
 * Encryption utilities for storing credentials
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || '';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Create a subaccount for a clinic
 */
export async function createSubaccountForClinic(
  params: SubaccountCreateParams
): Promise<{
  success: boolean;
  subaccountId?: string;
  error?: string;
}> {
  try {
    const { clinicId, clinicName } = params;

    // Check if clinic already has a subaccount
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { elksSubaccountId: true },
    });

    if (!clinic) {
      return { success: false, error: 'Clinic not found' };
    }

    if (clinic.elksSubaccountId) {
      return {
        success: false,
        error: 'Clinic already has a subaccount',
      };
    }

    // Create subaccount via 46elks API
    const client = new ElksSubaccountClient();
    const subaccount = await client.createSubaccount(clinicName);

    // Encrypt credentials
    const encryptedKey = encrypt(subaccount.username);
    const encryptedSecret = encrypt(subaccount.password);

    // Save to database
    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        elksSubaccountId: subaccount.id,
        elksSubaccountKey: encryptedKey,
        elksSubaccountSecret: encryptedSecret,
        elksCreatedAt: new Date(subaccount.created),
      },
    });

    return {
      success: true,
      subaccountId: subaccount.id,
    };
  } catch (error: any) {
    console.error('Failed to create 46elks subaccount:', error);
    return {
      success: false,
      error: error.message || 'Failed to create subaccount',
    };
  }
}

/**
 * Get all subaccounts (SuperAdmin only)
 */
export async function listAllSubaccounts(): Promise<{
  success: boolean;
  subaccounts?: Array<{
    clinicId: string;
    clinicName: string;
    subaccountId: string | null;
    createdAt: Date | null;
  }>;
  error?: string;
}> {
  try {
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        elksSubaccountId: true,
        elksCreatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const subaccounts = clinics.map(clinic => ({
      clinicId: clinic.id,
      clinicName: clinic.name,
      subaccountId: clinic.elksSubaccountId,
      createdAt: clinic.elksCreatedAt,
    }));

    return { success: true, subaccounts };
  } catch (error: any) {
    console.error('Failed to list subaccounts:', error);
    return {
      success: false,
      error: error.message || 'Failed to list subaccounts',
    };
  }
}

/**
 * Get subaccount details for a clinic
 */
export async function getClinicSubaccount(clinicId: string): Promise<{
  success: boolean;
  subaccount?: {
    id: string;
    username: string;
    password: string;
    createdAt: Date;
  };
  error?: string;
}> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        elksSubaccountId: true,
        elksSubaccountKey: true,
        elksSubaccountSecret: true,
        elksCreatedAt: true,
      },
    });

    if (!clinic || !clinic.elksSubaccountId) {
      return { success: false, error: 'Subaccount not found' };
    }

    // Decrypt credentials
    const username = decrypt(clinic.elksSubaccountKey!);
    const password = decrypt(clinic.elksSubaccountSecret!);

    return {
      success: true,
      subaccount: {
        id: clinic.elksSubaccountId,
        username,
        password,
        createdAt: clinic.elksCreatedAt!,
      },
    };
  } catch (error: any) {
    console.error('Failed to get subaccount:', error);
    return {
      success: false,
      error: error.message || 'Failed to get subaccount',
    };
  }
}

/**
 * Delete subaccount (soft delete - keeps ID but removes credentials)
 */
export async function deleteSubaccountForClinic(clinicId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        elksSubaccountKey: null,
        elksSubaccountSecret: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete subaccount:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete subaccount',
    };
  }
}

/**
 * Get 46elks client configured for a specific clinic's subaccount
 */
export async function getClinicElksClient(clinicId: string) {
  const result = await getClinicSubaccount(clinicId);
  
  if (!result.success || !result.subaccount) {
    throw new Error('Failed to get clinic subaccount credentials');
  }

  const { FortySevenElksClient } = await import('./client');
  return new FortySevenElksClient({
    username: result.subaccount.username,
    password: result.subaccount.password,
  });
}
