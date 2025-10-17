
// API: Create Plaid Link Token
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPlaidClient } from '@/lib/integrations/plaid-client'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clinic: true },
    })

    if (!user?.clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    // Check if Plaid is enabled for this clinic
    if (!user.clinic.plaidEnabled) {
      return NextResponse.json(
        { error: 'Plaid integration is not enabled for your clinic' },
        { status: 403 }
      )
    }

    const plaidClient = createPlaidClient()

    // Create link token
    const linkToken = await plaidClient.createLinkToken({
      userId: user.id,
      clientName: user.clinic.name || 'Flow App',
      language: 'sv',
      countryCodes: ['SE' as any],
      products: ['transactions' as any],
    })

    return NextResponse.json({
      linkToken: linkToken.link_token,
      expiration: linkToken.expiration,
    })
  } catch (error: any) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create link token' },
      { status: 500 }
    )
  }
}
