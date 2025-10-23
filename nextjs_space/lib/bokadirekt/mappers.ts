
// Data Mappers: Bokadirekt API → Prisma Schema

import {
  BokadirektBooking,
  BokadirektCustomer,
  BokadirektResource,
  BokadirektService,
  BokadirektSaleResponse,
  BokadirektSaleHeader,
  BokadirektSaleRow,
  BokadirektSalePayment
} from './types';

export interface PrismaBooking {
  id: string;
  customerId: string;
  staffId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  revenue: number;
  cost: number;
  source: string;
  notes: string | null;
  treatmentType: string;
  scheduledTime: Date;
  duration: number;
  price: number;
  bookedAt: Date;
}

export interface PrismaCustomer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  dateOfBirth: Date | null;
  city: string | null;
  postalCode: string | null;
}

export interface PrismaStaff {
  id: string;
  name: string;
  email: string | null;
  specializations: string[];
}

export interface PrismaService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

// Map Bokadirekt Booking → Prisma Booking
export function mapBookingToPrisma(booking: BokadirektBooking): PrismaBooking {
  // Determine status
  let status: PrismaBooking['status'] = 'CONFIRMED';
  if (booking.cancelled) {
    status = 'CANCELLED';
  } else if (booking.noShow) {
    status = 'NO_SHOW';
  } else {
    const now = new Date();
    const endTime = new Date(booking.endDate);
    status = endTime < now ? 'COMPLETED' : 'CONFIRMED';
  }
  
  // Determine source
  let source = 'bokadirekt';
  if (booking.onlineBooking) {
    source = 'bokadirekt_online';
  } else if (booking.dropIn) {
    source = 'bokadirekt_walkin';
  }
  
  // Build notes
  const notes: string[] = [];
  if (booking.dropIn) notes.push('Walk-in appointment');
  if (booking.rebooked) notes.push('Rebooking');
  if (booking.isAddon) notes.push('Add-on service');
  
  const startTime = new Date(booking.startDate);
  const endTime = new Date(booking.endDate);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
  
  return {
    id: booking.bookingId,
    customerId: booking.customerId,
    staffId: booking.resourceId,
    serviceId: booking.serviceId,
    startTime,
    endTime,
    scheduledTime: startTime,
    duration,
    status,
    revenue: booking.bookedPrice,
    price: booking.bookedPrice,
    cost: 0, // Cost not provided by Bokadirekt, will need to calculate separately
    source,
    notes: notes.length > 0 ? notes.join('; ') : null,
    treatmentType: booking.serviceName || 'Unknown Service',
    bookedAt: new Date(booking.created),
  };
}

// Map Bokadirekt Customer → Prisma Customer
export function mapCustomerToPrisma(customer: BokadirektCustomer): PrismaCustomer {
  // Map categories to tags
  const tags = customer.categories || [];
  
  // Parse birthday
  let dateOfBirth: Date | null = null;
  if (customer.birthday) {
    try {
      dateOfBirth = new Date(customer.birthday);
    } catch (error) {
      console.error(`[Mapper] Invalid birthday format: ${customer.birthday}`);
    }
  }
  
  return {
    id: customer.customerId,
    name: customer.name || 'Unknown Customer',
    email: customer.email,
    phone: customer.phone,
    tags,
    dateOfBirth,
    city: customer.city,
    postalCode: customer.postalCode,
  };
}

// Map Bokadirekt Resource → Prisma Staff
export function mapResourceToPrisma(resource: BokadirektResource): PrismaStaff {
  return {
    id: resource.resourceId,
    name: resource.resourceName || resource.resourceNickName || 'Unknown Staff',
    email: null, // Email not provided by Bokadirekt Resources endpoint
    specializations: [], // Specializations not directly provided, can infer from services later
  };
}

// Map Bokadirekt Service → Prisma Service
export function mapServiceToPrisma(service: BokadirektService): PrismaService {
  // Extract category from service name (simple heuristic)
  const nameLower = (service.serviceName || '').toLowerCase();
  let category = 'general';
  
  if (nameLower.includes('massage')) category = 'massage';
  else if (nameLower.includes('facial') || nameLower.includes('ansikts')) category = 'facial';
  else if (nameLower.includes('hair') || nameLower.includes('hår')) category = 'hair';
  else if (nameLower.includes('nail') || nameLower.includes('nagel')) category = 'nails';
  else if (nameLower.includes('wax') || nameLower.includes('vax')) category = 'waxing';
  else if (nameLower.includes('spa')) category = 'spa';
  
  return {
    id: service.serviceId,
    name: service.serviceName || 'Unknown Service',
    category,
    price: 0, // Price not provided by Services endpoint, will need to get from bookings
    duration: 60, // Duration not provided, default to 60 minutes
  };
}

// Batch mappers
export function mapBookingsBatch(bookings: BokadirektBooking[]): PrismaBooking[] {
  return bookings
    .map((booking) => {
      try {
        return mapBookingToPrisma(booking);
      } catch (error) {
        console.error(`[Mapper] Failed to map booking ${booking.bookingId}:`, error);
        return null;
      }
    })
    .filter((booking): booking is PrismaBooking => booking !== null);
}

export function mapCustomersBatch(customers: BokadirektCustomer[]): PrismaCustomer[] {
  return customers
    .map((customer) => {
      try {
        return mapCustomerToPrisma(customer);
      } catch (error) {
        console.error(`[Mapper] Failed to map customer ${customer.customerId}:`, error);
        return null;
      }
    })
    .filter((customer): customer is PrismaCustomer => customer !== null);
}

