/**
 * Bokadirekt Sync Service  (lib/integrations/bokadirekt/sync.ts)
 *
 * Fetches data from the Bokadirekt API and upserts it into the local
 * PostgreSQL database via Prisma.
 *
 * Entity sync order (dependencies first):
 *   1. services   — no dependencies
 *   2. staff      — no dependencies
 *   3. customers  — no dependencies
 *   4. bookings   — depends on customers + staff + services
 *   5. sales      — depends on customers + staff
 *
 * Every entity sync is wrapped in an IntegrationSyncLog record.
 * Failures in one entity do NOT abort the others.
 */

import { prisma } from '@/lib/db';
import {
  BokadirektClient,
  createClinicClient,
  type BokadirektBooking,
  type BokadirektCustomer,
  type BokadirektResource,
  type BokadirektService,
  type BokadirektSaleResponse,
  type BokadirektSaleHeader,
} from './client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map Bokadirekt gender int to a human-readable string (or null). */
function mapGender(gender: 0 | 1 | 2 | 3): string | null {
  const map: Record<number, string> = {
    0: 'UNKNOWN',
    1: 'FEMALE',
    2: 'MALE',
    3: 'OTHER',
  };
  return map[gender] ?? null;
}

/** Derive booking status from Bokadirekt flags. */
function mapBookingStatus(booking: BokadirektBooking): string {
  if (booking.cancelled) return 'CANCELLED';
  if (booking.noShow) return 'NO_SHOW';
  const start = new Date(booking.startDate);
  if (start < new Date()) return 'COMPLETED';
  return 'SCHEDULED';
}

/** Compute duration in minutes between two ISO strings. */
function durationMinutes(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000);
}

// ─── Sync log helpers ─────────────────────────────────────────────────────────

interface SyncCounts {
  recordsFound: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  error?: string;
}

async function createSyncLog(
  clinicId: string,
  entity: string,
  syncType: 'full' | 'incremental' | 'initial'
): Promise<string> {
  const log = await prisma.integrationSyncLog.create({
    data: {
      clinicId,
      source: 'bokadirekt',
      syncType,
      entity,
      status: 'running',
    },
  });
  return log.id;
}

async function completeSyncLog(logId: string, counts: SyncCounts): Promise<void> {
  await prisma.integrationSyncLog.update({
    where: { id: logId },
    data: {
      status: counts.error ? 'failed' : 'completed',
      recordsFound: counts.recordsFound,
      recordsCreated: counts.recordsCreated,
      recordsUpdated: counts.recordsUpdated,
      recordsSkipped: counts.recordsSkipped,
      error: counts.error ?? null,
      completedAt: new Date(),
    },
  });
}

// ─── Individual entity syncs ──────────────────────────────────────────────────

/**
 * Sync services for a clinic.
 * Upserts on bokadirektId.
 */
export async function syncServices(clinicId: string): Promise<SyncCounts> {
  const logId = await createSyncLog(clinicId, 'services', 'full');
  const counts: SyncCounts = {
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { bokadirektApiKey: true },
    });

    const client = createClinicClient(clinic?.bokadirektApiKey);
    const services: BokadirektService[] = await client.fetchServices();
    counts.recordsFound = services.length;

    console.log(`[Bokadirekt Sync] Fetched ${services.length} services for clinic ${clinicId}`);

    for (const svc of services) {
      if (!svc.serviceId) {
        counts.recordsSkipped++;
        continue;
      }

      try {
        const existing = await prisma.service.findUnique({
          where: { bokadirektId: svc.serviceId },
        });

        if (existing) {
          await prisma.service.update({
            where: { id: existing.id },
            data: {
              name: svc.serviceName ?? existing.name,
              isActive: true,
            },
          });
          counts.recordsUpdated++;
        } else {
          await prisma.service.create({
            data: {
              bokadirektId: svc.serviceId,
              clinicId,
              name: svc.serviceName ?? 'Unnamed Service',
              isActive: true,
            },
          });
          counts.recordsCreated++;
        }
      } catch (err) {
        console.error(`[Bokadirekt Sync] Failed to upsert service ${svc.serviceId}:`, err);
        counts.recordsSkipped++;
      }
    }

    console.log(
      `[Bokadirekt Sync] Services done — created: ${counts.recordsCreated}, updated: ${counts.recordsUpdated}, skipped: ${counts.recordsSkipped}`
    );
  } catch (err) {
    counts.error = err instanceof Error ? err.message : String(err);
    console.error('[Bokadirekt Sync] syncServices failed:', err);
  }

  await completeSyncLog(logId, counts);
  return counts;
}

