
-- Beta Program Implementation
-- Run this SQL in Supabase SQL Editor

-- Add beta status enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "BetaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NONE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add beta program fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "betaStatus" "BetaStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS "betaAppliedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "betaApprovedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "hasSeenProductTour" BOOLEAN NOT NULL DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "User_betaStatus_idx" ON "User"("betaStatus");

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('betaStatus', 'betaAppliedAt', 'betaApprovedAt', 'hasSeenProductTour')
ORDER BY ordinal_position;

COMMENT ON COLUMN "User"."betaStatus" IS 'Beta program status: PENDING (awaiting approval), APPROVED (active beta tester), REJECTED (declined), NONE (not applied)';
COMMENT ON COLUMN "User"."betaAppliedAt" IS 'Timestamp when user applied for beta program';
COMMENT ON COLUMN "User"."betaApprovedAt" IS 'Timestamp when user was approved for beta program';
COMMENT ON COLUMN "User"."hasSeenProductTour" IS 'Whether user has completed the product tour';
