
-- A/B Testing Framework Migration
-- Run this in Supabase SQL Editor

-- Create ABTestStatus enum
CREATE TYPE "ABTestStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- Create ABTest table
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ABTestStatus" NOT NULL DEFAULT 'DRAFT',
    "variantA" JSONB NOT NULL,
    "variantB" JSONB NOT NULL,
    "trafficSplit" INTEGER NOT NULL DEFAULT 50,
    "targetPage" TEXT NOT NULL,
    "targetElement" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "conversionGoal" TEXT,
    "clinicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ABTest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ABTestVariant table
CREATE TABLE "ABTestVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ABTestVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ABTestVariant_testId_variant_key" UNIQUE ("testId", "variant")
);

-- Create ABTestConversion table
CREATE TABLE "ABTestConversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ABTestConversion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for ABTest
CREATE INDEX "ABTest_clinicId_idx" ON "ABTest"("clinicId");
CREATE INDEX "ABTest_status_idx" ON "ABTest"("status");
CREATE INDEX "ABTest_targetPage_idx" ON "ABTest"("targetPage");

-- Create indexes for ABTestVariant
CREATE INDEX "ABTestVariant_testId_idx" ON "ABTestVariant"("testId");

-- Create indexes for ABTestConversion
CREATE INDEX "ABTestConversion_testId_idx" ON "ABTestConversion"("testId");
CREATE INDEX "ABTestConversion_variant_idx" ON "ABTestConversion"("variant");
CREATE INDEX "ABTestConversion_eventType_idx" ON "ABTestConversion"("eventType");
CREATE INDEX "ABTestConversion_userId_idx" ON "ABTestConversion"("userId");
CREATE INDEX "ABTestConversion_sessionId_idx" ON "ABTestConversion"("sessionId");

-- Create trigger for updatedAt on ABTest
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ABTest_updatedAt BEFORE UPDATE ON "ABTest"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ABTestVariant_updatedAt BEFORE UPDATE ON "ABTestVariant"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification queries
-- Run these to verify the migration was successful

-- Check if enum was created
SELECT pg_enum.enumlabel 
FROM pg_type 
JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'ABTestStatus';
-- Expected result: DRAFT, RUNNING, PAUSED, COMPLETED, ARCHIVED

-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('ABTest', 'ABTestVariant', 'ABTestConversion');
-- Expected result: All 3 tables should be listed

-- Check if indexes were created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('ABTest', 'ABTestVariant', 'ABTestConversion')
ORDER BY tablename, indexname;
-- Expected result: All indexes listed above

COMMENT ON TABLE "ABTest" IS 'A/B Testing configuration and management';
COMMENT ON TABLE "ABTestVariant" IS 'Metrics tracking for each test variant (A/B)';
COMMENT ON TABLE "ABTestConversion" IS 'Event logging for A/B test interactions';
