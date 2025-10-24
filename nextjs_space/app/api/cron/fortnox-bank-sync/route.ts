
/**
 * Fortnox Bank Sync Cron Job
 * 
 * Schedule: Every hour at :15 (15 * * * *)
 * Purpose: Automatically sync bank transactions from Fortnox and match with Sales
 * 
 * Security: Requires CRON_SECRET in Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchFortnoxBankTransactions } from '@/lib/integrations/fortnox-client';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[CRON] Unauthorized Fortnox Bank sync attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting automatic Fortnox Bank sync...');
    const startTime = Date.now();

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalMatched = 0;
    let totalErrors = 0;

    // Get all clinics with Fortnox enabled
    const clinics = await prisma.clinic.findMany({
      where: {
        fortnoxEnabled: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (clinics.length === 0) {
      console.log('[CRON] No clinics with Fortnox enabled');
      return NextResponse.json({
        success: true,
        message: 'No clinics with Fortnox enabled',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[CRON] Found ${clinics.length} clinic(s) with Fortnox enabled`);

    // Sync each clinic
    for (const clinic of clinics) {
      try {
        console.log(`[CRON] Syncing Fortnox Bank for clinic: ${clinic.name}`);

        // Fetch transactions from Fortnox (last 30 days by default)
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 30);

        const transactions = await fetchFortnoxBankTransactions(
          clinic.id,
          fromDate.toISOString().split('T')[0],
          toDate.toISOString().split('T')[0]
        );

        if (!transactions || transactions.length === 0) {
          console.log(`[CRON] No transactions found for clinic ${clinic.name}`);
          continue;
        }

        console.log(`[CRON] Fetched ${transactions.length} transactions for ${clinic.name}`);

        // Upsert transactions
        for (const tx of transactions) {
          // Generate unique ID from date + amount + description (outside try block)
          const externalId = `${tx.Date}_${tx.Amount}_${tx.Description?.substring(0, 20) || ''}`;
          
          try {
            // Prepare transaction data
            const transactionDate = new Date(tx.Date);
            const amount = new Prisma.Decimal(tx.Amount);

            // Upsert transaction
            const upsertedTx = await prisma.bankTransaction.upsert({
              where: {
                source_externalId: {
                  source: 'fortnox',
                  externalId,
                },
              },
              update: {
                transactionDate,
                amount,
                description: tx.Description,
                reference: tx.Reference,
                currency: tx.Currency || 'SEK',
              },
              create: {
                clinicId: clinic.id,
                source: 'fortnox',
                externalId,
                transactionDate,
                amount,
                currency: tx.Currency || 'SEK',
                description: tx.Description,
                reference: tx.Reference,
                matchStatus: 'unmatched',
              },
            });

            if (upsertedTx.id) {
              // Check if this is a new transaction
              const isNew = upsertedTx.createdAt.getTime() === upsertedTx.updatedAt.getTime();
              if (isNew) {
                totalCreated++;
              } else {
                totalUpdated++;
              }
            }
          } catch (error) {
            console.error(`[CRON] Error upserting transaction ${externalId}:`, error);
            totalErrors++;
          }
        }

        // Match transactions with sales (only unmatched, incoming transactions)
        const unmatchedTransactions = await prisma.bankTransaction.findMany({
          where: {
            clinicId: clinic.id,
            source: 'fortnox',
            matchStatus: 'unmatched',
            amount: { gt: 0 }, // Only incoming payments
          },
        });

        console.log(`[CRON] Matching ${unmatchedTransactions.length} unmatched transactions for ${clinic.name}`);

        for (const transaction of unmatchedTransactions) {
          try {
            // Find sales within ±3 days with exact amount match
            const fromDateMatch = new Date(transaction.transactionDate);
            fromDateMatch.setDate(fromDateMatch.getDate() - 3);
            const toDateMatch = new Date(transaction.transactionDate);
            toDateMatch.setDate(toDateMatch.getDate() + 3);

            const matchingSales = await prisma.sale.findMany({
              where: {
                clinicId: clinic.id,
                receiptType: 0, // Only sales, not refunds
                totalAmount: transaction.amount,
                receiptDate: {
                  gte: fromDateMatch,
                  lte: toDateMatch,
                },
              },
              take: 1, // Match to first available sale
            });

            if (matchingSales.length > 0) {
              const sale = matchingSales[0];
              
              // Update transaction with match
              await prisma.bankTransaction.update({
                where: { id: transaction.id },
                data: {
                  matchedToSaleId: sale.id,
                  matchStatus: 'matched',
                },
              });

              totalMatched++;
              console.log(`[CRON] Matched transaction ${transaction.externalId} to sale ${sale.receiptNumber}`);
            }
          } catch (error) {
            console.error(`[CRON] Error matching transaction ${transaction.id}:`, error);
          }
        }

        console.log(`[CRON] Completed sync for clinic: ${clinic.name}`);
      } catch (error) {
        console.error(`[CRON] Error syncing clinic ${clinic.name}:`, error);
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      clinics: clinics.length,
      results: {
        created: totalCreated,
        updated: totalUpdated,
        matched: totalMatched,
        errors: totalErrors,
      },
    };

    console.log('[CRON] Fortnox Bank sync completed:', summary);

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('[CRON] Fortnox Bank sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fortnox Bank sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (still requires auth)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Fortnox Bank Sync Cron Job',
    schedule: 'Every hour at :15 (15 * * * *)',
    status: 'Active',
    description: 'Syncs bank transactions from Fortnox and matches with Sales',
  });
}
