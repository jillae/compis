/**
 * Client-safe enum types that mirror Prisma enums.
 * 
 * Use these in 'use client' components instead of importing from @prisma/client,
 * which can cause runtime errors in the browser.
 * 
 * Server-side code (API routes, server components) can still use @prisma/client directly.
 */

// User & Auth
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CLINIC_ADMIN' | 'CLINIC_STAFF' | 'USER'
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const,
  ADMIN: 'ADMIN' as const,
  STAFF: 'STAFF' as const,
  CLINIC_ADMIN: 'CLINIC_ADMIN' as const,
  CLINIC_STAFF: 'CLINIC_STAFF' as const,
  USER: 'USER' as const,
}

// Subscription
export type SubscriptionTier = 'INTERNAL' | 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
export const SubscriptionTier = {
  INTERNAL: 'INTERNAL' as const,
  FREE: 'FREE' as const,
  BASIC: 'BASIC' as const,
  PROFESSIONAL: 'PROFESSIONAL' as const,
  ENTERPRISE: 'ENTERPRISE' as const,
}

// Display
export type DisplayMode = 'FULL' | 'OPERATIONS' | 'KIOSK' | 'CAMPAIGNS'
export const DisplayMode = {
  FULL: 'FULL' as const,
  OPERATIONS: 'OPERATIONS' as const,
  KIOSK: 'KIOSK' as const,
  CAMPAIGNS: 'CAMPAIGNS' as const,
}

// Actions
export type ActionCategory = 'CAPACITY_OPTIMIZATION' | 'PRICING' | 'MARKETING' | 'SERVICE_MIX' | 'CUSTOMER_RETENTION' | 'STAFFING'
export const ActionCategory = {
  CAPACITY_OPTIMIZATION: 'CAPACITY_OPTIMIZATION' as const,
  PRICING: 'PRICING' as const,
  MARKETING: 'MARKETING' as const,
  SERVICE_MIX: 'SERVICE_MIX' as const,
  CUSTOMER_RETENTION: 'CUSTOMER_RETENTION' as const,
  STAFFING: 'STAFFING' as const,
}

export type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED'
export const ActionStatus = {
  PENDING: 'PENDING' as const,
  IN_PROGRESS: 'IN_PROGRESS' as const,
  COMPLETED: 'COMPLETED' as const,
  DISMISSED: 'DISMISSED' as const,
}

// Unlayer
export type UnlayerPlan = 'FREE' | 'LAUNCH' | 'SCALE' | 'OPTIMIZE'
export const UnlayerPlan = {
  FREE: 'FREE' as const,
  LAUNCH: 'LAUNCH' as const,
  SCALE: 'SCALE' as const,
  OPTIMIZE: 'OPTIMIZE' as const,
}

export type UnlayerLicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED' | 'PENDING'
export const UnlayerLicenseStatus = {
  ACTIVE: 'ACTIVE' as const,
  EXPIRED: 'EXPIRED' as const,
  SUSPENDED: 'SUSPENDED' as const,
  CANCELLED: 'CANCELLED' as const,
  PENDING: 'PENDING' as const,
}