/**
 * Sync staff (resources) for a clinic.
 * Upserts on bokadirektId.
 */
export async function syncStaff(clinicId: string): Promise<SyncCounts> {
  const logId = await createSyncLog(clinicId, 'staff', 'full');
  const counts: SyncCounts = {
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { bokadirektApiKey: true },
    });

    const client = createClinicClient(clinic?.bokadirektApiKey);
    const resources: BokadirektResource[] = await client.fetchResources();
    counts.recordsFound = resources.length;

    console.log(`[Bokadirekt Sync] Fetched ${resources.length} resources for clinic ${clinicId}`);

    for (const res of resources) {
      if (!res.resourceId) {
        counts.recordsSkipped++;
        continue;
      }

      // Staff is active if no finishDate or finishDate is in the future
      const isActive =
        !res.finishDate || new Date(res.finishDate) > new Date();

      try {
        const existing = await prisma.staff.findUnique({
          where: { bokadirektId: res.resourceId },
        });

        if (existing) {
          await prisma.staff.update({
            where: { id: existing.id },
            data: {
              name: res.resourceName ?? existing.name,
              isActive,
            },
          });
          counts.recordsUpdated++;
        } else {
          await prisma.staff.create({
            data: {
              bokadirektId: res.resourceId,
              clinicId,
              name: res.resourceName ?? 'Unnamed Staff',
              isActive,
              role: 'STAFF',
            },
          });
          counts.recordsCreated++;
        }
      } catch (err) {
        console.error(`[Bokadirekt Sync] Failed to upsert staff ${res.resourceId}:`, err);
        counts.recordsSkipped++;
      }
    }

    console.log(
      `[Bokadirekt Sync] Staff done — created: ${counts.recordsCreated}, updated: ${counts.recordsUpdated}, skipped: ${counts.recordsSkipped}`
    );
  } catch (err) {
    counts.error = err instanceof Error ? err.message : String(err);
    console.error('[Bokadirekt Sync] syncStaff failed:', err);
  }

  await completeSyncLog(logId, counts);
  return counts;
}

/**
 * Sync customers for a clinic.
 * Upserts on bokadirektId. Maps gender enum and consent flags.
 */
