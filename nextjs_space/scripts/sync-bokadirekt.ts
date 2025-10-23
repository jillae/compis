
/**
 * Standalone Bokadirekt Sync Script
 * 
 * This script provides a CLI interface for syncing all Bokadirekt data:
 * - Bookings (occupancy statistics)
 * - Sales (revenue/financial data)
 * - Customers
 * - Staff
 * - Services
 * - Staff Availabilities
 * 
 * Usage:
 *   yarn tsx scripts/sync-bokadirekt.ts
 *   node scripts/sync-bokadirekt.ts
 * 
 * Cron example (daily at 02:00):
 *   0 2 * * * cd /path/to/project/nextjs_space && yarn tsx scripts/sync-bokadirekt.ts >> /var/log/bokadirekt-sync.log 2>&1
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
config({ path: resolve(__dirname, '../.env') });

import { syncAll } from '@/lib/bokadirekt/sync-service';

// Terminal colors for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatNumber(num: number): string {
  return num.toLocaleString('sv-SE');
}

async function main() {
  const scriptStart = Date.now();
  
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║        Bokadirekt Full Sync - Atomär Synkronisering       ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝\n', 'bright');
  
  log(`📅 Started at: ${new Date().toLocaleString('sv-SE')}`, 'cyan');
  log('🔄 Syncing ALL data sources in one atomic operation...\n', 'cyan');

  try {
    // Execute the full sync
    const result = await syncAll();

    const scriptDuration = Date.now() - scriptStart;

    // Display results
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║                      SYNC RESULTS                          ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

    // Bookings (Occupancy Statistics)
    log('📅 BOOKINGS (Beläggningsstatistik):', 'blue');
    log(`   • Fetched: ${formatNumber(result.bookings.recordsFetched)}`, 'dim');
    log(`   • Upserted: ${formatNumber(result.bookings.recordsUpserted)}`, 'dim');
    log(`   • Duration: ${formatDuration(result.bookings.duration)}`, 'dim');
    if (result.bookings.errors.length > 0) {
      log(`   • Errors: ${result.bookings.errors.length}`, 'red');
    }

    // Sales (Revenue/Financial Data)
    log('\n💰 SALES (Intäktsredovisning):', 'green');
    log(`   • Fetched: ${formatNumber(result.sales.recordsFetched)}`, 'dim');
    log(`   • Upserted: ${formatNumber(result.sales.recordsUpserted)}`, 'dim');
    log(`   • Duration: ${formatDuration(result.sales.duration)}`, 'dim');
    if (result.sales.errors.length > 0) {
      log(`   • Errors: ${result.sales.errors.length}`, 'red');
    }

    // Customers
    log('\n👥 CUSTOMERS:', 'magenta');
    log(`   • Fetched: ${formatNumber(result.customers.recordsFetched)}`, 'dim');
    log(`   • Upserted: ${formatNumber(result.customers.recordsUpserted)}`, 'dim');
    log(`   • Duration: ${formatDuration(result.customers.duration)}`, 'dim');
    if (result.customers.errors.length > 0) {
      log(`   • Errors: ${result.customers.errors.length}`, 'red');
    }

    // Staff
    log('\n👨‍⚕️ STAFF:', 'cyan');
    log(`   • Fetched: ${formatNumber(result.staff.recordsFetched)}`, 'dim');
    log(`   • Upserted: ${formatNumber(result.staff.recordsUpserted)}`, 'dim');
    log(`   • Duration: ${formatDuration(result.staff.duration)}`, 'dim');
    if (result.staff.errors.length > 0) {
      log(`   • Errors: ${result.staff.errors.length}`, 'red');
    }

    // Services
    log('\n🔧 SERVICES:', 'yellow');
    log(`   • Fetched: ${formatNumber(result.services.recordsFetched)}`, 'dim');
    log(`   • Upserted: ${formatNumber(result.services.recordsUpserted)}`, 'dim');
    log(`   • Duration: ${formatDuration(result.services.duration)}`, 'dim');
    if (result.services.errors.length > 0) {
      log(`   • Errors: ${result.services.errors.length}`, 'red');
    }

    // Staff Availabilities (if synced)
    if (result.staffAvailabilities) {
      log('\n📋 STAFF AVAILABILITIES:', 'blue');
      log(`   • Fetched: ${formatNumber(result.staffAvailabilities.recordsFetched)}`, 'dim');
      log(`   • Upserted: ${formatNumber(result.staffAvailabilities.recordsUpserted)}`, 'dim');
      log(`   • Duration: ${formatDuration(result.staffAvailabilities.duration)}`, 'dim');
      if (result.staffAvailabilities.errors.length > 0) {
        log(`   • Errors: ${result.staffAvailabilities.errors.length}`, 'red');
      }
    }

    // Overall Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║                    OVERALL SUMMARY                         ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');

    const totalRecordsFetched = 
      result.bookings.recordsFetched +
      result.sales.recordsFetched +
      result.customers.recordsFetched +
      result.staff.recordsFetched +
      result.services.recordsFetched +
      (result.staffAvailabilities?.recordsFetched || 0);

    const totalRecordsUpserted = 
      result.bookings.recordsUpserted +
      result.sales.recordsUpserted +
      result.customers.recordsUpserted +
      result.staff.recordsUpserted +
      result.services.recordsUpserted +
      (result.staffAvailabilities?.recordsUpserted || 0);

    const totalErrors = result.overall.errors.length;

    log(`📊 Total Records Fetched: ${formatNumber(totalRecordsFetched)}`, 'bright');
    log(`✅ Total Records Upserted: ${formatNumber(totalRecordsUpserted)}`, 'bright');
    log(`⏱️  Total Duration: ${formatDuration(scriptDuration)}`, 'bright');
    log(`🎯 Success: ${result.overall.success ? 'YES' : 'NO'}`, result.overall.success ? 'green' : 'red');

    if (totalErrors > 0) {
      log(`\n⚠️  Total Errors: ${totalErrors}`, 'red');
      result.overall.errors.forEach((error, index) => {
        log(`   ${index + 1}. ${error}`, 'red');
      });
    }

    log(`\n📅 Completed at: ${new Date().toLocaleString('sv-SE')}`, 'cyan');
    
    if (result.overall.success) {
      log('\n✅ Sync completed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Sync completed with errors!', 'red');
      process.exit(1);
    }

  } catch (error) {
    const scriptDuration = Date.now() - scriptStart;
    
    log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
    log('║                        ERROR                               ║', 'bright');
    log('╚════════════════════════════════════════════════════════════╝\n', 'bright');
    
    log('❌ Sync failed with fatal error:', 'red');
    
    if (error instanceof Error) {
      log(`\n${error.message}`, 'red');
      if (error.stack) {
        log('\nStack trace:', 'dim');
        log(error.stack, 'dim');
      }
    } else {
      log(`\n${String(error)}`, 'red');
    }
    
    log(`\n⏱️  Duration before failure: ${formatDuration(scriptDuration)}`, 'yellow');
    log(`📅 Failed at: ${new Date().toLocaleString('sv-SE')}`, 'cyan');
    
    process.exit(1);
  }
}

// Execute the script
main();
