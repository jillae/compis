
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true }
    })

    return NextResponse.json({
      hasClinic: !!user?.clinicId
    })
  } catch (error) {
    console.error("Error checking onboarding status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
