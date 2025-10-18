import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { clinic: true }
  });

  console.log('\n=== USER → CLINIC MAPPING ===\n');
  
  for (const user of users) {
    const status = user.clinicId ? '✅' : '❌';
    console.log(`${status} ${user.email}`);
    if (user.clinic) {
      console.log(`   └─ Clinic: ${user.clinic.name} (ID: ${user.clinic.id})`);
    }
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
