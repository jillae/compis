
-- Referral Program Migration
-- Run this SQL in Supabase SQL Editor

-- Add ReferralStatus enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add referral fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "referredById" TEXT;

-- Add foreign key constraint for referredBy
DO $$ BEGIN
    ALTER TABLE "User"
    ADD CONSTRAINT "User_referredById_fkey" 
    FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Referral table
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "referredId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardGrantedAt" TIMESTAMP(3),
    "referrerReward" INTEGER NOT NULL DEFAULT 1,
    "referredReward" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE SET NULL
);

-- Add freeMonthsRemaining to Subscription table
ALTER TABLE "Subscription"
ADD COLUMN IF NOT EXISTS "freeMonthsRemaining" INTEGER NOT NULL DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "User"("referralCode");
CREATE INDEX IF NOT EXISTS "User_referredById_idx" ON "User"("referredById");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX IF NOT EXISTS "Referral_referredEmail_idx" ON "Referral"("referredEmail");
CREATE INDEX IF NOT EXISTS "Referral_referredId_idx" ON "Referral"("referredId");
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");
CREATE INDEX IF NOT EXISTS "Referral_createdAt_idx" ON "Referral"("createdAt");

-- Generate referral codes for existing users (optional)
UPDATE "User" 
SET "referralCode" = CONCAT('FLOW-', UPPER(SUBSTRING(id, 1, 8)))
WHERE "referralCode" IS NULL AND role IN ('ADMIN', 'SUPER_ADMIN');

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('referralCode', 'referredById')
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Subscription' 
AND column_name = 'freeMonthsRemaining'
ORDER BY ordinal_position;

SELECT 
    table_name
FROM information_schema.tables 
WHERE table_name = 'Referral';

COMMENT ON TABLE "Referral" IS 'Referral program tracking - rewards for referring new clinics';
COMMENT ON COLUMN "User"."referralCode" IS 'Unique referral code for this user (e.g., FLOW-ABC12345)';
COMMENT ON COLUMN "User"."referredById" IS 'User ID of the person who referred this user';
COMMENT ON COLUMN "Subscription"."freeMonthsRemaining" IS 'Number of free months remaining from referral rewards';
