import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function revertSannaRole() {
  try {
    const updated = await prisma.user.update({
      where: { email: 'sanna@archacademy.se' },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    console.log('✅ Sanna reverted to ADMIN:');
    console.log(JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

revertSannaRole();
