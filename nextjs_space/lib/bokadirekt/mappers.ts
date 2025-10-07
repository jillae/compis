
// Data Mappers: Bokadirekt API → Prisma Schema

import {
  BokadirektBooking,
  BokadirektCustomer,
  BokadirektResource,
  BokadirektService
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
