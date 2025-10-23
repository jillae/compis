
// Bokadirekt Sync Service
// Orchestrates fetching + transformation + upsert

import { prisma } from '../db';
import { bokadirektClient } from './client';
import {
  mapBookingsBatch,
  mapCustomersBatch,
  mapResourcesBatch,
  mapServicesBatch,
} from './mappers';
import { syncStaffAvailabilities } from './availability-sync';
import { syncSales, recalculateCustomerTotalSpentFromSales } from './sales-sync';
import type { SyncResult, SyncOptions } from './types';

interface SyncStatus {
  lastSyncTimestamp: Date | null;
  bookingsCount: number;
  customersCount: number;
  staffCount: number;
  servicesCount: number;
}

// Get last sync timestamp from database
async function getLastSyncTimestamp(): Promise<Date | null> {
  try {
    // Try to get from a sync_status table (we'll need to create this)
    // For now, get the most recent booking's createdAt
    const mostRecentBooking = await prisma.booking.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    
    return mostRecentBooking?.createdAt || null;
  } catch (error) {
    console.error('[SyncService] Failed to get last sync timestamp:', error);
    return null;
  }
}

// Update sync timestamp
async function updateSyncTimestamp(timestamp: Date): Promise<void> {
  // For now, we'll just log it
  // In production, store in a sync_status table
  console.log(`[SyncService] Sync completed at ${timestamp.toISOString()}`);
}

