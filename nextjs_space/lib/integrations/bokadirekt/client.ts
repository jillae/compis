/**
 * Bokadirekt API Client
 *
 * Typed HTTP client for the Bokadirekt external API v1.
 * Features:
 *  - Rate limiting  : max 10 requests / 60 s (sliding window)
 *  - Retry logic    : up to 3 attempts with exponential back-off
 *  - Per-clinic key : accepts an API key at construction time,
 *                     falls back to BOKADIREKT_API_KEY env var
 */

// ─── Type definitions ─────────────────────────────────────────────────────────

export interface BokadirektBooking {
  salonId: string;
  salonName: string | null;
  customerId: string;
  customerName: string | null;
  resourceId: string;
  resourceName: string | null;
  resourceNickName: string | null;
  bookingId: string;
  bookingGroupId: string;
  created: string; // ISO date-time
  serviceId: string;
  serviceName: string | null;
  onlineBooking: boolean;
  startDate: string; // ISO date-time
  endDate: string;   // ISO date-time
  bookedPrice: number;
  cancelled: boolean;
  dropIn: boolean;
  rebooked: boolean;
  noShow: boolean;
  isAddon: boolean;
}

export interface BokadirektCustomer {
  customerId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  /** 0=Unknown, 1=Female, 2=Male, 3=Other */
  gender: 0 | 1 | 2 | 3;
  allowEmail: boolean;
  allowSms: boolean;
  categories: string[] | null;
  socialSecurityNumber: string | null;
  postalCode: string | null;
  city: string | null;
  birthday: string | null; // YYYY-MM-DD
  addressLine1: string | null;
}

export interface BokadirektResource {
  salonId: string;
  salonName: string | null;
  resourceId: string;
  resourceName: string | null;
  resourceNickName: string | null;
  finishDate: string | null; // ISO date-time
  bookableOnline: boolean;
  onlineTitle: string | null;
  availabilities: unknown[] | null;
  priceListName: string | null;
}

export interface BokadirektService {
  serviceId: string;
  serviceName: string | null;
  isAddon: boolean;
}

export interface BokadirektSalon {
  salonId: string;
  name: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
}

export interface BokadirektSaleRow {
  itemId: string | null;
  name: string | null;
  number: string | null;
  barCode: string | null;
  customerId: string | null;
  customerName: string | null;
  /** 0=Product, 1=Service, 4=Klippkort, etc. */
  type: number;
  priceIncVat: number;
  discount: number;
  totalPriceIncVat: number;
  vatRate: number;
  bookingId: string | null;
  resourceId: string | null;
  resourceName: string | null;
  resourceNickName: string | null;
  quantity: number;
  rowId: number;
}

export interface BokadirektSalePayment {
  /** 0=Cash, 1=Card, 2=Swish, 3=Invoice, 4=Klippkort, etc. */
  paymentType: number;
  amount: number;
}

export interface BokadirektSaleHeader {
  receiptDate: string; // ISO date-time
  receiptType: number; // 0=Sale, 1=Refund
  receiptNumber: string | null;
  rows: BokadirektSaleRow[] | null;
  payments: BokadirektSalePayment[] | null;
}

export interface BokadirektSaleResponse {
  salonId: string;
  salonName: string | null;
  headers: BokadirektSaleHeader[] | null;
}

export interface BookingFetchParams {
  /** ISO string or Date — start of date range */
  startDate?: Date | string;
  /** ISO string or Date — end of date range */
  endDate?: Date | string;
  /** Filter on startDate field (true) vs. scheduledDate (false) */
  filterOnStartDate?: boolean;
}

export interface SalesFetchParams {
  startDate?: Date | string;
  endDate?: Date | string;
}

// ─── Rate-limit constants ─────────────────────────────────────────────────────

const MAX_REQUESTS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 s

// ─── Client class ─────────────────────────────────────────────────────────────

