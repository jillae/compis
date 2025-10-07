// CRITICAL: Load .env FIRST before any imports
import * as dotenv from 'dotenv';
import { resolve } from 'path';
const envPath = resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Now import after env is loaded
import { PrismaClient } from '@prisma/client';
import { syncAll } from './lib/bokadirekt/sync-service';

const prisma = new PrismaClient();

async function runFullSync() {
  console.log('🎸 ROCK N ROLL BABY! Starting full sync...\n');
  
  try {
    console.log('🔄 Running full sync of all Bokadirekt data...\n');
    const results = await syncAll();
    
    console.log('\n✅ FULL SYNC COMPLETE!\n');
    
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
      take: 5,
      orderBy: { startTime: 'desc' },
      include: {
        customer: true,
        service: true,
        staff: true
      }
    });
    
    console.log('📅 Recent Bookings:');
    recentBookings.forEach((booking, i) => {
      const date = booking.startTime ? booking.startTime.toLocaleDateString() : 'No date';
      console.log(`   ${i + 1}. ${booking.customer?.name || 'Unknown'} - ${booking.service?.name || 'Unknown'} (${date})`);
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runFullSync().then(() => {
  console.log('\n🎉 All done! Database is synced and ready to rock!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
