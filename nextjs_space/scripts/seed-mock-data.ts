
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

async function seedMockData() {
  console.log('🌱 Seeding mock data for ArchClinic...\n');

  try {
    // Create ArchClinic (superadmin's test clinic)
    console.log('Creating clinic...');
    const clinic = await prisma.clinic.upsert({
      where: { bokadirektId: 'archclinic-001' },
      update: {},
      create: {
        bokadirektId: 'archclinic-001',
        name: 'ArchClinic',
        description: 'Test clinic for Flow development',
        address: 'Storgatan 1, Stockholm',
        phone: '+46 70 123 45 67',
        email: 'info@archclinic.se',
        website: 'https://archclinic.se',
        isActive: true,
      },
    });
    console.log(`✅ Clinic created: ${clinic.name}\n`);

    // Create Staff Members
    console.log('Creating staff members...');
    const staff = await Promise.all([
      prisma.staff.upsert({
        where: { bokadirektId: 'staff-001' },
        update: {},
        create: {
          bokadirektId: 'staff-001',
          clinicId: clinic.id,
          name: 'Anna Andersson',
          email: 'anna@archclinic.se',
          phone: '+46 70 111 11 11',
          role: 'Hudterapeut',
          isActive: true,
        },
      }),
      prisma.staff.upsert({
        where: { bokadirektId: 'staff-002' },
        update: {},
        create: {
          bokadirektId: 'staff-002',
          clinicId: clinic.id,
          name: 'Emma Eriksson',
          email: 'emma@archclinic.se',
          phone: '+46 70 222 22 22',
          role: 'Massageterapeut',
          isActive: true,
        },
      }),
      prisma.staff.upsert({
        where: { bokadirektId: 'staff-003' },
        update: {},
        create: {
          bokadirektId: 'staff-003',
          clinicId: clinic.id,
          name: 'Lisa Larsson',
          email: 'lisa@archclinic.se',
          phone: '+46 70 333 33 33',
          role: 'Nagelterapeut',
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${staff.length} staff members\n`);

    // Create Services
    console.log('Creating services...');
    const services = await Promise.all([
      prisma.service.upsert({
        where: { bokadirektId: 'service-001' },
        update: {},
        create: {
          bokadirektId: 'service-001',
          clinicId: clinic.id,
          name: 'Ansiktsbehandling',
          description: 'Komplett ansiktsbehandling med rengöring och mask',
          duration: 60,
          price: 795,
          category: 'Hudvård',
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { bokadirektId: 'service-002' },
        update: {},
        create: {
          bokadirektId: 'service-002',
          clinicId: clinic.id,
          name: 'Klassisk massage 60 min',
          description: 'Avslappnande helkroppsmassage',
          duration: 60,
          price: 695,
          category: 'Massage',
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { bokadirektId: 'service-003' },
        update: {},
        create: {
          bokadirektId: 'service-003',
          clinicId: clinic.id,
          name: 'Manikyr med gellack',
          description: 'Komplett manikyr med gellack',
          duration: 75,
          price: 495,
          category: 'Nagelvård',
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { bokadirektId: 'service-004' },
        update: {},
        create: {
          bokadirektId: 'service-004',
          clinicId: clinic.id,
          name: 'Kemisk peeling',
          description: 'Kemisk peeling för bättre hudstruktur',
          duration: 45,
          price: 1295,
          category: 'Hudvård',
          isActive: true,
        },
      }),
      prisma.service.upsert({
        where: { bokadirektId: 'service-005' },
        update: {},
        create: {
          bokadirektId: 'service-005',
          clinicId: clinic.id,
          name: 'Ryggmassage 30 min',
          description: 'Fokuserad ryggmassage',
          duration: 30,
          price: 395,
          category: 'Massage',
          isActive: true,
        },
      }),
    ]);
    console.log(`✅ Created ${services.length} services\n`);

    // Create Customers
    console.log('Creating customers...');
    const customers = await Promise.all([
      prisma.customer.upsert({
        where: { bokadirektId: 'customer-001' },
        update: {},
        create: {
          bokadirektId: 'customer-001',
          clinicId: clinic.id,
          firstName: 'Maria',
          lastName: 'Svensson',
          email: 'maria.svensson@email.se',
          phone: '+46 70 444 44 44',
        },
      }),
      prisma.customer.upsert({
        where: { bokadirektId: 'customer-002' },
        update: {},
        create: {
          bokadirektId: 'customer-002',
          clinicId: clinic.id,
          firstName: 'Johan',
          lastName: 'Johansson',
          email: 'johan.j@email.se',
          phone: '+46 70 555 55 55',
        },
      }),
      prisma.customer.upsert({
        where: { bokadirektId: 'customer-003' },
        update: {},
        create: {
          bokadirektId: 'customer-003',
          clinicId: clinic.id,
          firstName: 'Sara',
          lastName: 'Karlsson',
          email: 'sara.k@email.se',
          phone: '+46 70 666 66 66',
        },
      }),
      prisma.customer.upsert({
        where: { bokadirektId: 'customer-004' },
        update: {},
        create: {
          bokadirektId: 'customer-004',
          clinicId: clinic.id,
          firstName: 'Peter',
          lastName: 'Nilsson',
          email: 'peter.n@email.se',
          phone: '+46 70 777 77 77',
        },
      }),
      prisma.customer.upsert({
        where: { bokadirektId: 'customer-005' },
        update: {},
        create: {
          bokadirektId: 'customer-005',
          clinicId: clinic.id,
          firstName: 'Karin',
          lastName: 'Berg',
          email: 'karin.berg@email.se',
          phone: '+46 70 888 88 88',
        },
      }),
    ]);
    console.log(`✅ Created ${customers.length} customers\n`);

    // Create Bookings (realistic data for the past 30 days)
    console.log('Creating bookings...');
    const now = new Date();
    const bookings = [];

    // Generate bookings for the last 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // 3-6 bookings per day
      const bookingsPerDay = Math.floor(Math.random() * 4) + 3;
      
      for (let i = 0; i < bookingsPerDay; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const staffMember = staff[Math.floor(Math.random() * staff.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        
        const startHour = 9 + Math.floor(Math.random() * 8); // 9-17
        const startDate = new Date(date);
        startDate.setHours(startHour, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + service.duration);
        
        const cancelled = Math.random() < 0.1; // 10% cancellation rate
        const noShow = !cancelled && Math.random() < 0.05; // 5% no-show rate
        
        bookings.push(
          prisma.booking.create({
            data: {
              bokadirektId: `booking-${dayOffset}-${i}`,
              clinicId: clinic.id,
              customerId: customer.id,
              serviceId: service.id,
              staffId: staffMember.id,
              scheduledTime: startDate,
              startTime: startDate,
              endTime: endDate,
              duration: service.duration,
              price: service.price,
              status: cancelled ? 'cancelled' : noShow ? 'no_show' : 'completed',
              isOnlineBooking: Math.random() < 0.7, // 70% online bookings
              notes: null,
            },
          })
        );
      }
    }

    await Promise.all(bookings);
    console.log(`✅ Created ${bookings.length} bookings\n`);

    // Summary
    console.log('📊 Mock Data Summary:');
    console.log(`   Clinic: ${clinic.name}`);
    console.log(`   Staff: ${staff.length}`);
    console.log(`   Services: ${services.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log('\n✅ Mock data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMockData();