export async function syncCustomers(clinicId: string): Promise<SyncCounts> {
  const logId = await createSyncLog(clinicId, 'customers', 'full');
  const counts: SyncCounts = {
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { bokadirektApiKey: true },
    });

    const client = createClinicClient(clinic?.bokadirektApiKey);
    const customers: BokadirektCustomer[] = await client.fetchCustomers();
    counts.recordsFound = customers.length;

    console.log(`[Bokadirekt Sync] Fetched ${customers.length} customers for clinic ${clinicId}`);

    for (const c of customers) {
      if (!c.customerId) {
        counts.recordsSkipped++;
        continue;
      }

      // Parse first/last name from combined name if individual parts unavailable
      const nameParts = (c.name ?? '').trim().split(' ');
      const firstName = nameParts[0] ?? null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      const dateOfBirth = c.birthday ? new Date(c.birthday) : null;

      try {
        const existing = await prisma.customer.findUnique({
          where: { bokadirektId: c.customerId },
        });

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: c.name ?? existing.name,
              firstName: firstName ?? existing.firstName,
              lastName: lastName ?? existing.lastName,
              email: c.email ?? existing.email,
              phone: c.phone ?? existing.phone,
              city: c.city ?? existing.city,
              postalCode: c.postalCode ?? existing.postalCode,
              dateOfBirth: dateOfBirth ?? existing.dateOfBirth,
            },
          });
          counts.recordsUpdated++;
        } else {
          await prisma.customer.create({
            data: {
              bokadirektId: c.customerId,
              clinicId,
              name: c.name,
              firstName,
              lastName,
              email: c.email,
              phone: c.phone,
              city: c.city,
              postalCode: c.postalCode,
              dateOfBirth,
            },
          });
          counts.recordsCreated++;
        }
      } catch (err) {
        console.error(`[Bokadirekt Sync] Failed to upsert customer ${c.customerId}:`, err);
        counts.recordsSkipped++;
      }
    }

    console.log(
      `[Bokadirekt Sync] Customers done — created: ${counts.recordsCreated}, updated: ${counts.recordsUpdated}, skipped: ${counts.recordsSkipped}`
    );
  } catch (err) {
    counts.error = err instanceof Error ? err.message : String(err);
    console.error('[Bokadirekt Sync] syncCustomers failed:', err);
  }

  await completeSyncLog(logId, counts);
  return counts;
}

/**
 * Sync bookings for a clinic.
 * Default window: last 30 days. Pass startDate/endDate to override.
 * Also updates Customer.totalBookings and noShowCount.
 */
export async function syncBookings(
  clinicId: string,
  params: { startDate?: Date; endDate?: Date } = {}
): Promise<SyncCounts> {
  const now = new Date();
  const startDate = params.startDate ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);
  const endDate = params.endDate ?? now;

  const syncType = params.startDate ? 'incremental' : 'full';
  const logId = await createSyncLog(clinicId, 'bookings', syncType);
  const counts: SyncCounts = {
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { bokadirektApiKey: true },
    });

    const client = createClinicClient(clinic?.bokadirektApiKey);
    const bookings: BokadirektBooking[] = await client.fetchBookings({
      startDate,
      endDate,
      filterOnStartDate: true,
    });
    counts.recordsFound = bookings.length;

    console.log(`[Bokadirekt Sync] Fetched ${bookings.length} bookings for clinic ${clinicId}`);

    // Track no-show increments per customer to batch-update later
    const noShowDelta = new Map<string, number>();
    const totalBookingsDelta = new Map<string, number>();

    for (const b of bookings) {
      if (!b.bookingId) {
        counts.recordsSkipped++;
        continue;
      }

      try {
        // Resolve customer internal ID
        let customerId: string | undefined;
        if (b.customerId) {
          const cust = await prisma.customer.findUnique({
            where: { bokadirektId: b.customerId },
            select: { id: true },
          });
          customerId = cust?.id;
        }

        // Resolve staff internal ID
        let staffId: string | undefined;
        if (b.resourceId) {
          const staff = await prisma.staff.findUnique({
            where: { bokadirektId: b.resourceId },
            select: { id: true },
          });
          staffId = staff?.id;
        }

        // Resolve service internal ID
        let serviceId: string | undefined;
        if (b.serviceId) {
          const svc = await prisma.service.findUnique({
            where: { bokadirektId: b.serviceId },
            select: { id: true },
          });
          serviceId = svc?.id;
        }

        const status = mapBookingStatus(b);
        const duration = durationMinutes(b.startDate, b.endDate);
        const scheduledTime = new Date(b.startDate);

        const existing = await prisma.booking.findUnique({
          where: { bokadirektId: b.bookingId },
          select: { id: true, status: true },
        });

        if (existing) {
          await prisma.booking.update({
            where: { id: existing.id },
            data: {
              startTime: scheduledTime,
              endTime: new Date(b.endDate),
              scheduledTime,
              duration,
              status: status as any,
              price: b.bookedPrice,
              revenue: b.bookedPrice,
              isOnlineBooking: b.onlineBooking,
              treatmentType: b.serviceName ?? undefined,
              // Only update staffId/serviceId/customerId if we resolved them
              ...(staffId && { staffId }),
              ...(serviceId && { serviceId }),
              ...(customerId && { customerId }),
            },
          });
          counts.recordsUpdated++;
        } else {
          if (!customerId) {
            // Cannot create a booking without a customer FK
            counts.recordsSkipped++;
            continue;
          }
          await prisma.booking.create({
            data: {
              bokadirektId: b.bookingId,
              clinicId,
              customerId,
              staffId,
              serviceId,
              scheduledTime,
              startTime: scheduledTime,
              endTime: new Date(b.endDate),
              duration,
              status: status as any,
              price: b.bookedPrice,
              revenue: b.bookedPrice,
              source: 'bokadirekt',
              bookingChannel: b.onlineBooking ? 'ONLINE' : 'IN_PERSON',
              isOnlineBooking: b.onlineBooking,
              treatmentType: b.serviceName ?? '',
            },
          });
          counts.recordsCreated++;

          // Accumulate delta for customer counters
          if (customerId) {
            totalBookingsDelta.set(customerId, (totalBookingsDelta.get(customerId) ?? 0) + 1);
          }
        }

        // Track no-shows
        if (b.noShow && customerId) {
          noShowDelta.set(customerId, (noShowDelta.get(customerId) ?? 0) + 1);
        }
      } catch (err) {
        console.error(`[Bokadirekt Sync] Failed to upsert booking ${b.bookingId}:`, err);
        counts.recordsSkipped++;
      }
    }

    // Batch-update customer counters
    for (const [custId, delta] of totalBookingsDelta) {
      try {
        await prisma.customer.update({
          where: { id: custId },
          data: { totalBookings: { increment: delta } },
        });
      } catch (_) {
        // Non-critical — don't fail the sync
      }
    }
    for (const [custId, delta] of noShowDelta) {
      try {
        await prisma.customer.update({
          where: { id: custId },
          data: { noShowCount: { increment: delta } },
        });
      } catch (_) {
        // Non-critical
      }
    }

    console.log(
      `[Bokadirekt Sync] Bookings done — created: ${counts.recordsCreated}, updated: ${counts.recordsUpdated}, skipped: ${counts.recordsSkipped}`
    );
  } catch (err) {
    counts.error = err instanceof Error ? err.message : String(err);
    console.error('[Bokadirekt Sync] syncBookings failed:', err);
  }

  await completeSyncLog(logId, counts);
  return counts;
}