export class BokadirektClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  /** Timestamps (ms) of requests made within the current sliding window */
  private requestTimestamps: number[] = [];

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.BOKADIREKT_API_KEY || '';
    this.baseUrl =
      baseUrl ||
      process.env.BOKADIREKT_API_URL ||
      'https://external.api.portal.bokadirekt.se/api/v1';
  }

  // ── Rate limiter ────────────────────────────────────────────────────────────

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();

    // Drop timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );

    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      const oldest = this.requestTimestamps[0];
      const waitMs = RATE_LIMIT_WINDOW_MS - (now - oldest) + 500; // +0.5 s safety buffer
      console.log(
        `[Bokadirekt API] Rate limit reached. Waiting ${waitMs}ms before next request.`
      );
      await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
      return this.enforceRateLimit(); // Recurse to re-check after wait
    }

    this.requestTimestamps.push(now);
  }

  // ── Core request method ─────────────────────────────────────────────────────

  private async makeRequest<T>(
    endpoint: string,
    queryParams: Record<string, string> = {},
    retriesLeft = 3
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error(
        '[Bokadirekt API] BOKADIREKT_API_KEY is not configured. ' +
          'Set it via the Clinic.bokadirektApiKey field or the BOKADIREKT_API_KEY env var.'
      );
    }

    await this.enforceRateLimit();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    }

    console.log(`[Bokadirekt API] GET ${url.toString()}`);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        // Avoid caching in Next.js server components / route handlers
        cache: 'no-store',
      });
    } catch (networkError) {
      // Network-level failure — retry with back-off
      if (retriesLeft > 0) {
        const backoff = (3 - retriesLeft + 1) * 3_000; // 3 s, 6 s, 9 s
        console.warn(
          `[Bokadirekt API] Network error on ${endpoint}. Retrying in ${backoff}ms... (${retriesLeft} retries left)`,
          networkError
        );
        await new Promise<void>((resolve) => setTimeout(resolve, backoff));
        return this.makeRequest<T>(endpoint, queryParams, retriesLeft - 1);
      }
      throw networkError;
    }

    // ── Handle 429 Too Many Requests ──────────────────────────────────────────
    if (response.status === 429) {
      if (retriesLeft > 0) {
        const retryAfterSec = parseInt(
          response.headers.get('Retry-After') || '60',
          10
        );
        console.warn(
          `[Bokadirekt API] 429 Too Many Requests. Retrying after ${retryAfterSec}s...`
        );
        await new Promise<void>((resolve) =>
          setTimeout(resolve, retryAfterSec * 1_000)
        );
        return this.makeRequest<T>(endpoint, queryParams, retriesLeft - 1);
      }
      throw new Error('[Bokadirekt API] Rate limit exceeded after retries.');
    }

    // ── Auth errors — no point retrying ───────────────────────────────────────
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `[Bokadirekt API] Authentication failed (${response.status}). ` +
          'Check BOKADIREKT_API_KEY.'
      );
    }

    // ── Server errors — retry with exponential back-off ───────────────────────
    if (response.status >= 500) {
      if (retriesLeft > 0) {
        const backoff = (3 - retriesLeft + 1) * 5_000; // 5 s, 10 s, 15 s
        console.warn(
          `[Bokadirekt API] ${response.status} Server Error on ${endpoint}. ` +
            `Retrying in ${backoff}ms... (${retriesLeft} retries left)`
        );
        await new Promise<void>((resolve) => setTimeout(resolve, backoff));
        return this.makeRequest<T>(endpoint, queryParams, retriesLeft - 1);
      }
      throw new Error(
        `[Bokadirekt API] Server error ${response.status} on ${endpoint}.`
      );
    }

    // ── Other non-OK responses ────────────────────────────────────────────────
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `[Bokadirekt API] Request failed: ${response.status} — ${body}`
      );
    }

    const data = await response.json();
    return data as T;
  }

  // ── Helper to normalise date args to ISO strings ──────────────────────────

  private toISO(date: Date | string): string {
    return date instanceof Date ? date.toISOString() : date;
  }

  // ─── Public API methods ───────────────────────────────────────────────────

  /** GET /bookings  — returns bookings within an optional date range. */
  async fetchBookings(params: BookingFetchParams = {}): Promise<BokadirektBooking[]> {
    const q: Record<string, string> = {};
    if (params.startDate) q.StartDate = this.toISO(params.startDate);
    if (params.endDate) q.EndDate = this.toISO(params.endDate);
    if (params.filterOnStartDate !== undefined)
      q.FilterOnStartDate = String(params.filterOnStartDate);
    return this.makeRequest<BokadirektBooking[]>('/bookings', q);
  }

  /** GET /customers  — returns all customers for the salon. */
  async fetchCustomers(): Promise<BokadirektCustomer[]> {
    return this.makeRequest<BokadirektCustomer[]>('/customers');
  }

  /** GET /resources  — returns staff/resources for the salon. */
  async fetchResources(params: { startDate?: Date; endDate?: Date } = {}): Promise<BokadirektResource[]> {
    const q: Record<string, string> = {};
    if (params.startDate) q.StartDate = params.startDate.toISOString();
    if (params.endDate) q.EndDate = params.endDate.toISOString();
    return this.makeRequest<BokadirektResource[]>('/resources', q);
  }

  /** GET /services  — returns service catalogue for the salon. */
  async fetchServices(): Promise<BokadirektService[]> {
    return this.makeRequest<BokadirektService[]>('/services');
  }

  /** GET /salons  — returns salon details. */
  async fetchSalons(): Promise<BokadirektSalon[]> {
    return this.makeRequest<BokadirektSalon[]>('/salons');
  }

  /** GET /products  — returns product catalogue. */
  async fetchProducts(): Promise<unknown[]> {
    return this.makeRequest<unknown[]>('/products');
  }

  /** GET /sales  — returns financial transactions (receipts) within a date range. */
  async fetchSales(params: SalesFetchParams = {}): Promise<BokadirektSaleResponse[]> {
    const q: Record<string, string> = {};
    if (params.startDate) q.StartDate = this.toISO(params.startDate);
    if (params.endDate) q.EndDate = this.toISO(params.endDate);
    return this.makeRequest<BokadirektSaleResponse[]>('/sales', q);
  }
}

// ─── Default singleton (uses env vars) ───────────────────────────────────────

/** Singleton client that reads BOKADIREKT_API_KEY and BOKADIREKT_API_URL from env. */
export const bokadirektClient = new BokadirektClient();

/**
 * Create a per-clinic client using the clinic's own API key.
 * Falls back to env var if no key is stored on the clinic record.
 */
export function createClinicClient(clinicApiKey?: string | null): BokadirektClient {
  return new BokadirektClient(clinicApiKey ?? undefined);
}
