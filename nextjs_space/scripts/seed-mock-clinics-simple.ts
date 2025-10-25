
/**
 * Simple Mock Clinics Seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding mock clinics...\n');

  try {
    // Clinic 1: Premium Beauty Spa
    const clinic1 = await prisma.clinic.create({
      data: {
        id: 'mock-premium-001',
        name: 'Premium Beauty Spa Stockholm',
        bokadirektId: 'mock_bd_001',
      },
    });
    console.log('✅ Created:', clinic1.name);

    // Admin for Clinic 1
    const hash1 = await bcrypt.hash('Premium2024!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@premiumbeauty.se',
        name: 'Emma Andersson',
        password: hash1,
        role: 'ADMIN',
        clinicId: clinic1.id,
      },
    });

    // Clinic 2: Budget Fitness
    const clinic2 = await prisma.clinic.create({
      data: {
        id: 'mock-budget-002',
        name: 'Budget Fitness & Spa Göteborg',
        bokadirektId: 'mock_bd_002',
      },
    });
    console.log('✅ Created:', clinic2.name);

    // Admin for Clinic 2
    const hash2 = await bcrypt.hash('Budget2024!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@budgetfitness.se',
        name: 'Johan Svensson',
        password: hash2,
        role: 'ADMIN',
        clinicId: clinic2.id,
      },
    });

    // Clinic 3: Trial Wellness
    const clinic3 = await prisma.clinic.create({
      data: {
        id: 'mock-trial-003',
        name: 'Trial Wellness Center Malmö',
        bokadirektId: 'mock_bd_003',
      },
    });
    console.log('✅ Created:', clinic3.name);

    // Admin for Clinic 3
    const hash3 = await bcrypt.hash('Trial2024!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@trialwellness.se',
        name: 'Maria Nilsson',
        password: hash3,
        role: 'ADMIN',
        clinicId: clinic3.id,
      },
    });

    console.log('\n🎉 Mock clinics seeded successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('  1. admin@premiumbeauty.se  / Premium2024!');
    console.log('  2. admin@budgetfitness.se  / Budget2024!');
    console.log('  3. admin@trialwellness.se  / Trial2024!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
