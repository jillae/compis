import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPassword = 'flow2024';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { email: 'sanna@archacademy.se' },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true
      }
    });

    console.log('✅ Password reset for:', updated.email);
    console.log('New password:', newPassword);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
