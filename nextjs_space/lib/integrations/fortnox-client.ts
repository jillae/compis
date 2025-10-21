
/**
 * Fortnox API Client
 * Handles OAuth2 authentication and API calls to Fortnox
 * Documentation: https://developer.fortnox.se/
 */

import { prisma } from "@/lib/db";

const FORTNOX_API_BASE = "https://api.fortnox.se/3";
const FORTNOX_AUTH_BASE = "https://apps.fortnox.se/oauth-v1";

export interface FortnoxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface FortnoxBankTransaction {
  Date: string;
  Amount: number;
  Description: string;
  Currency: string;
  Reference?: string;
}

export interface FortnoxBankTransactionsResponse {
  BankTransactions: FortnoxBankTransaction[];
}

/**
 * Generate Fortnox OAuth authorization URL
 */
export function getFortnoxAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "bankaccounts",
    state,
    response_type: "code",
    account_type: "service",
  });

  return `${FORTNOX_AUTH_BASE}/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeFortnoxCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<FortnoxTokenResponse> {
  const response = await fetch(`${FORTNOX_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Fortnox code: ${error}`);
  }

  return response.json();
}

/**
 * Refresh Fortnox access token
 */
export async function refreshFortnoxToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<FortnoxTokenResponse> {
  const response = await fetch(`${FORTNOX_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Fortnox token: ${error}`);
  }

  return response.json();
}

/**
 * Get valid access token for clinic (refresh if needed)
 */
export async function getValidFortnoxToken(clinicId: string): Promise<string | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      fortnoxAccessToken: true,
      fortnoxRefreshToken: true,
      fortnoxTokenExpiry: true,
      fortnoxClientId: true,
      fortnoxClientSecret: true,
      fortnoxEnabled: true,
    },
  });

  if (!clinic || !clinic.fortnoxEnabled) {
    return null;
  }

  // Check if token is still valid (with 5 min buffer)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

  if (
    clinic.fortnoxAccessToken &&
    clinic.fortnoxTokenExpiry &&
    clinic.fortnoxTokenExpiry > expiryBuffer
  ) {
    return clinic.fortnoxAccessToken;
  }

  // Token expired or about to expire, refresh it
  if (
    clinic.fortnoxRefreshToken &&
    clinic.fortnoxClientId &&
    clinic.fortnoxClientSecret
  ) {
    try {
      const tokenResponse = await refreshFortnoxToken(
        clinic.fortnoxClientId,
        clinic.fortnoxClientSecret,
        clinic.fortnoxRefreshToken
      );

      // Update clinic with new tokens
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      await prisma.clinic.update({
        where: { id: clinicId },
        data: {
          fortnoxAccessToken: tokenResponse.access_token,
          fortnoxRefreshToken: tokenResponse.refresh_token,
          fortnoxTokenExpiry: expiresAt,
        },
      });

      return tokenResponse.access_token;
    } catch (error) {
      console.error("Failed to refresh Fortnox token:", error);
      return null;
    }
  }

  return null;
}

/**
 * Fetch bank transactions from Fortnox
 */
export async function fetchFortnoxBankTransactions(
  clinicId: string,
  fromDate?: string,
  toDate?: string
): Promise<FortnoxBankTransaction[]> {
  const accessToken = await getValidFortnoxToken(clinicId);

  if (!accessToken) {
    throw new Error("No valid Fortnox access token available");
  }

  const params = new URLSearchParams();
  if (fromDate) params.append("fromdate", fromDate);
  if (toDate) params.append("todate", toDate);

  const url = `${FORTNOX_API_BASE}/banktransactions?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Fortnox bank transactions: ${error}`);
  }

  const data: FortnoxBankTransactionsResponse = await response.json();
  return data.BankTransactions || [];
}

/**
 * Test Fortnox API connection
 */
export async function testFortnoxConnection(clinicId: string): Promise<boolean> {
  try {
    const accessToken = await getValidFortnoxToken(clinicId);
    if (!accessToken) {
      return false;
    }

    // Try to fetch bank transactions (just 1 to test connection)
    const response = await fetch(`${FORTNOX_API_BASE}/banktransactions?limit=1`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Fortnox connection test failed:", error);
    return false;
  }
}
