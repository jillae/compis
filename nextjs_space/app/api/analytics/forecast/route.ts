
/**
 * Liquidity Forecast API
 * Generates forward-looking cashflow predictions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCashflowForecast } from "@/lib/forecasting/cashflow-forecast";

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
    },
  });

  if (!user?.clinicId) {
    return NextResponse.json(
      { error: "No clinic associated with user" },
      { status: 400 }
    );
  }

  try {
    // Get parameters from query
    const searchParams = request.nextUrl.searchParams;
    const historicalMonths = parseInt(
      searchParams.get("historicalMonths") || "3"
    );
    const forecastWeeks = parseInt(searchParams.get("forecastWeeks") || "13");

    // Validate parameters
    if (
      historicalMonths < 1 ||
      historicalMonths > 12 ||
      forecastWeeks < 4 ||
      forecastWeeks > 52
    ) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          details:
            "historicalMonths must be 1-12, forecastWeeks must be 4-52",
        },
        { status: 400 }
      );
    }

    // Generate forecast
    const forecastData = await generateCashflowForecast({
      clinicId: user.clinicId,
      historicalMonths,
      forecastWeeks,
    });

    return NextResponse.json({
      success: true,
      ...forecastData,
    });
  } catch (error: unknown) {
    console.error("Failed to generate forecast:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to generate forecast", details: errorMessage },
      { status: 500 }
    );
  }
}
