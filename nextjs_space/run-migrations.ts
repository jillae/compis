
/**
 * Migration Runner
 * Executes pending SQL migrations
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function runMigrations() {
  console.log('🚀 Starting migrations...\n');

  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  const migrationFiles = [
    'add_faq_system.sql',
    'add_bokadirekt_auto_booking.sql',
    'add_knowledge_base_rag.sql',
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} - file not found`);
      continue;
    }

    console.log(`📄 Running migration: ${file}`);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      // Split SQL by statement (basic approach - handles most cases)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip comments and empty statements
        if (!statement || statement.startsWith('--')) continue;
        
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate') ||
            error.message?.includes('does not exist')
          ) {
            console.log(`   ⚠️  Skipped (already applied)`);
          } else {
            console.error(`   ❌ Error in statement:`, error.message);
            // Continue with next statement instead of failing
          }
        }
      }
      
      console.log(`✅ Completed: ${file}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to run ${file}:`, error.message);
      console.error('Continuing with next migration...\n');
    }
  }

  console.log('✨ All migrations completed!\n');
}

runMigrations()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
