import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const archClinic = await prisma.clinic.findFirst({
    where: { 
      name: { 
        contains: 'Arch', 
        mode: 'insensitive' 
      } 
    }
  });
  
  console.log('Arch Clinic:', JSON.stringify(archClinic, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
