
/**
 * Fortnox OAuth2 Callback Endpoint
 * Handles the OAuth callback from Fortnox and exchanges code for tokens
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { exchangeFortnoxCode } from "@/lib/integrations/fortnox-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/superadmin/fortnox-config?error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/superadmin/fortnox-config?error=invalid_callback`
    );
  }

  try {
    // Extract clinicId from state
    const clinicId = state.split(":")[0];

    if (!clinicId) {
      throw new Error("Invalid state parameter");
    }

    // Get clinic's Fortnox credentials
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        fortnoxClientId: true,
        fortnoxClientSecret: true,
      },
    });

    if (!clinic?.fortnoxClientId || !clinic?.fortnoxClientSecret) {
      throw new Error("Fortnox credentials not configured");
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/fortnox/callback`;
    const tokenResponse = await exchangeFortnoxCode(
      clinic.fortnoxClientId,
      clinic.fortnoxClientSecret,
      code,
      redirectUri
    );

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Save tokens to database
    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        fortnoxAccessToken: tokenResponse.access_token,
        fortnoxRefreshToken: tokenResponse.refresh_token,
        fortnoxTokenExpiry: expiresAt,
        fortnoxEnabled: true,
      },
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/superadmin/fortnox-config?success=true`
    );
  } catch (error) {
    console.error("Fortnox OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/superadmin/fortnox-config?error=token_exchange_failed`
    );
  }
}