/**
 * Sync sales (financial receipts) for a clinic.
 * Default window: last 30 days.
 */
export async function syncSales(
  clinicId: string,
  params: { startDate?: Date; endDate?: Date } = {}
): Promise<SyncCounts> {
  const now = new Date();
  const startDate = params.startDate ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1_000);
  const endDate = params.endDate ?? now;

  const syncType = params.startDate ? 'incremental' : 'full';
  const logId = await createSyncLog(clinicId, 'sales', syncType);
  const counts: SyncCounts = {
    recordsFound: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { bokadirektApiKey: true },
    });

    const client = createClinicClient(clinic?.bokadirektApiKey);
    const saleResponses: BokadirektSaleResponse[] = await client.fetchSales({
      startDate,
      endDate,
    });

    // Flatten: each response has an array of headers (receipts)
    const allHeaders: Array<{ salonId: string; header: BokadirektSaleHeader }> = [];
    for (const resp of saleResponses) {
      for (const h of resp.headers ?? []) {
        allHeaders.push({ salonId: resp.salonId, header: h });
      }
    }
    counts.recordsFound = allHeaders.length;

    console.log(`[Bokadirekt Sync] Fetched ${allHeaders.length} sale receipts for clinic ${clinicId}`);

    for (const { header } of allHeaders) {
      if (!header.receiptNumber) {
        counts.recordsSkipped++;
        continue;
      }

      try {
        // Compute totals from rows
        const rows = header.rows ?? [];
        const totalAmount = rows.reduce((s, r) => s + (r.totalPriceIncVat ?? 0), 0);
        const totalVat = rows.reduce((s, r) => {
          const vatFraction = r.vatRate / (100 + r.vatRate);
          return s + r.totalPriceIncVat * vatFraction;
        }, 0);
        const totalDiscount = rows.reduce((s, r) => s + (r.discount ?? 0), 0);

        // Try to find a primary customer from rows
        const firstCustomerBdId = rows.find((r) => r.customerId)?.customerId ?? null;
        let customerId: string | undefined;
        if (firstCustomerBdId) {
          const cust = await prisma.customer.findUnique({
            where: { bokadirektId: firstCustomerBdId },
            select: { id: true },
          });
          customerId = cust?.id;
        }

        const existing = await prisma.sale.findUnique({
          where: { bokadirektId: header.receiptNumber },
          select: { id: true },
        });

        if (existing) {
          // Sales are immutable after creation — just track as updated
          counts.recordsUpdated++;
          continue;
        }

        // Create the Sale
        const sale = await prisma.sale.create({
          data: {
            bokadirektId: header.receiptNumber,
            clinicId,
            customerId,
            receiptDate: new Date(header.receiptDate),
            receiptType: header.receiptType ?? 0,
            receiptNumber: header.receiptNumber,
            totalAmount,
            totalVat,
            totalDiscount,
          },
        });

        // Create SaleItems
        for (const row of rows) {
          try {
            let rowStaffId: string | undefined;
            if (row.resourceId) {
              const staff = await prisma.staff.findUnique({
                where: { bokadirektId: row.resourceId },
                select: { id: true },
              });
              rowStaffId = staff?.id;
            }

            let rowCustomerId: string | undefined;
            if (row.customerId) {
              const cust = await prisma.customer.findUnique({
                where: { bokadirektId: row.customerId },
                select: { id: true },
              });
              rowCustomerId = cust?.id;
            }

            let rowBookingId: string | undefined;
            if (row.bookingId) {
              const booking = await prisma.booking.findUnique({
                where: { bokadirektId: row.bookingId },
                select: { id: true },
              });
              rowBookingId = booking?.id;
            }

            await prisma.saleItem.create({
              data: {
                saleId: sale.id,
                itemId: row.itemId,
                name: row.name,
                itemType: row.type ?? 0,
                staffId: rowStaffId,
                staffName: row.resourceName,
                bookingId: rowBookingId,
                customerId: rowCustomerId,
                customerName: row.customerName,
                quantity: row.quantity ?? 1,
                pricePerUnit: row.priceIncVat ?? 0,
                discount: row.discount ?? 0,
                totalPrice: row.totalPriceIncVat ?? 0,
                vatRate: row.vatRate ?? 0,
              },
            });
          } catch (rowErr) {
            console.error(`[Bokadirekt Sync] Failed to create SaleItem for receipt ${header.receiptNumber}:`, rowErr);
          }
        }

        // Create SalePayments
        for (const payment of header.payments ?? []) {
          try {
            await prisma.salePayment.create({
              data: {
                saleId: sale.id,
                paymentType: payment.paymentType ?? 0,
                amount: payment.amount ?? 0,
              },
            });
          } catch (payErr) {
            console.error(`[Bokadirekt Sync] Failed to create SalePayment for receipt ${header.receiptNumber}:`, payErr);
          }
        }

        counts.recordsCreated++;
      } catch (err) {
        console.error(`[Bokadirekt Sync] Failed to upsert sale ${header.receiptNumber}:`, err);
        counts.recordsSkipped++;
      }
    }

    // Recalculate customer totalSpent from Sales
    await recalculateCustomerTotalSpent(clinicId);

    console.log(
      `[Bokadirekt Sync] Sales done — created: ${counts.recordsCreated}, updated: ${counts.recordsUpdated}, skipped: ${counts.recordsSkipped}`
    );
  } catch (err) {
    counts.error = err instanceof Error ? err.message : String(err);
    console.error('[Bokadirekt Sync] syncSales failed:', err);
  }

  await completeSyncLog(logId, counts);
  return counts;
}

