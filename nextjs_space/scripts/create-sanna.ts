
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSanna() {
  console.log('🔍 Looking for Arch Clinic...\n');

  // Find or create Arch Clinic
  let clinic = await prisma.clinic.findFirst({
    where: {
      OR: [
        { name: { contains: 'Arch', mode: 'insensitive' } },
        { name: { contains: 'Vardagsstark', mode: 'insensitive' } }
      ]
    }
  });

  if (!clinic) {
    console.log('❌ No Arch/Vardagsstark clinic found. Creating one...');
    clinic = await prisma.clinic.create({
      data: {
        name: 'Arch Clinic / Vardagsstark',
        subscriptionTier: 'INTERNAL',
        subscriptionStatus: 'ACTIVE',
        bokadirektCompanyId: process.env.BOKADIREKT_COMPANY_ID || null,
        bokadirektApiKey: process.env.BOKADIREKT_API_KEY || null,
        bokadirektEnabled: !!process.env.BOKADIREKT_API_KEY,
        hasBokadirektAccess: true
      }
    });
    console.log('✅ Clinic created:', clinic.id, '-', clinic.name);
  } else {
    console.log('✅ Clinic found:', clinic.id, '-', clinic.name);
  }

  // Check if Sanna exists
  let sanna = await prisma.user.findUnique({
    where: { email: 'sanna@archclinic.se' }
  });

  if (sanna) {
    console.log('\n🔄 Sanna exists. Updating...');
    
    const hashedPassword = await bcrypt.hash('arch2024beta', 10);
    
    sanna = await prisma.user.update({
      where: { email: 'sanna@archclinic.se' },
      data: {
        password: hashedPassword,
        clinicId: clinic.id,
        role: 'ADMIN',
        betaStatus: 'APPROVED',
        betaApprovedAt: new Date(),
        isBetaUser: true,
        hasSeenProductTour: false,
        name: 'Sanna',
        firstName: 'Sanna'
      }
    });
    console.log('✅ Sanna updated');
  } else {
    console.log('\n➕ Creating Sanna...');
    
    const hashedPassword = await bcrypt.hash('arch2024beta', 10);
    
    sanna = await prisma.user.create({
      data: {
        email: 'sanna@archclinic.se',
        password: hashedPassword,
        clinicId: clinic.id,
        role: 'ADMIN',
        betaStatus: 'APPROVED',
        betaApprovedAt: new Date(),
        isBetaUser: true,
        hasSeenProductTour: false,
        name: 'Sanna',
        firstName: 'Sanna'
      }
    });
    console.log('✅ Sanna created');
  }

  console.log('\n📋 CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:    sanna@archclinic.se');
  console.log('🔑 Password: arch2024beta');
  console.log('🏢 Clinic:   ', clinic.name);
  console.log('🆔 Clinic ID:', clinic.id);
  console.log('👤 User ID:  ', sanna.id);
  console.log('🎯 Role:     ', sanna.role);
  console.log('🎉 Beta:     ', sanna.betaStatus);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🚀 Next steps:');
  console.log('1. Login at: https://goto.klinikflow.app/auth/login');
  console.log('2. Load RAG knowledge:');
  console.log(`   cd /home/ubuntu/flow/nextjs_space`);
  console.log(`   CLINIC_ID="${clinic.id}" yarn tsx scripts/load-knowledge-base.ts`);

  await prisma.$disconnect();
}

createSanna().catch(console.error);
