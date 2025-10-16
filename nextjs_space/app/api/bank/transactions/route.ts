
// API: Fetch and sync transactions from bank
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import GoCardlessClient from '@/lib/integrations/gocardless-client'

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

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID required' },
        { status: 400 }
      )
    }

    // Get existing transactions
    const existingTransactions = await prisma.bankTransaction.findMany({
      where: {
        clinicId: user.clinic.id,
        accountId,
      },
      orderBy: { bookingDate: 'desc' },
      take: 100,
    })

    return NextResponse.json({ transactions: existingTransactions })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

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

    if (!user.clinic.gocardlessAccessToken) {
      return NextResponse.json(
        { error: 'GoCardless not configured' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { accountId, connectionId, dateFrom, dateTo } = body

    if (!accountId || !connectionId) {
      return NextResponse.json(
        { error: 'Account ID and Connection ID required' },
        { status: 400 }
      )
    }

    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection || connection.clinicId !== user.clinic.id) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }

    const client = new GoCardlessClient(user.clinic.gocardlessAccessToken)

    // Fetch transactions from GoCardless
    const result = await client.getAccountTransactions(
      accountId,
      dateFrom,
      dateTo
    )

    const transactions = result.transactions.booked

    // Save transactions to database
    let syncedCount = 0
    for (const tx of transactions) {
      try {
        await prisma.bankTransaction.upsert({
          where: { transactionId: tx.transactionId },
          update: {
            amount: parseFloat(tx.transactionAmount.amount),
            currency: tx.transactionAmount.currency,
            bookingDate: new Date(tx.bookingDate),
            valueDate: new Date(tx.valueDate),
            remittanceInformation: tx.remittanceInformationUnstructured,
            debtorName: tx.debtorName,
            creditorName: tx.creditorName,
            transactionType:
              parseFloat(tx.transactionAmount.amount) > 0 ? 'CREDIT' : 'DEBIT',
            proprietaryCode: tx.proprietaryBankTransactionCode,
            metadata: tx as any,
          },
          create: {
            bankConnectionId: connection.id,
            clinicId: user.clinic.id,
            transactionId: tx.transactionId,
            accountId,
            amount: parseFloat(tx.transactionAmount.amount),
            currency: tx.transactionAmount.currency,
            bookingDate: new Date(tx.bookingDate),
            valueDate: new Date(tx.valueDate),
            remittanceInformation: tx.remittanceInformationUnstructured,
            debtorName: tx.debtorName,
            creditorName: tx.creditorName,
            transactionType:
              parseFloat(tx.transactionAmount.amount) > 0 ? 'CREDIT' : 'DEBIT',
            proprietaryCode: tx.proprietaryBankTransactionCode,
            metadata: tx as any,
          },
        })
        syncedCount++
      } catch (error) {
        console.error('Error saving transaction:', error)
      }
    }

    // Update connection sync status
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      },
    })

    return NextResponse.json({
      success: true,
      syncedCount,
      totalTransactions: transactions.length,
    })
  } catch (error: any) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}
