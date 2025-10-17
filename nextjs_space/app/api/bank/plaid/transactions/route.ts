
// API: Get Plaid Transactions
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createPlaidClient, PlaidClient } from '@/lib/integrations/plaid-client'
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

    const searchParams = req.nextUrl.searchParams
    const connectionId = searchParams.get('connectionId')
    const days = parseInt(searchParams.get('days') || '30')

    // Get date range
    const { startDate, endDate } = PlaidClient.getDateRange(days)

    const plaidClient = createPlaidClient()

    // Get transactions for specific connection or all connections
    let connections
    if (connectionId) {
      const connection = await prisma.bankConnection.findFirst({
        where: {
          id: connectionId,
          clinicId: user.clinic.id,
          status: 'ACTIVE',
        },
      })
      if (!connection) {
        return NextResponse.json({ error: 'Bank connection not found' }, { status: 404 })
      }
      connections = [connection]
    } else {
      connections = await prisma.bankConnection.findMany({
        where: {
          clinicId: user.clinic.id,
          status: 'ACTIVE',
        },
      })
    }

    // Fetch transactions for each connection
    const transactionsPromises = connections.map(async (connection) => {
      try {
        const result = await plaidClient.getTransactions({
          accessToken: connection.accessToken,
          startDate,
          endDate,
          count: 500,
        })

        return {
          connectionId: connection.id,
          institutionName: connection.institutionName,
          transactions: result.transactions,
          totalTransactions: result.totalTransactions,
        }
      } catch (error) {
        console.error(`Error fetching transactions for connection ${connection.id}:`, error)
        return {
          connectionId: connection.id,
          institutionName: connection.institutionName,
          transactions: [],
          error: 'Failed to fetch transactions',
        }
      }
    })

    const transactionsData = await Promise.all(transactionsPromises)

    return NextResponse.json({
      startDate,
      endDate,
      connections: transactionsData,
    })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
