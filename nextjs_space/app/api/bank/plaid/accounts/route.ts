
// API: Get Plaid Bank Accounts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPlaidClient } from '@/lib/integrations/plaid-client'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
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

    // Get all bank connections for this clinic
    const connections = await prisma.bankConnection.findMany({
      where: {
        clinicId: user.clinic.id,
        status: 'ACTIVE',
      },
    })

    const plaidClient = createPlaidClient()

    // Get account details for each connection
    const accountsPromises = connections.map(async (connection) => {
      try {
        const accountInfo = await plaidClient.getAccounts(connection.accessToken)
        return {
          connectionId: connection.id,
          institutionName: connection.institutionName,
          accounts: accountInfo.accounts.map(acc => ({
            accountId: acc.account_id,
            name: acc.name,
            type: acc.type,
            subtype: acc.subtype,
            mask: acc.mask,
            balances: acc.balances,
          })),
        }
      } catch (error) {
        console.error(`Error fetching accounts for connection ${connection.id}:`, error)
        return {
          connectionId: connection.id,
          institutionName: connection.institutionName,
          accounts: [],
          error: 'Failed to fetch accounts',
        }
      }
    })

    const accountsData = await Promise.all(accountsPromises)

    return NextResponse.json({
      connections: accountsData,
    })
  } catch (error: any) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}