/**
 * Recalculate Customer.totalSpent from Sale records (not from bookings).
 * Only considers sale type 0 (Sale) and excludes refunds.
 */
async function recalculateCustomerTotalSpent(clinicId: string): Promise<void> {
  try {
    // Aggregate SaleItem totals per customer for this clinic
    const customerTotals = await prisma.saleItem.groupBy({
      by: ['customerId'],
      where: {
        customerId: { not: null },
        sale: {
          clinicId,
          receiptType: 0, // Sales only, not refunds
        },
      },
      _sum: { totalPrice: true },
    });

    for (const row of customerTotals) {
      if (!row.customerId) continue;
      const total = Number(row._sum.totalPrice ?? 0);
      try {
        await prisma.customer.update({
          where: { id: row.customerId },
          data: { totalSpent: total },
        });
      } catch (_) {
        // Non-critical
      }
    }
    console.log(`[Bokadirekt Sync] Recalculated totalSpent for ${customerTotals.length} customers.`);
  } catch (err) {
    console.error('[Bokadirekt Sync] recalculateCustomerTotalSpent failed:', err);
  }
}

// ─── Full sync orchestrator ───────────────────────────────────────────────────

export interface SyncAllResult {
  clinicId: string;
  services: SyncCounts;
  staff: SyncCounts;
  customers: SyncCounts;
  bookings: SyncCounts;
  sales: SyncCounts;
  overall: {
    success: boolean;
    totalDurationMs: number;
    hasErrors: boolean;
  };
}

