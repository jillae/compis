

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      step, 
      bokadirektEnabled,
      bokadirektApiKey,
      metaEnabled,
      metaAccessToken,
      metaAdAccountId,
      metaPixelId,
      corexRemindersEnabled,
    } = await req.json()

    if (step === 1) {
      // Mark step 1 as complete (user has explored the dashboard)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          onboardingStep: 1,
          onboardingCompletedAt: null, // Not fully complete yet
        },
      })

      return NextResponse.json({ success: true })
    }

    if (step === 2) {
      // Get user's clinic
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { clinic: true },
      })

      if (!user?.clinicId) {
        return NextResponse.json({ error: 'No clinic associated' }, { status: 400 })
      }

      // Prepare update data
      const updateData: any = {}

      // Handle Bokadirekt integration
      if (bokadirektEnabled) {
        if (!bokadirektApiKey) {
          return NextResponse.json({ error: 'Bokadirekt API key required when enabled' }, { status: 400 })
        }
        updateData.bokadirektEnabled = true
        updateData.bokadirektApiKey = bokadirektApiKey
      } else {
        updateData.bokadirektEnabled = false
      }

      // Handle Meta API integration
      if (metaEnabled) {
        if (!metaAccessToken || !metaAdAccountId) {
          return NextResponse.json({ error: 'Meta Access Token and Ad Account ID required when enabled' }, { status: 400 })
        }
        
        // Check tier - Meta API is only available for PROFESSIONAL and ENTERPRISE
        if (user.clinic?.tier === 'BASIC') {
          return NextResponse.json({ 
            error: 'Meta API integration is only available for Professional and Enterprise plans' 
          }, { status: 403 })
        }
        
        updateData.metaEnabled = true
        updateData.metaAccessToken = metaAccessToken
        updateData.metaAdAccountId = metaAdAccountId
        if (metaPixelId) {
          updateData.metaPixelId = metaPixelId
        }
      } else {
        updateData.metaEnabled = false
      }

      // Handle Corex AI Reminders
      if (corexRemindersEnabled) {
        updateData.corexEnabled = true  // Enable Corex integration
        updateData.corexRemindersEnabled = true
        updateData.corexReminderTonality = 'professional'  // Default tonality
      } else {
        updateData.corexRemindersEnabled = false
      }

      // Update clinic with integration settings
      await prisma.clinic.update({
        where: { id: user.clinicId },
        data: updateData,
      })

      // Mark onboarding as complete
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          onboardingStep: 2,
          onboardingCompletedAt: new Date(),
        },
      })

      // Trigger initial Bokadirekt sync if enabled
      if (bokadirektEnabled) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('Failed to trigger initial Bokadirekt sync:', err)
        }
      }

      // Trigger initial Meta sync if enabled
      if (metaEnabled) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/meta/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('Failed to trigger initial Meta sync:', err)
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

