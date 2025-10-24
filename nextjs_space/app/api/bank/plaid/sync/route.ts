
// API: Sync Plaid Transactions (Incremental)
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
    const { connectionId } = body

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

    const plaidClient = createPlaidClient()

    // Sync transactions using cursor-based pagination
    const syncResult = await plaidClient.syncTransactions({
      accessToken: connection.accessToken,
      cursor: connection.cursor || undefined,
    })

    // Store new transactions in database
    const transactionsToCreate = syncResult.added.map((tx) => ({
      bankConnectionId: connection.id,
      clinicId: user.clinic?.id || '',
      source: 'plaid',
      transactionId: tx.transaction_id,
      accountId: tx.account_id,
      transactionDate: new Date(tx.date), // Required unified field
      amount: tx.amount,
      currency: tx.iso_currency_code || 'SEK',
      bookingDate: new Date(tx.date),
      valueDate: new Date(tx.date),
      remittanceInformation: tx.name,
      description: tx.name, // Unified description field
      creditorName: tx.merchant_name || undefined,
      transactionType: tx.amount < 0 ? 'DEBIT' : 'CREDIT',
      metadata: tx as any,
      category: 'other', // Default category
      isReconciled: false,
    }))

    // Bulk insert transactions
    if (transactionsToCreate.length > 0) {
      await prisma.bankTransaction.createMany({
        data: transactionsToCreate,
        skipDuplicates: true, // Skip if transaction already exists
      })
    }

    // Update connection with new cursor and last synced time
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        cursor: syncResult.nextCursor,
        lastSyncedAt: new Date(),
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
      },
    })

    return NextResponse.json({
      success: true,
      added: syncResult.added.length,
      modified: syncResult.modified.length,
      removed: syncResult.removed.length,
      hasMore: syncResult.hasMore,
    })
  } catch (error: any) {
    console.error('Error syncing transactions:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}
