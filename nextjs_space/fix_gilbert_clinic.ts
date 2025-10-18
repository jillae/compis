import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Gilbert's user account
  const gilbert = await prisma.user.findUnique({
    where: { email: 'gilbert@archacademy.se' }
  });

  if (!gilbert) {
    console.error('Gilbert not found!');
    return;
  }

  console.log('Found Gilbert:', gilbert.email);

  if (gilbert.clinicId) {
    console.log('Gilbert already has a clinic:', gilbert.clinicId);
    return;
  }

  // Create a clinic for Gilbert
  const gilbertClinic = await prisma.clinic.create({
    data: {
      name: 'Klinik Flow Control',
      description: 'Platform owner clinic - full access to all features',
      address: 'Stockholm, Sweden',
      phone: '+46 70 123 45 67',
      email: 'gilbert@archacademy.se',
      tier: 'INTERNAL',
      subscriptionStatus: 'ACTIVE',
      isActive: true,
      bokadirektEnabled: true,
      metaEnabled: true,
      corexEnabled: true,
      dynamicPricingEnabled: true,
      retentionAutopilotEnabled: true,
      aiActionsEnabled: true,
    }
  });

  console.log('Created clinic:', gilbertClinic.id);

  // Link Gilbert to the clinic
  await prisma.user.update({
    where: { id: gilbert.id },
    data: { clinicId: gilbertClinic.id }
  });

  console.log('✅ Gilbert is now linked to clinic:', gilbertClinic.id);

  // Also fix the demo users
  const demoUsers = await prisma.user.findMany({
    where: {
      clinicId: null,
      email: {
        in: ['superadmin@klinikflow.se', 'admin@flowclinic.com', 'demo@flowclinic.com']
      }
    }
  });

  for (const user of demoUsers) {
    const userClinic = await prisma.clinic.create({
      data: {
        name: `${user.companyName || user.name}'s Clinic`,
        description: 'Demo clinic with full features',
        address: 'Stockholm, Sweden',
        phone: '+46 70 123 45 67',
        email: user.email,
        tier: 'INTERNAL',
        subscriptionStatus: 'ACTIVE',
        isActive: true,
        bokadirektEnabled: false,
        metaEnabled: false,
        corexEnabled: false,
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { clinicId: userClinic.id }
    });

    console.log(`✅ ${user.email} is now linked to clinic:`, userClinic.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
