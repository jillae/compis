
-- ============================================
-- BOKADIREKT AUTO-BOOKING MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor to add auto-booking functionality
-- Created: 2025-10-25

-- Create enum for auto-booking modes
CREATE TYPE "BokadirektAutoBookingMode" AS ENUM ('OFF', 'NOTIFY', 'AUTO');

-- Add auto-booking fields to Clinic table
ALTER TABLE "Clinic" 
ADD COLUMN IF NOT EXISTS "bokadirektAutoBookingMode" "BokadirektAutoBookingMode" DEFAULT 'OFF',
ADD COLUMN IF NOT EXISTS "autoBookingPreferredServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "autoBookingPreferredStaff" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "autoBookingMaxDaysAhead" INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS "autoBookingNotifyEmail" TEXT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Auto-booking system is now ready!
-- Access settings via: /dashboard/settings (coming soon)
-- API endpoint: /api/bokadirekt/auto-booking
