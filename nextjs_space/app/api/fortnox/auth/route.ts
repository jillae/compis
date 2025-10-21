
/**
 * Fortnox OAuth2 Initiation Endpoint
 * Redirects user to Fortnox authorization page
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFortnoxAuthUrl } from "@/lib/integrations/fortnox-client";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
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

  // Only SuperAdmin and Admin (clinic owner) can configure Fortnox
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Get clinic's Fortnox Client ID
  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    select: {
      fortnoxClientId: true,
    },
  });

  if (!clinic?.fortnoxClientId) {
    return NextResponse.json(
      { error: "Fortnox Client ID not configured. Please contact SuperAdmin." },
      { status: 400 }
    );
  }

  // Generate state token (for CSRF protection)
  const state = `${user.clinicId}:${Date.now()}:${Math.random().toString(36).substring(7)}`;

  // TODO: Store state in session or database for verification in callback

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/fortnox/callback`;
  const authUrl = getFortnoxAuthUrl(clinic.fortnoxClientId, redirectUri, state);

  return NextResponse.redirect(authUrl);
}
