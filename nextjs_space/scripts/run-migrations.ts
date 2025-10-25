
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigrations() {
  console.log('🔍 Checking current database status...\n');

  try {
    // Check if beta fields exist
    const userFields = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('betaStatus', 'betaAppliedAt', 'betaApprovedAt', 'hasSeenProductTour')
    `;
    
    console.log('Beta fields in User table:', userFields);

    // Check if knowledge_chunks table exists
    const knowledgeTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'knowledge_chunks'
      ) as exists
    `;
    
    console.log('Knowledge chunks table exists:', knowledgeTable);

    // Check if vector extension exists
    const vectorExt = await prisma.$queryRaw`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `;
    
    console.log('Vector extension:', vectorExt);

    // Try to run beta migration
    console.log('\n🚀 Running Beta Program migration...');
    
    // Step 1: Create enum type
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
          CREATE TYPE "BetaStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NONE');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✓ BetaStatus enum created');

    // Step 2: Add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "betaStatus" "BetaStatus" NOT NULL DEFAULT 'NONE',
      ADD COLUMN IF NOT EXISTS "betaAppliedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "betaApprovedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "hasSeenProductTour" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('  ✓ Beta columns added');

    // Step 3: Create index
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "User_betaStatus_idx" ON "User"("betaStatus");`);
    console.log('  ✓ Beta index created');
    console.log('✅ Beta migration completed');

    // Step 4: Enable vector extension
    console.log('\n🚀 Checking vector extension...');
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
      console.log('✅ Vector extension enabled');
    } catch (error: any) {
      if (error.code === 'P2010' && error.meta?.message?.includes('extension "vector" is not available')) {
        console.log('⚠️  Vector extension must be enabled in Supabase Dashboard:');
        console.log('   1. Go to Database → Extensions');
        console.log('   2. Search for "pgvector"');
        console.log('   3. Enable it');
        console.log('   4. Then run: yarn prisma db push');
      } else {
        throw error;
      }
    }

    console.log('\n✨ All migrations completed successfully!');
    
    // Now check Sanna after migrations
    console.log('\n🔍 Checking Sanna\'s credentials...');
    const sanna = await prisma.user.findUnique({
      where: { email: 'sanna@archclinic.se' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        betaStatus: true,
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (sanna) {
      console.log('✅ Sanna found:', JSON.stringify(sanna, null, 2));
      console.log('\n📧 Email: sanna@archclinic.se');
      console.log('🔑 Password: arch2024beta');
      console.log('🏢 Clinic ID:', sanna.clinic?.id || 'NOT SET');
      
      if (sanna.clinic?.id) {
        console.log('\n📋 Next steps:');
        console.log(`1. Login as Sanna: sanna@archclinic.se / arch2024beta`);
        console.log(`2. Run: cd /home/ubuntu/flow/nextjs_space && CLINIC_ID="${sanna.clinic.id}" yarn tsx scripts/load-knowledge-base.ts`);
      }
    } else {
      console.log('❌ Sanna not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();
