// CRITICAL: Load .env FIRST before any imports
import * as dotenv from 'dotenv';
import { resolve } from 'path';
const envPath = resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Now import after env is loaded
import { PrismaClient } from '@prisma/client';
import { syncBookings, syncCustomers, syncStaff, syncServices } from './lib/bokadirekt/sync-service';

const prisma = new PrismaClient();

// Split date range into 365-day chunks
function getDateChunks(startDate: Date, endDate: Date): Array<{ start: Date; end: Date }> {
  const chunks: Array<{ start: Date; end: Date }> = [];
  const DAYS_PER_CHUNK = 365;
  
  let currentStart = new Date(startDate);
  
  while (currentStart < endDate) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + DAYS_PER_CHUNK);
    
    // Don't go past the end date
    if (currentEnd > endDate) {
      currentEnd.setTime(endDate.getTime());
    }
    
    chunks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });
    
    // Move to next chunk
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1); // Skip one day to avoid overlap
  }
  
  return chunks;
}

async function runFullSync() {
  console.log('🎸 ROCK N ROLL! Full historical sync with chunking...\n');
  
  try {
    // Clear existing data to avoid duplicates
    console.log('🗑️  Clearing old mock data...');
    await prisma.booking.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.service.deleteMany({});
    await prisma.staff.deleteMany({});
    console.log('✅ Old data cleared\n');
    
    // Sync all data without date restrictions
    console.log('🔄 Step 1: Syncing customers...');
    const customersResult = await syncCustomers();
    console.log(`✅ ${customersResult.recordsUpserted} customers synced\n`);
    
    console.log('🔄 Step 2: Syncing services...');
    const servicesResult = await syncServices();
    console.log(`✅ ${servicesResult.recordsUpserted} services synced\n`);
    
    console.log('🔄 Step 3: Syncing staff...');
    const staffResult = await syncStaff();
    console.log(`✅ ${staffResult.recordsUpserted} staff synced\n`);
    
    // Sync bookings in chunks
    console.log('🔄 Step 4: Syncing ALL bookings in 365-day chunks...');
    const startDate = new Date('2023-01-01'); // Last 2 years
    const endDate = new Date();
    
    const chunks = getDateChunks(startDate, endDate);
    console.log(`   Will fetch ${chunks.length} chunks from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\n`);
    
    let totalBookings = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   📦 Chunk ${i + 1}/${chunks.length}: ${chunk.start.toLocaleDateString()} → ${chunk.end.toLocaleDateString()}`);
      
      const result = await syncBookings({
        startDate: chunk.start,
        endDate: chunk.end,
        filterOnStartDate: false
      });
      
      totalBookings += result.recordsUpserted;
      console.log(`      ✅ ${result.recordsUpserted} bookings synced`);
    }
    
    console.log(`\n✅ Total bookings synced: ${totalBookings}\n`);
    
    console.log('\n🎉 FULL HISTORICAL SYNC COMPLETE!\n');
    
    // Show stats
    const stats = {
      clinics: await prisma.clinic.count(),
      services: await prisma.service.count(),
      staff: await prisma.staff.count(),
      customers: await prisma.customer.count(),
      bookings: await prisma.booking.count()
    };
    
    console.log('📊 Database Stats:');
    console.log(`   Clinics:   ${stats.clinics}`);
    console.log(`   Services:  ${stats.services}`);
    console.log(`   Staff:     ${stats.staff}`);
    console.log(`   Customers: ${stats.customers}`);
    console.log(`   Bookings:  ${stats.bookings}`);
    console.log('');
    
    // Show recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: { startTime: 'desc' },
      include: {
        customer: true,
        service: true,
        staff: true
      }
    });
    
    console.log('📅 Most Recent Bookings:');
    recentBookings.forEach((booking, i) => {
      const date = booking.startTime ? booking.startTime.toLocaleDateString() : 'No date';
      const time = booking.startTime ? booking.startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '';
      console.log(`   ${i + 1}. ${booking.customer?.name || 'Unknown'} - ${booking.service?.name || 'Unknown'} (${date} ${time})`);
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runFullSync().then(() => {
  console.log('\n🚀 Database is fully synced with Bokadirekt! Ready to rock!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
