
-- ============================================
-- FAQ MANAGEMENT SYSTEM MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor to add FAQ system
-- Created: 2025-10-25

-- Create FAQs table
CREATE TABLE IF NOT EXISTS "faqs" (
  "id" TEXT PRIMARY KEY,
  "clinicId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" TEXT,
  "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "priority" INTEGER DEFAULT 0,
  "timesUsed" INTEGER DEFAULT 0,
  "lastUsedAt" TIMESTAMP,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT "faqs_clinicId_fkey" FOREIGN KEY ("clinicId") 
    REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "faqs_clinicId_idx" ON "faqs"("clinicId");
CREATE INDEX IF NOT EXISTS "faqs_category_idx" ON "faqs"("category");
CREATE INDEX IF NOT EXISTS "faqs_isActive_idx" ON "faqs"("isActive");
CREATE INDEX IF NOT EXISTS "faqs_priority_idx" ON "faqs"("priority");

-- ============================================
-- SAMPLE FAQs (optional - remove if not needed)
-- ============================================

-- Insert some example FAQs for testing
-- Note: Replace 'YOUR_CLINIC_ID' with actual clinic ID

/*
INSERT INTO "faqs" ("id", "clinicId", "question", "answer", "category", "keywords", "priority", "isActive")
VALUES
  (
    gen_random_uuid()::TEXT,
    'YOUR_CLINIC_ID',
    'Vad kostar en konsultation?',
    'En första konsultation kostar 500 kr och tar ca 30 minuter. Under konsultationen går vi igenom dina behov och skapar en individuell behandlingsplan.',
    'Priser',
    ARRAY['pris', 'konsultation', 'kostnad', 'första besök'],
    10,
    true
  ),
  (
    gen_random_uuid()::TEXT,
    'YOUR_CLINIC_ID',
    'Hur bokar jag tid?',
    'Du kan boka tid genom att ringa oss på 023-125 25, mejla info@kliniken.se eller boka direkt via vår hemsida. Vi har öppet måndagar 09-20:30, tisdag-onsdag 08:30-20:30, torsdagar 08:30-17:30 och fredagar 08:30-14:00.',
    'Bokningar',
    ARRAY['boka', 'tid', 'bokning', 'öppettider'],
    9,
    true
  ),
  (
    gen_random_uuid()::TEXT,
    'YOUR_CLINIC_ID',
    'Vilka betalningsmetoder accepterar ni?',
    'Vi accepterar kontanter, kort (Visa, Mastercard), Swish och faktura. Betalning sker vid bokning eller på plats.',
    'Policies',
    ARRAY['betalning', 'betala', 'kort', 'swish', 'faktura'],
    5,
    true
  );
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- FAQ system is now ready to use!
-- Access it via: /superadmin/faq
