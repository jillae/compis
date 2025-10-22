
-- =====================================================
-- RLS (Row Level Security) POLICIES
-- Klinik Flow - October 2025
-- =====================================================
-- CRITICAL: Protect sensitive data with RLS
-- Run this AFTER secret rotation is complete

-- =====================================================
-- 1. FLOW_CUSTOMERS TABLE (INNEHÅLLER PERSONNUMMER!)
-- =====================================================

-- Enable RLS
ALTER TABLE "flow_customers" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "flow_customers_superadmin_admin_access" ON "flow_customers";
DROP POLICY IF EXISTS "flow_customers_read_only" ON "flow_customers";

-- Policy: Only SUPER_ADMIN and ADMIN can access
CREATE POLICY "flow_customers_superadmin_admin_access" 
ON "flow_customers"
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- Alternative: If you want regular users to see their own data only
-- CREATE POLICY "flow_customers_own_clinic_access" 
-- ON "flow_customers"
-- FOR SELECT
-- USING (
--   clinicId IN (
--     SELECT clinicId FROM users WHERE id = auth.uid()
--   )
-- );

COMMENT ON TABLE "flow_customers" IS 'RLS enabled: Only SUPER_ADMIN and ADMIN can access. Contains personnummer.';

-- =====================================================
-- 2. META_CONNECTIONS TABLE (INNEHÅLLER ACCESS TOKENS!)
-- =====================================================

-- Enable RLS
ALTER TABLE "meta_connections" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "meta_connections_superadmin_only" ON "meta_connections";

-- Policy: Only SUPER_ADMIN can access
CREATE POLICY "meta_connections_superadmin_only" 
ON "meta_connections"
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'SUPER_ADMIN'
  )
);

COMMENT ON TABLE "meta_connections" IS 'RLS enabled: Only SUPER_ADMIN can access. Contains Meta access tokens.';

-- =====================================================
-- 3. AUTOMATION_INSTRUCTIONS TABLE (AI PROMPTS)
-- =====================================================

-- Enable RLS
ALTER TABLE "automation_instructions" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "automation_instructions_superadmin_only" ON "automation_instructions";

-- Policy: Only SUPER_ADMIN can access
CREATE POLICY "automation_instructions_superadmin_only" 
ON "automation_instructions"
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'SUPER_ADMIN'
  )
);

COMMENT ON TABLE "automation_instructions" IS 'RLS enabled: Only SUPER_ADMIN can access. Contains AI system prompts.';

-- =====================================================
-- 4. CUSTOMERS TABLE (KUNDDATA)
-- =====================================================

-- Enable RLS
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "customers_clinic_access" ON "customers";

-- Policy: Users can only see customers from their clinic
CREATE POLICY "customers_clinic_access" 
ON "customers"
FOR ALL
USING (
  clinicId IN (
    SELECT clinicId FROM users WHERE id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN')
  )
);

COMMENT ON TABLE "customers" IS 'RLS enabled: Users can only access customers from their own clinic. SUPER_ADMIN sees all.';

-- =====================================================
-- 5. LEADS TABLE (LEAD GENERATION DATA)
-- =====================================================

-- Enable RLS
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "leads_clinic_access" ON "leads";

-- Policy: Users can only see leads from their clinic
CREATE POLICY "leads_clinic_access" 
ON "leads"
FOR ALL
USING (
  clinicId IN (
    SELECT clinicId FROM users WHERE id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN')
  )
);

COMMENT ON TABLE "leads" IS 'RLS enabled: Users can only access leads from their own clinic. SUPER_ADMIN sees all.';

-- =====================================================
-- 6. USERS TABLE (USER CREDENTIALS)
-- =====================================================

-- Enable RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_own_data_or_admin" ON "users";

-- Policy: Users can see their own data + admins see all in their clinic
CREATE POLICY "users_own_data_or_admin" 
ON "users"
FOR SELECT
USING (
  id = auth.uid()
  OR
  (
    clinicId IN (
      SELECT clinicId FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  )
  OR
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'SUPER_ADMIN'
  )
);

-- Policy: Only SUPER_ADMIN and ADMIN can update users
CREATE POLICY "users_update_admin_only" 
ON "users"
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- Policy: Only SUPER_ADMIN can delete users
CREATE POLICY "users_delete_superadmin_only" 
ON "users"
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'SUPER_ADMIN'
  )
);

COMMENT ON TABLE "users" IS 'RLS enabled: Users see own data. Admins see clinic users. SUPER_ADMIN sees all.';

-- =====================================================
-- 7. BOOKINGS TABLE (BOOKING DATA)
-- =====================================================

-- Enable RLS
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "bookings_clinic_access" ON "bookings";

-- Policy: Users can only see bookings from their clinic
CREATE POLICY "bookings_clinic_access" 
ON "bookings"
FOR ALL
USING (
  clinicId IN (
    SELECT clinicId FROM users WHERE id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('SUPER_ADMIN')
  )
);

COMMENT ON TABLE "bookings" IS 'RLS enabled: Users can only access bookings from their own clinic. SUPER_ADMIN sees all.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check which tables have RLS enabled:
SELECT 
  schemaname, 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'flow_customers', 
    'meta_connections', 
    'automation_instructions',
    'customers',
    'leads',
    'users',
    'bookings'
  )
ORDER BY tablename;

-- Check policies:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- RLS (Row Level Security) är PostgreSQL's sätt att säkerställa
-- att användare endast kan se och modifiera data de har tillgång till.
--
-- VIKTIGT:
-- 1. Detta skyddar INTE mot SQL injection - använd prepared statements
-- 2. Detta skyddar INTE mot komprometterade API keys - rotera secrets!
-- 3. RLS körs på databasnivå = performance impact (liten, men finns)
--
-- TESTING:
-- För att testa policies, använd:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '[USER_ID]';
-- SELECT * FROM flow_customers; -- Should only show accessible data
--
-- DEBUGGING:
-- Om queries misslyckas med "permission denied":
-- 1. Check auth.uid() returns correct user ID
-- 2. Check user's role in users table
-- 3. Check policy USING clause matches your query
--
-- =====================================================
-- ROLLBACK (IF NEEDED)
-- =====================================================
-- 
-- Om något går fel, disable RLS temporarily:
-- ALTER TABLE "flow_customers" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "meta_connections" DISABLE ROW LEVEL SECURITY;
-- etc...
--
-- =====================================================
