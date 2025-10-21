
/**
 * SuperAdmin Fortnox Configuration API
 * Get and update Fortnox credentials (SuperAdmin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's role
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

  // Only SuperAdmin can view Fortnox config
  if (user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // Get clinic's Fortnox configuration
  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    select: {
      fortnoxClientId: true,
      fortnoxClientSecret: true,
      fortnoxEnabled: true,
      fortnoxTokenExpiry: true,
    },
  });

  return NextResponse.json({
    clientId: clinic?.fortnoxClientId || "",
    clientSecret: clinic?.fortnoxClientSecret ? "••••••••" : "", // Masked for security
    enabled: clinic?.fortnoxEnabled || false,
    tokenExpiry: clinic?.fortnoxTokenExpiry?.toISOString() || null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's role
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

  // Only SuperAdmin can update Fortnox config
  if (user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Client ID and Client Secret are required" },
        { status: 400 }
      );
    }

    // Update clinic's Fortnox configuration
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        fortnoxClientId: clientId,
        fortnoxClientSecret: clientSecret,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fortnox configuration saved successfully",
    });
  } catch (error: unknown) {
    console.error("Failed to save Fortnox config:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to save configuration", details: errorMessage },
      { status: 500 }
    );
  }
}
