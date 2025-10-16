
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Fetch Dynamic Pricing status and history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json(
        { error: "No clinic associated with user" },
        { status: 400 }
      );
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: {
        dynamicPricingEnabled: true,
        dynamicPricingLastToggled: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Calculate days since last toggle
    let daysSinceLastToggle: number | null = null;
    if (clinic.dynamicPricingLastToggled) {
      const diffTime = Math.abs(
        new Date().getTime() - new Date(clinic.dynamicPricingLastToggled).getTime()
      );
      daysSinceLastToggle = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Fetch recent logs
    const logs = await prisma.dynamicPricingLog.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { toggledAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      enabled: clinic.dynamicPricingEnabled,
      lastToggled: clinic.dynamicPricingLastToggled,
      daysSinceLastToggle,
      canUsePriceComparisons: daysSinceLastToggle !== null && daysSinceLastToggle >= 28,
      logs,
    });
  } catch (error) {
    console.error("Error fetching Dynamic Pricing status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

// POST: Toggle Dynamic Pricing
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    });

    if (!user?.clinicId) {
      return NextResponse.json(
        { error: "No clinic associated with user" },
        { status: 400 }
      );
    }

    const { enabled, acknowledged } = await request.json();

    if (typeof enabled !== "boolean" || !acknowledged) {
      return NextResponse.json(
        { error: "Invalid request: 'enabled' and 'acknowledged' are required" },
        { status: 400 }
      );
    }

    // Get current clinic status
    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: {
        dynamicPricingEnabled: true,
        dynamicPricingLastToggled: true,
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Calculate days since last toggle
    let daysSinceLastToggle: number | null = null;
    if (clinic.dynamicPricingLastToggled) {
      const diffTime = Math.abs(
        new Date().getTime() - new Date(clinic.dynamicPricingLastToggled).getTime()
      );
      daysSinceLastToggle = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // Update clinic and create log
    const [updatedClinic, log] = await prisma.$transaction([
      prisma.clinic.update({
        where: { id: user.clinicId },
        data: {
          dynamicPricingEnabled: enabled,
          dynamicPricingLastToggled: new Date(),
        },
      }),
      prisma.dynamicPricingLog.create({
        data: {
          clinicId: user.clinicId,
          action: enabled ? "ENABLED" : "DISABLED",
          toggledBy: user.id,
          toggledByName: user.name || user.email,
          daysSinceLastToggle,
          metadata: {
            acknowledged,
            previousState: clinic.dynamicPricingEnabled,
          },
        },
      }),
    ]);

    // Calculate new daysSinceLastToggle (will be 0)
    const newDaysSinceLastToggle = 0;

    return NextResponse.json({
      success: true,
      enabled: updatedClinic.dynamicPricingEnabled,
      lastToggled: updatedClinic.dynamicPricingLastToggled,
      daysSinceLastToggle: newDaysSinceLastToggle,
      canUsePriceComparisons: false, // Always false right after toggle
      log,
    });
  } catch (error) {
    console.error("Error toggling Dynamic Pricing:", error);
    return NextResponse.json(
      { error: "Failed to toggle Dynamic Pricing" },
      { status: 500 }
    );
  }
}
