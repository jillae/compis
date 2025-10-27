
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runReferralMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    console.log('🔄 Running referral program migration...\n');
    
    const sqlFile = path.join(__dirname, 'prisma/migrations/add_referral_program.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📝 Executing referral migration SQL...\n');
    
    // Execute entire SQL file
    await client.query(sql);
    
    console.log('✅ Referral migration completed successfully!\n');
    
    // Verify
    const userFieldsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('referralCode', 'referredById')
      ORDER BY ordinal_position;
    `);
    
    const subscriptionFieldResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Subscription' 
      AND column_name = 'freeMonthsRemaining'
      ORDER BY ordinal_position;
    `);
    
    const referralTableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_name = 'Referral';
    `);
    
    console.log('📊 Verification - User fields:');
    console.table(userFieldsResult.rows);
    
    console.log('\n📊 Verification - Subscription field:');
    console.table(subscriptionFieldResult.rows);
    
    console.log('\n📊 Verification - Referral table:');
    console.table(referralTableResult.rows);
    
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runReferralMigration();
