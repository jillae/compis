
/**
 * Seed Mock Clinics for SuperAdmin Testing
 * Creates 3 realistic clinics with customers, bookings, and staff
 */

import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus, BookingStatus, StaffEmploymentType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedMockClinics() {
  console.log('🌱 Starting mock clinic seeding...\n');

  try {
    // Mock Clinic 1: Premium Beauty Spa (Stockholm)
    console.log('📍 Creating Premium Beauty Spa (Stockholm)...');
    const clinic1 = await prisma.clinic.upsert({
      where: { id: 'mock-clinic-premium-001' },
      update: {},
      create: {
        id: 'mock-clinic-premium-001',
        name: 'Premium Beauty Spa Stockholm',
        tier: SubscriptionTier.PROFESSIONAL,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        bokadirektApiKey: 'mock_bokadirekt_key_001',
        isActive: true,
        address: 'Storgatan 15, 114 55 Stockholm',
        phone: '+46701234567',
        email: 'info@premiumbeauty.se',
        website: 'https://premiumbeauty.se',
        subscriptionStartsAt: new Date('2024-01-01'),
      },
    });

    // Admin user for Clinic 1
    const hashedPassword1 = await bcrypt.hash('Premium2024!', 10);
    const admin1 = await prisma.user.upsert({
      where: { email: 'admin@premiumbeauty.se' },
      update: {},
      create: {
        email: 'admin@premiumbeauty.se',
        name: 'Emma Andersson',
        password: hashedPassword1,
        role: UserRole.ADMIN,
        clinicId: clinic1.id,
      },
    });

    // Staff for Clinic 1
    const staff1 = await prisma.staff.createMany({
      data: [
        {
          id: 'mock-staff-001',
          clinicId: clinic1.id,
          name: 'Sofia Larsson',
          role: 'Therapist',
          employmentType: StaffEmploymentType.FULLTIME,
          email: 'sofia@premiumbeauty.se',
          phone: '+46701234568',
          isActive: true,
        },
        {
          id: 'mock-staff-002',
          clinicId: clinic1.id,
          name: 'Anna Johansson',
          role: 'Therapist',
          employmentType: StaffEmploymentType.FULLTIME,
          email: 'anna@premiumbeauty.se',
          phone: '+46701234569',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Services for Clinic 1
    const services1 = await prisma.service.createMany({
      data: [
        {
          id: 'mock-service-001',
          clinicId: clinic1.id,
          name: 'Ansiktsbehandling Premium',
          description: 'Lyxig ansiktsbehandling med naturliga produkter',
          duration: 60,
          price: 899,
          category: 'Ansiktsbehandling',
          isActive: true,
        },
        {
          id: 'mock-service-002',
          clinicId: clinic1.id,
          name: 'Massage 90 min',
          description: 'Avslappnande helkroppsmassage',
          duration: 90,
          price: 1299,
          category: 'Massage',
          isActive: true,
        },
        {
          id: 'mock-service-003',
          clinicId: clinic1.id,
          name: 'Manikyr & Pedikyr',
          description: 'Komplett hand- och fotvård',
          duration: 120,
          price: 799,
          category: 'Nagelvård',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Customers for Clinic 1 (50 customers)
    console.log('👥 Creating customers for Premium Beauty Spa...');
    const customers1 = [];
    for (let i = 1; i <= 50; i++) {
      const customer = await prisma.customer.create({
        data: {
          clinicId: clinic1.id,
          name: `Kund ${i} Premium`,
          email: `kund${i}@premiumtest.se`,
          phone: `+4670${1000000 + i}`,
          totalVisits: Math.floor(Math.random() * 20) + 1,
          totalSpent: Math.floor(Math.random() * 50000) + 1000,
          lifetimeValue: Math.floor(Math.random() * 50000) + 1000,
          healthScore: Math.floor(Math.random() * 100),
          healthStatus: ['EXCELLENT', 'HEALTHY', 'AT_RISK', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
          lastVisitAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          consentMarketing: true,
          consentSms: true,
          consentEmail: true,
        },
      });
      customers1.push(customer);
    }

    // Bookings for Clinic 1 (100 bookings)
    console.log('📅 Creating bookings for Premium Beauty Spa...');
    for (let i = 0; i < 100; i++) {
      const customer = customers1[Math.floor(Math.random() * customers1.length)];
      const serviceId = ['mock-service-001', 'mock-service-002', 'mock-service-003'][Math.floor(Math.random() * 3)];
      const staffId = ['mock-staff-001', 'mock-staff-002'][Math.floor(Math.random() * 2)];
      
      await prisma.booking.create({
        data: {
          clinicId: clinic1.id,
          customerId: customer.id,
          serviceId: serviceId,
          staffId: staffId,
          startTime: new Date(Date.now() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          status: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'][Math.floor(Math.random() * 4)] as any,
          price: Math.floor(Math.random() * 1000) + 500,
          notes: 'Mock booking',
        },
      });
    }

    console.log('✅ Premium Beauty Spa created!\n');

    // Mock Clinic 2: Budget Fitness & Spa (Göteborg)
    console.log('📍 Creating Budget Fitness & Spa (Göteborg)...');
    const clinic2 = await prisma.clinic.upsert({
      where: { id: 'mock-clinic-budget-002' },
      update: {},
      create: {
        id: 'mock-clinic-budget-002',
        name: 'Budget Fitness & Spa Göteborg',
        tier: SubscriptionTier.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        bokadirektApiKey: 'mock_bokadirekt_key_002',
        isActive: true,
        address: 'Avenyn 42, 411 38 Göteborg',
        phone: '+46317654321',
        email: 'info@budgetfitness.se',
        website: 'https://budgetfitness.se',
        subscriptionStartsAt: new Date('2024-06-01'),
      },
    });

    const hashedPassword2 = await bcrypt.hash('Budget2024!', 10);
    const admin2 = await prisma.user.upsert({
      where: { email: 'admin@budgetfitness.se' },
      update: {},
      create: {
        email: 'admin@budgetfitness.se',
        name: 'Johan Svensson',
        password: hashedPassword2,
        role: UserRole.ADMIN,
        clinicId: clinic2.id,
      },
    });

    // Staff for Clinic 2
    await prisma.staff.createMany({
      data: [
        {
          id: 'mock-staff-003',
          clinicId: clinic2.id,
          name: 'Linda Berg',
          role: 'Therapist',
          employmentType: StaffEmploymentType.FULLTIME,
          email: 'linda@budgetfitness.se',
          phone: '+46317654322',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Services for Clinic 2
    await prisma.service.createMany({
      data: [
        {
          id: 'mock-service-004',
          clinicId: clinic2.id,
          name: 'Basic Massage 60 min',
          description: 'Avslappnande massage',
          duration: 60,
          price: 499,
          category: 'Massage',
          isActive: true,
        },
        {
          id: 'mock-service-005',
          clinicId: clinic2.id,
          name: 'PT-session',
          description: 'Personlig träning',
          duration: 45,
          price: 399,
          category: 'Träning',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Customers for Clinic 2 (30 customers)
    console.log('👥 Creating customers for Budget Fitness & Spa...');
    const customers2 = [];
    for (let i = 1; i <= 30; i++) {
      const customer = await prisma.customer.create({
        data: {
          clinicId: clinic2.id,
          name: `Kund ${i} Budget`,
          email: `kund${i}@budgettest.se`,
          phone: `+4631${7000000 + i}`,
          totalVisits: Math.floor(Math.random() * 15) + 1,
          totalSpent: Math.floor(Math.random() * 20000) + 500,
          lifetimeValue: Math.floor(Math.random() * 20000) + 500,
          healthScore: Math.floor(Math.random() * 100),
          healthStatus: ['EXCELLENT', 'HEALTHY', 'AT_RISK', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
          lastVisitAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          consentMarketing: true,
          consentSms: true,
          consentEmail: true,
        },
      });
      customers2.push(customer);
    }

    // Bookings for Clinic 2 (50 bookings)
    console.log('📅 Creating bookings for Budget Fitness & Spa...');
    for (let i = 0; i < 50; i++) {
      const customer = customers2[Math.floor(Math.random() * customers2.length)];
      const serviceId = ['mock-service-004', 'mock-service-005'][Math.floor(Math.random() * 2)];
      
      await prisma.booking.create({
        data: {
          clinicId: clinic2.id,
          customerId: customer.id,
          serviceId: serviceId,
          staffId: 'mock-staff-003',
          startTime: new Date(Date.now() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + (Math.random() * 60 - 30) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          status: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'][Math.floor(Math.random() * 4)] as any,
          price: Math.floor(Math.random() * 500) + 300,
          notes: 'Mock booking',
        },
      });
    }

    console.log('✅ Budget Fitness & Spa created!\n');

    // Mock Clinic 3: Trial Wellness Center (Malmö)
    console.log('📍 Creating Trial Wellness Center (Malmö)...');
    const clinic3 = await prisma.clinic.upsert({
      where: { id: 'mock-clinic-trial-003' },
      update: {},
      create: {
        id: 'mock-clinic-trial-003',
        name: 'Trial Wellness Center Malmö',
        tier: SubscriptionTier.BASIC,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        bokadirektApiKey: 'mock_bokadirekt_key_003',
        isActive: true,
        address: 'Västra Hamnen 8, 211 20 Malmö',
        phone: '+46407890123',
        email: 'info@trialwellness.se',
        website: 'https://trialwellness.se',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });

    const hashedPassword3 = await bcrypt.hash('Trial2024!', 10);
    const admin3 = await prisma.user.upsert({
      where: { email: 'admin@trialwellness.se' },
      update: {},
      create: {
        email: 'admin@trialwellness.se',
        name: 'Maria Nilsson',
        password: hashedPassword3,
        role: UserRole.ADMIN,
        clinicId: clinic3.id,
      },
    });

    // Staff for Clinic 3
    await prisma.staff.createMany({
      data: [
        {
          id: 'mock-staff-004',
          clinicId: clinic3.id,
          name: 'Petra Karlsson',
          role: 'Therapist',
          employmentType: StaffEmploymentType.FULLTIME,
          email: 'petra@trialwellness.se',
          phone: '+46407890124',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Services for Clinic 3
    await prisma.service.createMany({
      data: [
        {
          id: 'mock-service-006',
          clinicId: clinic3.id,
          name: 'Yoga Session',
          description: 'Gruppyoga',
          duration: 60,
          price: 299,
          category: 'Yoga',
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Customers for Clinic 3 (10 customers - small trial clinic)
    console.log('👥 Creating customers for Trial Wellness Center...');
    const customers3 = [];
    for (let i = 1; i <= 10; i++) {
      const customer = await prisma.customer.create({
        data: {
          clinicId: clinic3.id,
          name: `Kund ${i} Trial`,
          email: `kund${i}@trialtest.se`,
          phone: `+4640${8000000 + i}`,
          totalVisits: Math.floor(Math.random() * 5) + 1,
          totalSpent: Math.floor(Math.random() * 5000) + 100,
          lifetimeValue: Math.floor(Math.random() * 5000) + 100,
          healthScore: Math.floor(Math.random() * 100),
          healthStatus: ['EXCELLENT', 'HEALTHY', 'AT_RISK', 'CRITICAL'][Math.floor(Math.random() * 4)] as any,
          lastVisitAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          consentMarketing: true,
          consentSms: true,
          consentEmail: true,
        },
      });
      customers3.push(customer);
    }

    // Bookings for Clinic 3 (20 bookings)
    console.log('📅 Creating bookings for Trial Wellness Center...');
    for (let i = 0; i < 20; i++) {
      const customer = customers3[Math.floor(Math.random() * customers3.length)];
      
      await prisma.booking.create({
        data: {
          clinicId: clinic3.id,
          customerId: customer.id,
          serviceId: 'mock-service-006',
          staffId: 'mock-staff-004',
          startTime: new Date(Date.now() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          status: ['CONFIRMED', 'COMPLETED', 'CANCELLED'][Math.floor(Math.random() * 3)] as any,
          price: 299,
          notes: 'Mock booking',
        },
      });
    }

    console.log('✅ Trial Wellness Center created!\n');

    console.log('🎉 Mock clinic seeding complete!\n');
    console.log('📊 Summary:');
    console.log('  - 3 clinics created');
    console.log('  - 3 admin users created');
    console.log('  - 4 staff members created');
    console.log('  - 6 services created');
    console.log('  - 90 customers created');
    console.log('  - 170 bookings created\n');
    console.log('🔐 Login Credentials:');
    console.log('  1. Premium Beauty Spa:');
    console.log('     Email: admin@premiumbeauty.se');
    console.log('     Password: Premium2024!');
    console.log('  2. Budget Fitness & Spa:');
    console.log('     Email: admin@budgetfitness.se');
    console.log('     Password: Budget2024!');
    console.log('  3. Trial Wellness Center:');
    console.log('     Email: admin@trialwellness.se');
    console.log('     Password: Trial2024!\n');

  } catch (error) {
    console.error('❌ Error seeding mock clinics:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedMockClinics()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
