
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating SuperAdmin user...')
  
  const hashedPassword = await bcrypt.hash('superadmin123', 10)
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@klinikflow.se' },
    update: {
      role: UserRole.SUPER_ADMIN,
      password: hashedPassword,
    },
    create: {
      email: 'superadmin@klinikflow.se',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  })

  console.log('✅ SuperAdmin created:', superAdmin.email)
  console.log('📧 Email: superadmin@klinikflow.se')
  console.log('🔑 Password: superadmin123')
  
  // Also update existing users to have roles
  const archClinicUser = await prisma.user.findUnique({
    where: { email: 'admin@archclinic.se' }
  })
  
  if (archClinicUser) {
    // Find or create ArchClinic
    const archClinic = await prisma.clinic.findFirst({
      where: { name: { contains: 'ArchClinic', mode: 'insensitive' } }
    })
    
    if (archClinic) {
      await prisma.user.update({
        where: { email: 'admin@archclinic.se' },
        data: {
          role: UserRole.CLINIC_ADMIN,
          clinicId: archClinic.id,
        },
      })
      console.log('✅ Updated admin@archclinic.se to CLINIC_ADMIN')
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
