
// API: Exchange Plaid Public Token for Access Token
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

    const body = await req.json()
    const { publicToken, institutionId, institutionName, accounts } = body

    if (!publicToken) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }

    const plaidClient = createPlaidClient()

    // Exchange public token for access token
    const { accessToken, itemId } = await plaidClient.exchangePublicToken(publicToken)

    // Get account information
    const accountInfo = await plaidClient.getAccounts(accessToken)

    // Create bank connection in database
    const bankConnection = await prisma.bankConnection.create({
      data: {
        clinicId: user.clinic.id,
        itemId: itemId,
        accessToken: accessToken, // TODO: Encrypt this in production
        institutionId: institutionId || accountInfo.item.institution_id || 'unknown',
        institutionName: institutionName || 'Unknown Bank',
        status: 'ACTIVE',
        accountIds: accountInfo.accounts.map(acc => acc.account_id),
        lastSyncedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      connectionId: bankConnection.id,
      itemId: bankConnection.itemId,
      accounts: accountInfo.accounts.map(acc => ({
        accountId: acc.account_id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        mask: acc.mask,
      })),
    })
  } catch (error: any) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
