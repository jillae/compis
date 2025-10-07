
import { config } from 'dotenv';
import { BokadirektClient } from '../lib/bokadirekt/client';

// Load environment variables
config();

async function testBokadirektIntegration() {
  console.log('🔍 Testing Bokadirekt Integration with ArchClinic...\n');

  const apiKey = process.env.BOKADIREKT_API_KEY;
  if (!apiKey) {
    console.error('❌ BOKADIREKT_API_KEY not found in environment');
    process.exit(1);
  }

  const client = new BokadirektClient(apiKey);

  try {
    // Test 1: Fetch Services
    console.log('📋 Test 1: Fetching Services...');
    const services = await client.getServices();
    console.log(`✅ Found ${services.length} services`);
    if (services.length > 0) {
      console.log('   Sample service:', {
        id: services[0].Id,
        name: services[0].Name,
        price: services[0].Price
      });
    }
    console.log('');

    // Test 2: Fetch Staff
    console.log('👥 Test 2: Fetching Staff...');
    const staff = await client.getStaff();
    console.log(`✅ Found ${staff.length} staff members`);
    if (staff.length > 0) {
      console.log('   Sample staff:', {
        id: staff[0].Id,
        name: staff[0].Name,
        email: staff[0].Email
      });
    }
    console.log('');

    // Test 3: Fetch Customers
    console.log('👤 Test 3: Fetching Customers...');
    const customers = await client.getCustomers();
    console.log(`✅ Found ${customers.length} customers`);
    if (customers.length > 0) {
      console.log('   Sample customer:', {
        id: customers[0].Id,
        name: `${customers[0].FirstName} ${customers[0].LastName}`,
        email: customers[0].Email
      });
    }
    console.log('');

    // Test 4: Fetch Bookings (last 7 days)
    console.log('📅 Test 4: Fetching Bookings (last 7 days)...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const bookings = await client.getBookings(startDate, endDate);
    console.log(`✅ Found ${bookings.length} bookings in the last 7 days`);
    if (bookings.length > 0) {
      console.log('   Sample booking:', {
        id: bookings[0].Id,
        date: bookings[0].BookingDate,
        service: bookings[0].ServiceName,
        status: bookings[0].BookingStatusName
      });
    }
    console.log('');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Services: ${services.length}`);
    console.log(`   Staff: ${staff.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Bookings (7d): ${bookings.length}`);
    console.log('');
    console.log('✅ All tests passed! Bokadirekt integration is working.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testBokadirektIntegration();
