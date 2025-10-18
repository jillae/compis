
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, companyName, jobTitle } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create clinic first (every new user gets their own clinic)
    const clinicName = companyName || `${firstName || ''} ${lastName || ''}'s Clinic`.trim() || 'Min Klinik'
    
    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        tier: 'BASIC', // New users start with BASIC tier
        subscriptionStatus: 'TRIAL', // 30-day trial
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        bokadirektEnabled: false, // Can be enabled during onboarding
        metaEnabled: false,
        corexEnabled: false,
      }
    })

    // Create user and link to the new clinic
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        companyName,
        jobTitle,
        name: `${firstName || ''} ${lastName || ''}`.trim() || email,
        role: 'ADMIN', // First user of a clinic is always ADMIN
        clinicId: clinic.id,
      }
    })

    return NextResponse.json(
      { 
        message: "User created successfully", 
        userId: user.id,
        clinicId: clinic.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
