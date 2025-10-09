

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

    const { step, apiKey } = await req.json()

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
      if (!apiKey) {
        return NextResponse.json({ error: 'API key required' }, { status: 400 })
      }

      // Validate API key with Bokadirekt (simplified for now)
      // In production, you'd want to make a test call to Bokadirekt API
      
      // Store API key in user's clinic
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { clinic: true },
      })

      if (!user?.clinicId) {
        return NextResponse.json({ error: 'No clinic associated' }, { status: 400 })
      }

      await prisma.clinic.update({
        where: { id: user.clinicId },
        data: { bokadirektApiKey: apiKey },
      })

      // Mark onboarding as complete
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          onboardingStep: 2,
          onboardingCompletedAt: new Date(),
        },
      })

      // Trigger initial sync (optional)
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (err) {
        console.error('Failed to trigger initial sync:', err)
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

