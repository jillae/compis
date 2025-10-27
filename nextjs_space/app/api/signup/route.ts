
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { createSubaccountForClinic } from "@/lib/46elks/subaccount-service"
import { completeReferral, generateReferralCode } from "@/lib/referral-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, companyName, jobTitle, referralCode } = body

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

    // Special case: Link sanna@archacademy.se to existing Arch Clinic
    let clinicId: string
    
    if (email.toLowerCase() === 'sanna@archacademy.se') {
      // Link Sanna to the existing Arch Clinic
      clinicId = 'arch-clinic-main'
      
      // Verify that Arch Clinic exists
      const archClinic = await prisma.clinic.findUnique({
        where: { id: clinicId }
      })
      
      if (!archClinic) {
        return NextResponse.json(
          { error: "Arch Clinic not found" },
          { status: 500 }
        )
      }
    } else {
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
      
      clinicId = clinic.id

      // Auto-create 46elks subaccount for new clinic (async, non-blocking)
      // Note: This runs in background and won't block user signup
      createSubaccountForClinic({
        clinicId: clinic.id,
        clinicName: clinicName,
      }).then((result) => {
        if (result.success) {
          console.log(`✓ 46elks subaccount created for clinic ${clinic.id}: ${result.subaccountId}`)
        } else {
          console.warn(`⚠️ Failed to create 46elks subaccount for clinic ${clinic.id}:`, result.error)
        }
      }).catch((error) => {
        console.error('Error creating 46elks subaccount:', error)
      })
    }

    // Create user and link to the clinic
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
        clinicId: clinicId,
      }
    })

    // Handle referral if code was provided
    if (referralCode) {
      try {
        await completeReferral(referralCode, user.id)
        console.log(`✓ Referral completed for user ${user.id} with code ${referralCode}`)
      } catch (error) {
        console.warn(`⚠️ Failed to complete referral for ${referralCode}:`, error)
        // Don't fail signup if referral completion fails
      }
    }

    // Generate referral code for new user
    try {
      await generateReferralCode(user.id)
    } catch (error) {
      console.warn(`⚠️ Failed to generate referral code for user ${user.id}:`, error)
      // Don't fail signup if code generation fails
    }

    return NextResponse.json(
      { 
        message: "User created successfully", 
        userId: user.id,
        clinicId: clinicId 
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