export function mapResourcesBatch(resources: BokadirektResource[]): PrismaStaff[] {
  return resources
    .map((resource) => {
      try {
        return mapResourceToPrisma(resource);
      } catch (error) {
        console.error(`[Mapper] Failed to map resource ${resource.resourceId}:`, error);
        return null;
      }
    })
    .filter((staff): staff is PrismaStaff => staff !== null);
}

export function mapServicesBatch(services: BokadirektService[]): PrismaService[] {
  return services
    .map((service) => {
      try {
        return mapServiceToPrisma(service);
      } catch (error) {
        console.error(`[Mapper] Failed to map service ${service.serviceId}:`, error);
        return null;
      }
    })
    .filter((service): service is PrismaService => service !== null);
}

// ===== SALES MAPPERS =====
// Map Bokadirekt Sales (Financial Transactions) → Prisma

export interface PrismaSale {
  bokadirektId: string; // receipt number
  receiptDate: Date;
  receiptType: number;
  receiptNumber: string | null;
  totalAmount: number;
  totalVat: number;
  totalDiscount: number;
  customerId: string | null; // First customer from items, or null
  clinicId: string | null; // From context
}

export interface PrismaSaleItem {
  saleId: string; // Will be set after sale creation
  itemId: string | null;
  name: string | null;
  itemType: number;
  staffId: string | null;
  staffName: string | null;
  bookingId: string | null;
  customerId: string | null;
  customerName: string | null;
  quantity: number;
  pricePerUnit: number;
  discount: number;
  totalPrice: number;
  vatRate: number;
}

export interface PrismaSalePayment {
  saleId: string; // Will be set after sale creation
  paymentType: number;
  amount: number;
}

// Map a single Sale Header to Prisma Sale
export function mapSaleHeaderToPrisma(
  header: BokadirektSaleHeader,
  receiptNumber: string,
  clinicId?: string
): PrismaSale {
  const rows = header.rows || [];
  const payments = header.payments || [];
  
  // Calculate totals
  const totalAmount = rows.reduce((sum, row) => sum + (row.totalPriceIncVat || 0), 0);
  const totalDiscount = rows.reduce((sum, row) => sum + (row.discount || 0), 0);
  
  // Calculate VAT (totalPriceIncVat includes VAT, so we need to extract it)
  const totalVat = rows.reduce((sum, row) => {
    const vatRate = row.vatRate || 0;
    const priceIncVat = row.totalPriceIncVat || 0;
    // VAT amount = priceIncVat * (vatRate / (100 + vatRate))
    const vatAmount = priceIncVat * (vatRate / (100 + vatRate));
    return sum + vatAmount;
  }, 0);
  
  // Get first customer ID from rows (if any)
  const firstCustomerId = rows.find(r => r.customerId)?.customerId || null;
  
  return {
    bokadirektId: receiptNumber, // Use receipt number as unique ID
    receiptDate: new Date(header.receiptDate),
    receiptType: header.receiptType,
    receiptNumber: header.receiptNumber,
    totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
    totalVat: Math.round(totalVat * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    customerId: firstCustomerId,
    clinicId: clinicId || null,
  };
}

// Map Sale Rows to Prisma Sale Items
export function mapSaleRowsToPrismaItems(rows: BokadirektSaleRow[]): PrismaSaleItem[] {
  return rows.map((row) => ({
    saleId: '', // Will be set after sale creation
    itemId: row.itemId,
    name: row.name,
    itemType: row.type,
    staffId: row.resourceId,
    staffName: row.resourceName,
    bookingId: row.bookingId,
    customerId: row.customerId,
    customerName: row.customerName,
    quantity: row.quantity || 1,
    pricePerUnit: row.priceIncVat || 0,
    discount: row.discount || 0,
    totalPrice: row.totalPriceIncVat || 0,
    vatRate: row.vatRate || 0,
  }));
}

// Map Sale Payments to Prisma Sale Payments
export function mapSalePaymentsToPrisma(payments: BokadirektSalePayment[]): PrismaSalePayment[] {
  return payments.map((payment) => ({
    saleId: '', // Will be set after sale creation
    paymentType: payment.paymentType,
    amount: payment.amount,
  }));
}

// Batch mapper for full sale response
export function mapSalesResponseBatch(
  salesResponses: BokadirektSaleResponse[],
  clinicId?: string
): Array<{
  sale: PrismaSale;
  items: PrismaSaleItem[];
  payments: PrismaSalePayment[];
}> {
  const results: Array<{
    sale: PrismaSale;
    items: PrismaSaleItem[];
    payments: PrismaSalePayment[];
  }> = [];
  
  for (const response of salesResponses) {
    const headers = response.headers || [];
    
    for (const header of headers) {
      try {
        // Use receipt number as unique ID, or generate one from date + type
        const receiptNumber = header.receiptNumber || 
          `${header.receiptDate}_${header.receiptType}_${Math.random().toString(36).substr(2, 9)}`;
        
        const sale = mapSaleHeaderToPrisma(header, receiptNumber, clinicId);
        const items = mapSaleRowsToPrismaItems(header.rows || []);
        const payments = mapSalePaymentsToPrisma(header.payments || []);
        
        results.push({ sale, items, payments });
      } catch (error) {
        console.error(`[Mapper] Failed to map sale header:`, error, header);
      }
    }
  }
  
  return results;
}
