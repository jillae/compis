
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runBetaMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('🔄 Running beta program migration...\n');
    
    const sqlFile = path.join(__dirname, 'prisma/migrations/add_beta_program_fields.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Executing beta migration SQL...\n');
    
    // Execute entire SQL file
    await client.query(sql);
    
    console.log('✅ Beta migration completed successfully!\n');
    
    // Verify
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('betaStatus', 'betaAppliedAt', 'betaApprovedAt', 'hasSeenProductTour')
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Verification results:');
    console.table(result.rows);
    
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runBetaMigration();
