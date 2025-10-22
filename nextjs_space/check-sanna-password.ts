import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const sanna = await prisma.user.findUnique({
      where: { email: 'sanna@archacademy.se' },
      select: {
        id: true,
        email: true,
        password: true
      }
    });

    if (sanna) {
      console.log('Sanna password hash:', sanna.password ? sanna.password.substring(0, 20) + '...' : 'NO PASSWORD');
    } else {
      console.log('Sanna not found!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();
