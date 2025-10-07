
// Bokadirekt API Client

import {
  BokadirektBooking,
  BokadirektCustomer,
  BokadirektResource,
  BokadirektService,
  SyncOptions
} from './types';

const BASE_URL = process.env.BOKADIREKT_API_URL || 'https://external.api.bokadirekt.se/api/v1';
const API_KEY = process.env.BOKADIREKT_API_KEY;

// Rate limiting: 10 requests per minute
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds

class BokadirektClient {
  private requestQueue: Array<() => Promise<any>> = [];
  private requestTimestamps: number[] = [];
  
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );
    
    // If we've hit the rate limit, wait
    if (this.requestTimestamps.length >= RATE_LIMIT) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = RATE_LIMIT_WINDOW - (now - oldestRequest) + 1000; // Add 1s buffer
      
      console.log(`[BokadirektClient] Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      
      // Recursively check again
      return this.enforceRateLimit();
    }
    
    // Record this request
    this.requestTimestamps.push(now);
  }
  
  private async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      queryParams?: Record<string, string>;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { method = 'GET', queryParams = {}, retries = 3 } = options;
    
    if (!API_KEY) {
      throw new Error('BOKADIREKT_API_KEY is not configured');
    }
    
    // Enforce rate limiting
    await this.enforceRateLimit();
    
    // Build URL with query params
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    try {
      console.log(`[BokadirektClient] ${method} ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'X-API-KEY': API_KEY,
          'Content-Type': 'application/json',
        },
      });
      
      // Handle rate limiting
      if (response.status === 429) {
        if (retries > 0) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          console.log(`[BokadirektClient] 429 Too Many Requests. Retrying after ${retryAfter}s...`);
          
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          return this.makeRequest<T>(endpoint, { ...options, retries: retries - 1 });
        }
        
        throw new Error('Rate limit exceeded');
      }
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Check BOKADIREKT_API_KEY');
      }
      
      // Handle server errors with retry
      if (response.status >= 500) {
        if (retries > 0) {
          const backoffDelay = (4 - retries) * 5000; // 5s, 10s, 15s
          console.log(`[BokadirektClient] ${response.status} Server Error. Retrying in ${backoffDelay}ms...`);
          
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          return this.makeRequest<T>(endpoint, { ...options, retries: retries - 1 });
        }
        
        throw new Error(`Bokadirekt API server error: ${response.status}`);
      }
      
      // Handle other non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      return data as T;
      
    } catch (error) {
      console.error(`[BokadirektClient] Request failed:`, error);
      throw error;
    }
  }
  
  // GET /api/v1/bookings
  async getBookings(options: SyncOptions = {}): Promise<BokadirektBooking[]> {
    const { startDate, endDate, filterOnStartDate = false } = options;
    
    const queryParams: Record<string, string> = {};
    
    if (filterOnStartDate !== undefined) {
      queryParams.FilterOnStartDate = filterOnStartDate.toString();
    }
    
    if (startDate) {
      queryParams.StartDate = startDate.toISOString();
    }
    
    if (endDate) {
      queryParams.EndDate = endDate.toISOString();
    }
    
    return this.makeRequest<BokadirektBooking[]>('/bookings', { queryParams });
  }
  
  // GET /api/v1/customers
  async getCustomers(): Promise<BokadirektCustomer[]> {
    return this.makeRequest<BokadirektCustomer[]>('/customers');
  }
  
  // GET /api/v1/resources
  async getResources(options: SyncOptions = {}): Promise<BokadirektResource[]> {
    const { startDate, endDate } = options;
    
    const queryParams: Record<string, string> = {};
    
    if (startDate) {
      queryParams.StartDate = startDate.toISOString();
    }
    
    if (endDate) {
      queryParams.EndDate = endDate.toISOString();
    }
    
    return this.makeRequest<BokadirektResource[]>('/resources', { queryParams });
  }
  
  // GET /api/v1/services
  async getServices(): Promise<BokadirektService[]> {
    return this.makeRequest<BokadirektService[]>('/services');
  }
}

// Singleton instance
export const bokadirektClient = new BokadirektClient();
