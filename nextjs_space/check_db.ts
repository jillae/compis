import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== USERS ===');
  const users = await prisma.user.findMany({
    include: {
      clinic: true
    }
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== CLINICS ===');
  const clinics = await prisma.clinic.findMany();
  console.log(JSON.stringify(clinics, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
