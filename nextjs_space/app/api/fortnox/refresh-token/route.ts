
/**
 * Fortnox Token Refresh Endpoint
 * Manually trigger token refresh (usually happens automatically)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { refreshFortnoxToken } from "@/lib/integrations/fortnox-client";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's clinic
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      clinicId: true,
      role: true,
    },
  });

  if (!user?.clinicId) {
    return NextResponse.json({ error: "No clinic associated with user" }, { status: 400 });
  }

  // Only SuperAdmin and Owner can refresh token
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    // Get clinic's Fortnox credentials
    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: {
        fortnoxClientId: true,
        fortnoxClientSecret: true,
        fortnoxRefreshToken: true,
      },
    });

    if (
      !clinic?.fortnoxClientId ||
      !clinic?.fortnoxClientSecret ||
      !clinic?.fortnoxRefreshToken
    ) {
      return NextResponse.json(
        { error: "Fortnox credentials not configured" },
        { status: 400 }
      );
    }

    // Refresh the token
    const tokenResponse = await refreshFortnoxToken(
      clinic.fortnoxClientId,
      clinic.fortnoxClientSecret,
      clinic.fortnoxRefreshToken
    );

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Save new tokens to database
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        fortnoxAccessToken: tokenResponse.access_token,
        fortnoxRefreshToken: tokenResponse.refresh_token,
        fortnoxTokenExpiry: expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: unknown) {
    console.error("Failed to refresh Fortnox token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to refresh token", details: errorMessage },
      { status: 500 }
    );
  }
}
