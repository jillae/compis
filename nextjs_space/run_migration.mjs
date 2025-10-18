
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/20251018_add_stt_providers/migration.sql'),
      'utf8'
    );

    console.log('Running STT providers migration...');
    await client.query(migrationSQL);
    console.log('✓ Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ Migration may have been already applied');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
