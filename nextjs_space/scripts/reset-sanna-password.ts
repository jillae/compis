
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetSannaPassword() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const updated = await prisma.user.update({
      where: { email: 'sanna@archacademy.se' },
      data: { password: hashedPassword }
    });
    console.log('✅ Updated user:', updated.email);
    console.log('✅ Password reset successfully');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetSannaPassword();
