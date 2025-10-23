
/**
 * Bokadirekt Sales Sync Service
 * 
 * ⚠️ IMPORTANT: Sales vs Bookings
 * - Sales = FINANCIAL TRANSACTIONS (revenue, payments, when money was received)
 * - Bookings = CAPACITY TRACKING (timeslots, staff utilization)
 * 
 * WHY SEPARATE?
 * - Klippkort: 1 Sale (payment) = Multiple Bookings (stamp usage later)
 * - Revenue analysis MUST use Sales, not Bookings
 * - Capacity analysis MUST use Bookings, not Sales
 */

import { prisma } from '../db';
import { bokadirektClient } from './client';
import { mapSalesResponseBatch } from './mappers';
import type { SyncResult, SyncOptions } from './types';

// Sync sales (financial transactions)
export async function syncSales(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[SalesSync] Starting sales sync...');
    
    // Get clinic ID (assuming we're syncing for one clinic at a time)
    // In production, you might pass clinicId as a parameter
    const clinic = await prisma.clinic.findFirst({
      where: {
        bokadirektEnabled: true,
        bokadirektApiKey: { not: null },
      },
      select: { id: true, bokadirektId: true },
    });
    
    if (!clinic) {
      throw new Error('No clinic found with Bokadirekt enabled');
    }
    
    // Fetch sales from Bokadirekt
    const salesResponses = await bokadirektClient.getSales(options);
    console.log(`[SalesSync] Fetched sales from ${salesResponses.length} salons`);
    
    // Count total receipts
    const totalReceipts = salesResponses.reduce(
      (sum, response) => sum + (response.headers?.length || 0),
      0
    );
    console.log(`[SalesSync] Total receipts: ${totalReceipts}`);
    
    // Transform to Prisma format
    const mappedSales = mapSalesResponseBatch(salesResponses, clinic.id);
    console.log(`[SalesSync] Mapped ${mappedSales.length} sales`);
    
    // Upsert to database
    let upsertedCount = 0;
    for (const { sale, items, payments } of mappedSales) {
      try {
        // Upsert Sale
        const createdSale = await prisma.sale.upsert({
          where: { bokadirektId: sale.bokadirektId },
          update: {
            receiptDate: sale.receiptDate,
            receiptType: sale.receiptType,
            receiptNumber: sale.receiptNumber,
            totalAmount: sale.totalAmount,
            totalVat: sale.totalVat,
            totalDiscount: sale.totalDiscount,
            customerId: sale.customerId,
          },
          create: {
            bokadirektId: sale.bokadirektId,
            clinicId: sale.clinicId,
            customerId: sale.customerId,
            receiptDate: sale.receiptDate,
            receiptType: sale.receiptType,
            receiptNumber: sale.receiptNumber,
            totalAmount: sale.totalAmount,
            totalVat: sale.totalVat,
            totalDiscount: sale.totalDiscount,
          },
        });
        
        // Delete existing items and payments (to handle updates)
        await prisma.saleItem.deleteMany({
          where: { saleId: createdSale.id },
        });
        await prisma.salePayment.deleteMany({
          where: { saleId: createdSale.id },
        });
        
        // Create SaleItems
        for (const item of items) {
          await prisma.saleItem.create({
            data: {
              saleId: createdSale.id,
              itemId: item.itemId,
              name: item.name,
              itemType: item.itemType,
              staffId: item.staffId,
              staffName: item.staffName,
              bookingId: item.bookingId,
              customerId: item.customerId,
              customerName: item.customerName,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              discount: item.discount,
              totalPrice: item.totalPrice,
              vatRate: item.vatRate,
            },
          });
        }
        
        // Create SalePayments
        for (const payment of payments) {
          await prisma.salePayment.create({
            data: {
              saleId: createdSale.id,
              paymentType: payment.paymentType,
              amount: payment.amount,
            },
          });
        }
        
        upsertedCount++;
      } catch (error) {
        const errorMsg = `Failed to upsert sale ${sale.bokadirektId}: ${error}`;
        console.error(`[SalesSync] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SalesSync] Sales sync completed in ${duration}ms`);
    console.log(`[SalesSync] Upserted ${upsertedCount} sales with items and payments`);
    
    return {
      success: errors.length === 0,
      recordsFetched: totalReceipts,
      recordsUpserted: upsertedCount,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Sales sync failed: ${error}`;
    console.error(`[SalesSync] ${errorMsg}`);
    
    return {
      success: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

// Recalculate customer totalSpent based on completed SALES (not bookings!)
// ⚠️ This is the CORRECT way - use Sales, not Bookings
export async function recalculateCustomerTotalSpentFromSales(): Promise<void> {
  try {
    const startTime = Date.now();
    console.log('[SalesSync] Recalculating customer totalSpent from SALES...');
    
    // Get all customers with their sales
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        totalSpent: true,
        sales: {
          where: {
            receiptType: 0, // Only count actual sales (not refunds)
          },
          select: {
            totalAmount: true,
          },
        },
      },
    });
    
    let updatedCount = 0;
    
    // Update each customer's totalSpent
    for (const customer of customers) {
      const correctTotalSpent = customer.sales.reduce((sum, sale) => {
        return sum + Number(sale.totalAmount);
      }, 0);
      
      const oldTotal = Number(customer.totalSpent);
      
      // Only update if there's a difference
      if (Math.abs(correctTotalSpent - oldTotal) > 0.01) {
        // Allow 1 cent difference for rounding
        await prisma.customer.update({
          where: { id: customer.id },
          data: { totalSpent: correctTotalSpent },
        });
        updatedCount++;
        
        if (Math.abs(correctTotalSpent - oldTotal) > 10) {
          // Log significant differences
          console.log(
            `[SalesSync] Customer ${customer.id}: ${oldTotal} → ${correctTotalSpent} (diff: ${correctTotalSpent - oldTotal})`
          );
        }
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(
      `[SalesSync] Recalculated totalSpent for ${updatedCount} customers in ${duration}ms`
    );
  } catch (error) {
    console.error('[SalesSync] Failed to recalculate customer totalSpent:', error);
    // Don't throw - this is non-critical
  }
}