// Sync bookings
export async function syncBookings(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[SyncService] Starting bookings sync...');
    
    // Fetch bookings from Bokadirekt
    const bokadirektBookings = await bokadirektClient.getBookings(options);
    console.log(`[SyncService] Fetched ${bokadirektBookings.length} bookings from Bokadirekt`);
    
    // Transform to Prisma format
    const prismaBookings = mapBookingsBatch(bokadirektBookings);
    console.log(`[SyncService] Mapped ${prismaBookings.length} bookings`);
    
    // Upsert to database
    let upsertedCount = 0;
    for (const booking of prismaBookings) {
      try {
        await prisma.booking.upsert({
          where: { id: booking.id },
          update: {
            startTime: booking.startTime,
            endTime: booking.endTime,
            scheduledTime: booking.scheduledTime,
            duration: booking.duration,
            status: booking.status,
            price: booking.price,
            revenue: booking.revenue,
            cost: booking.cost,
            source: booking.source,
            treatmentType: booking.treatmentType,
            bookedAt: booking.bookedAt,
            notes: booking.notes,
          },
          create: {
            id: booking.id,
            customerId: booking.customerId,
            staffId: booking.staffId,
            serviceId: booking.serviceId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            scheduledTime: booking.scheduledTime,
            duration: booking.duration,
            status: booking.status,
            price: booking.price,
            revenue: booking.revenue,
            cost: booking.cost,
            source: booking.source,
            treatmentType: booking.treatmentType,
            bookedAt: booking.bookedAt,
            notes: booking.notes,
          },
        });
        upsertedCount++;
      } catch (error) {
        const errorMsg = `Failed to upsert booking ${booking.id}: ${error}`;
        console.error(`[SyncService] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SyncService] Bookings sync completed in ${duration}ms`);
    
    return {
      success: errors.length === 0,
      recordsFetched: bokadirektBookings.length,
      recordsUpserted: upsertedCount,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Bookings sync failed: ${error}`;
    console.error(`[SyncService] ${errorMsg}`);
    
    return {
      success: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

// Sync customers
export async function syncCustomers(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[SyncService] Starting customers sync...');
    
    // Fetch customers from Bokadirekt
    const bokadirektCustomers = await bokadirektClient.getCustomers();
    console.log(`[SyncService] Fetched ${bokadirektCustomers.length} customers from Bokadirekt`);
    
    // Transform to Prisma format
    const prismaCustomers = mapCustomersBatch(bokadirektCustomers);
    console.log(`[SyncService] Mapped ${prismaCustomers.length} customers`);
    
    // Upsert to database
    let upsertedCount = 0;
    for (const customer of prismaCustomers) {
      try {
        await prisma.customer.upsert({
          where: { id: customer.id },
          update: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            tags: customer.tags,
            dateOfBirth: customer.dateOfBirth,
            city: customer.city,
            postalCode: customer.postalCode,
          },
          create: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            tags: customer.tags,
            dateOfBirth: customer.dateOfBirth,
            city: customer.city,
            postalCode: customer.postalCode,
          },
        });
        upsertedCount++;
      } catch (error) {
        const errorMsg = `Failed to upsert customer ${customer.id}: ${error}`;
        console.error(`[SyncService] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SyncService] Customers sync completed in ${duration}ms`);
    
    return {
      success: errors.length === 0,
      recordsFetched: bokadirektCustomers.length,
      recordsUpserted: upsertedCount,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Customers sync failed: ${error}`;
    console.error(`[SyncService] ${errorMsg}`);
    
    return {
      success: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

// Sync staff
export async function syncStaff(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[SyncService] Starting staff sync...');
    
    // Fetch resources from Bokadirekt
    const bokadirektResources = await bokadirektClient.getResources(options);
    console.log(`[SyncService] Fetched ${bokadirektResources.length} resources from Bokadirekt`);
    
    // Transform to Prisma format
    const prismaStaff = mapResourcesBatch(bokadirektResources);
    console.log(`[SyncService] Mapped ${prismaStaff.length} staff members`);
    
    // Upsert to database
    let upsertedCount = 0;
    for (const staff of prismaStaff) {
      try {
        await prisma.staff.upsert({
          where: { id: staff.id },
          update: {
            name: staff.name,
            email: staff.email,
            specializations: staff.specializations,
          },
          create: {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            specializations: staff.specializations,
          },
        });
        upsertedCount++;
      } catch (error) {
        const errorMsg = `Failed to upsert staff ${staff.id}: ${error}`;
        console.error(`[SyncService] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SyncService] Staff sync completed in ${duration}ms`);
    
    return {
      success: errors.length === 0,
      recordsFetched: bokadirektResources.length,
      recordsUpserted: upsertedCount,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Staff sync failed: ${error}`;
    console.error(`[SyncService] ${errorMsg}`);
    
    return {
      success: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

// Sync services
export async function syncServices(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  try {
    console.log('[SyncService] Starting services sync...');
    
    // Fetch services from Bokadirekt
    const bokadirektServices = await bokadirektClient.getServices();
    console.log(`[SyncService] Fetched ${bokadirektServices.length} services from Bokadirekt`);
    
    // Transform to Prisma format
    const prismaServices = mapServicesBatch(bokadirektServices);
    console.log(`[SyncService] Mapped ${prismaServices.length} services`);
    
    // Upsert to database
    let upsertedCount = 0;
    for (const service of prismaServices) {
      try {
        await prisma.service.upsert({
          where: { id: service.id },
          update: {
            name: service.name,
            category: service.category,
            price: service.price,
            duration: service.duration,
          },
          create: {
            id: service.id,
            name: service.name,
            category: service.category,
            price: service.price,
            duration: service.duration,
          },
        });
        upsertedCount++;
      } catch (error) {
        const errorMsg = `Failed to upsert service ${service.id}: ${error}`;
        console.error(`[SyncService] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[SyncService] Services sync completed in ${duration}ms`);
    
    return {
      success: errors.length === 0,
      recordsFetched: bokadirektServices.length,
      recordsUpserted: upsertedCount,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Services sync failed: ${error}`;
    console.error(`[SyncService] ${errorMsg}`);
    
    return {
      success: false,
      recordsFetched: 0,
      recordsUpserted: 0,
      errors: [errorMsg],
      duration,
    };
  }
}

// ⚠️ DEPRECATED: Use recalculateCustomerTotalSpentFromSales instead!
// This function incorrectly calculates totalSpent from bookings.
// Bookings don't represent actual revenue (e.g., klippkort usage has no payment).
async function recalculateCustomerTotalSpent(): Promise<void> {
  console.warn('[SyncService] ⚠️ recalculateCustomerTotalSpent is DEPRECATED!');
  console.warn('[SyncService] Use recalculateCustomerTotalSpentFromSales instead.');
  console.warn('[SyncService] This function calculates from bookings, which is INCORRECT for revenue.');
  
  // Redirect to the correct function
  return recalculateCustomerTotalSpentFromSales();
}

// Full sync (all entities)
export async function syncAll(): Promise<{
  bookings: SyncResult;
  customers: SyncResult;
  staff: SyncResult;
  services: SyncResult;
  sales: SyncResult; // ← NEW: Financial transactions
  staffAvailabilities?: SyncResult;
  overall: {
    success: boolean;
    totalDuration: number;
    errors: string[];
  };
}> {
  const overallStart = Date.now();
  
  console.log('[SyncService] Starting full sync...');
  
  // Determine date range
  const lastSync = await getLastSyncTimestamp();
  const now = new Date();
  
  let options: SyncOptions = {};
  if (lastSync) {
    // Incremental sync
    console.log(`[SyncService] Incremental sync from ${lastSync.toISOString()}`);
    options = {
      startDate: lastSync,
      endDate: now,
      filterOnStartDate: true,
    };
  } else {
    // Initial sync - last 90 days for historical analysis
    console.log('[SyncService] Initial sync - fetching last 90 days');
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    options = {
      startDate: ninetyDaysAgo,
      endDate: now,
      filterOnStartDate: true,
    };
  }
  
  // Sync all entities
  // Note: Order matters - sync entities that don't depend on others first
  const customersResult = await syncCustomers();
  const staffResult = await syncStaff({ startDate: options.startDate, endDate: options.endDate });
  const servicesResult = await syncServices();
  const bookingsResult = await syncBookings(options);
  
  // 🆕 Sync SALES (Financial Transactions) - CRITICAL for revenue analysis!
  console.log('[SyncService] Syncing sales (financial transactions)...');
  const salesResult = await syncSales(options);
  
  // Recalculate customer totalSpent from SALES (not bookings!)
  console.log('[SyncService] Recalculating customer totalSpent from SALES...');
  await recalculateCustomerTotalSpentFromSales();
  
  // 🆕 Sync staff availabilities → StaffSchedule → Clockify
  console.log('[SyncService] Syncing staff availabilities...');
  let staffAvailabilitiesResult: SyncResult | undefined;
  try {
    // Get Arch Clinic ID (or first clinic with BD enabled)
    const clinic = await prisma.clinic.findFirst({
      where: {
        bokadirektEnabled: true,
        bokadirektApiKey: { not: null },
      },
      select: { id: true },
    });
    
    if (clinic) {
      staffAvailabilitiesResult = await syncStaffAvailabilities(clinic.id, options);
      console.log(`[SyncService] Staff availabilities: ${staffAvailabilitiesResult.recordsUpserted} schedules created`);
    }
  } catch (error) {
    console.error('[SyncService] Staff availability sync failed:', error);
    // Non-critical - don't fail overall sync
  }
  
  // Update last sync timestamp
  await updateSyncTimestamp(now);
  
  const totalDuration = Date.now() - overallStart;
  const allErrors = [
    ...customersResult.errors,
    ...staffResult.errors,
    ...servicesResult.errors,
    ...bookingsResult.errors,
    ...salesResult.errors, // ← NEW: Sales errors
    ...(staffAvailabilitiesResult?.errors || []),
  ];
  
  const overallSuccess =
    customersResult.success &&
    staffResult.success &&
    servicesResult.success &&
    bookingsResult.success &&
    salesResult.success && // ← NEW: Sales success check
    (staffAvailabilitiesResult?.success !== false);
  
  console.log(`[SyncService] Full sync completed in ${totalDuration}ms`);
  console.log(`[SyncService] Customers: ${customersResult.recordsUpserted} upserted`);
  console.log(`[SyncService] Staff: ${staffResult.recordsUpserted} upserted`);
  console.log(`[SyncService] Services: ${servicesResult.recordsUpserted} upserted`);
  console.log(`[SyncService] Bookings: ${bookingsResult.recordsUpserted} upserted`);
  console.log(`[SyncService] 💰 Sales: ${salesResult.recordsUpserted} upserted (REVENUE DATA!)`); // ← NEW!
  if (staffAvailabilitiesResult) {
    console.log(`[SyncService] Staff Schedules: ${staffAvailabilitiesResult.recordsUpserted} created`);
  }
  console.log(`[SyncService] Errors: ${allErrors.length}`);
  
  return {
    bookings: bookingsResult,
    customers: customersResult,
    staff: staffResult,
    services: servicesResult,
    sales: salesResult, // ← NEW: Financial transactions
    staffAvailabilities: staffAvailabilitiesResult,
    overall: {
      success: overallSuccess,
      totalDuration,
      errors: allErrors,
    },
  };
}
