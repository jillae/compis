import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      companyName: true,
    },
  });
  
  console.log('Existing users:');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.name || 'No name'}) - ${user.companyName || 'No company'}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