/**
 * Run all entity syncs in the correct order for a single clinic.
 * Each sync is independent — a failure in one does not stop the others.
 *
 * Default date window for bookings & sales: last 30 days.
 * Pass `since` to do an incremental sync from that point.
 */
export async function syncAll(
  clinicId: string,
  options: { since?: Date } = {}
): Promise<SyncAllResult> {
  const overallStart = Date.now();
  console.log(`[Bokadirekt Sync] Starting full sync for clinic ${clinicId}...`);

  const dateParams = options.since
    ? { startDate: options.since, endDate: new Date() }
    : {};

  // Sync in dependency order — sequential to respect rate limits
  const services = await syncServices(clinicId);
  const staff = await syncStaff(clinicId);
  const customers = await syncCustomers(clinicId);
  const bookings = await syncBookings(clinicId, dateParams);
  const sales = await syncSales(clinicId, dateParams);

  const totalDurationMs = Date.now() - overallStart;
  const hasErrors = !!(
    services.error ||
    staff.error ||
    customers.error ||
    bookings.error ||
    sales.error
  );

  console.log(
    `[Bokadirekt Sync] Full sync for clinic ${clinicId} completed in ${totalDurationMs}ms. ` +
      `services(+${services.recordsCreated}/~${services.recordsUpdated}) ` +
      `staff(+${staff.recordsCreated}/~${staff.recordsUpdated}) ` +
      `customers(+${customers.recordsCreated}/~${customers.recordsUpdated}) ` +
      `bookings(+${bookings.recordsCreated}/~${bookings.recordsUpdated}) ` +
      `sales(+${sales.recordsCreated}/~${sales.recordsUpdated})`
  );

  if (hasErrors) {
    const errors = [
      services.error && `services: ${services.error}`,
      staff.error && `staff: ${staff.error}`,
      customers.error && `customers: ${customers.error}`,
      bookings.error && `bookings: ${bookings.error}`,
      sales.error && `sales: ${sales.error}`,
    ]
      .filter(Boolean)
      .join(' | ');
    console.warn(`[Bokadirekt Sync] Sync completed with errors: ${errors}`);
  }

  return {
    clinicId,
    services,
    staff,
    customers,
    bookings,
    sales,
    overall: {
      success: !hasErrors,
      totalDurationMs,
      hasErrors,
    },
  };
}
