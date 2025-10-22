import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function updateSannaRole() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'sanna@archacademy.se' },
      data: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log('✅ Sanna updated to SUPER_ADMIN:');
    console.log(JSON.stringify(updated, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSannaRole();
