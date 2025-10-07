// Flow Revenue Intelligence Platform - Type definitions

import type { Booking } from '@prisma/client'

// Extended User type for NextAuth
declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string
    firstName?: string
    lastName?: string
    companyName?: string
    jobTitle?: string
  }

  interface Session {
    user: User & {
      id: string
      firstName?: string
      lastName?: string
      companyName?: string
      jobTitle?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    firstName?: string
    lastName?: string
    companyName?: string
    jobTitle?: string
  }
}

// Dashboard metrics types
export interface DashboardMetrics {
  totalBookings: number
  totalRevenue: number
  noShowRate: number
  utilizationRate: number
  hourlyNoShows: number[]
  dailyTrends: Array<{
    bookings: number
    noShows: number
  }>
}

// Booking with relations
export interface BookingWithRelations extends Booking {
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
  staff?: {
    name: string
    specialization?: string
  }
  room?: {
    name: string
    equipmentType?: string
  }
}

// CSV Import types
export interface CSVMapping {
  customerEmail: string
  customerPhone?: string
  customerName?: string
  treatmentType: string
  scheduledTime: string
  duration?: string
  price?: string
  status?: string
  staffName?: string
}

export interface ImportResult {
  success: boolean
  importId: string
  successCount: number
  errorCount: number
  errors: string[]
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  pages: number
}

export interface BookingsResponse {
  bookings: BookingWithRelations[]
  pagination: PaginationParams
}

// Chart data types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesDataPoint {
  date: string
  bookings: number
  noShows: number
}

// Booking status options
export const BOOKING_STATUSES = [
  'SCHEDULED',
  'CONFIRMED', 
  'IN_PROGRESS',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
  'RESCHEDULED'
] as const

export type BookingStatus = typeof BOOKING_STATUSES[number]

// Booking channel options  
export const BOOKING_CHANNELS = [
  'online',
  'phone', 
  'walk-in',
  'import',
  'referral'
] as const

export type BookingChannel = typeof BOOKING_CHANNELS[number]

// Date range type
export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}