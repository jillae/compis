
/**
 * Fortnox Connection Test API
 * Test if Fortnox connection is working
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { testFortnoxConnection } from "@/lib/integrations/fortnox-client";

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

  // Only SuperAdmin and Owner can test connection
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const isConnected = await testFortnoxConnection(user.clinicId);

    return NextResponse.json({
      success: isConnected,
      message: isConnected
        ? "Fortnox connection successful"
        : "Fortnox connection failed",
    });
  } catch (error: unknown) {
    console.error("Fortnox connection test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to test connection", details: errorMessage },
      { status: 500 }
    );
  }
}
