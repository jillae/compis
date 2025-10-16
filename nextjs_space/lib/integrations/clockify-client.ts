
/**
 * Clockify API Client
 * 
 * Wrapper for Clockify API v1
 * Docs: https://clockify.me/developers-api
 */

import axios, { AxiosInstance } from 'axios';

export interface ClockifyWorkspace {
  id: string;
  name: string;
  hourlyRate?: {
    amount: number;
    currency: string;
  };
}

export interface ClockifyUser {
  id: string;
  email: string;
  name: string;
  activeWorkspace: string;
  defaultWorkspace: string;
  status: string;
}

export interface ClockifyTimeEntry {
  id: string;
  description: string;
  start: string; // ISO 8601
  end?: string; // ISO 8601
  projectId?: string;
  taskId?: string;
  userId: string;
  workspaceId: string;
  billable: boolean;
  timeInterval: {
    start: string;
    end?: string;
    duration?: string; // ISO 8601 duration (e.g., "PT2H30M")
  };
}

export interface CreateTimeEntryInput {
  start: string; // ISO 8601 (e.g., "2025-10-16T09:00:00Z")
  end?: string; // ISO 8601
  description: string;
  projectId?: string;
  taskId?: string;
  billable?: boolean;
}

export interface UpdateTimeEntryInput {
  start?: string;
  end?: string;
  description?: string;
  billable?: boolean;
}

export interface TimeEntryQueryParams {
  start: string; // ISO 8601
  end: string; // ISO 8601
  description?: string;
  project?: string;
  task?: string;
  'page-size'?: number;
}

class ClockifyClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.clockify.me/api/v1',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<ClockifyUser> {
    const res = await this.client.get('/user');
    return res.data;
  }

  /**
   * Get all workspaces for the current user
   */
  async getWorkspaces(): Promise<ClockifyWorkspace[]> {
    const res = await this.client.get('/workspaces');
    return res.data;
  }

  /**
   * Get users in a workspace
   */
  async getUsers(workspaceId: string): Promise<ClockifyUser[]> {
    const res = await this.client.get(`/workspaces/${workspaceId}/users`);
    return res.data;
  }

  /**
   * Create a time entry
   */
  async createTimeEntry(
    workspaceId: string,
    data: CreateTimeEntryInput
  ): Promise<ClockifyTimeEntry> {
    const res = await this.client.post(
      `/workspaces/${workspaceId}/time-entries`,
      data
    );
    return res.data;
  }

  /**
   * Update a time entry
   */
  async updateTimeEntry(
    workspaceId: string,
    entryId: string,
    data: UpdateTimeEntryInput
  ): Promise<ClockifyTimeEntry> {
    const res = await this.client.put(
      `/workspaces/${workspaceId}/time-entries/${entryId}`,
      data
    );
    return res.data;
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(workspaceId: string, entryId: string): Promise<void> {
    await this.client.delete(
      `/workspaces/${workspaceId}/time-entries/${entryId}`
    );
  }

  /**
   * Get time entries for a user
   */
  async getTimeEntries(
    workspaceId: string,
    userId: string,
    params: TimeEntryQueryParams
  ): Promise<ClockifyTimeEntry[]> {
    const res = await this.client.get(
      `/workspaces/${workspaceId}/user/${userId}/time-entries`,
      { params }
    );
    return res.data;
  }

  /**
   * Stop currently running time entry
   */
  async stopTimeEntry(
    workspaceId: string,
    userId: string
  ): Promise<ClockifyTimeEntry | null> {
    const res = await this.client.patch(
      `/workspaces/${workspaceId}/user/${userId}/time-entries`,
      { end: new Date().toISOString() }
    );
    return res.data;
  }

  /**
   * Get currently running time entry
   */
  async getRunningTimeEntry(
    workspaceId: string,
    userId: string
  ): Promise<ClockifyTimeEntry | null> {
    try {
      const res = await this.client.get(
        `/workspaces/${workspaceId}/user/${userId}/time-entries?in-progress=true`
      );
      return res.data?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean; user?: ClockifyUser; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error',
      };
    }
  }
}

export default ClockifyClient;
