import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function checkSannaRole() {
  try {
    const sanna = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'sanna', mode: 'insensitive' } },
          { email: { contains: 'holmgren', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clinicId: true
      }
    });

    if (sanna) {
      console.log('Sanna found:');
      console.log(JSON.stringify(sanna, null, 2));
    } else {
      console.log('Sanna not found!');
    }

    // List all SUPER_ADMIN users
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log('\nAll SUPER_ADMIN users:');
    console.log(JSON.stringify(superAdmins, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSannaRole();
