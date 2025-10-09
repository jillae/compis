import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const archClinic = await prisma.clinic.findFirst({
    where: { name: 'ArchClinic' }
  })

  if (!archClinic) {
    console.log('❌ ArchClinic not found!')
    return
  }

  // Update specific users to link to ArchClinic
  const usersToLink = [
    { email: 'admin@flowclinic.com', role: UserRole.CLINIC_ADMIN },
    { email: 'demo@flowclinic.com', role: UserRole.CLINIC_STAFF },
  ]

  for (const userData of usersToLink) {
    const user = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (user) {
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          role: userData.role,
          clinicId: archClinic.id,
        },
      })
      console.log('✅ Linked', userData.email, 'to ArchClinic as', userData.role)
    }
  }

  // Final count
  const userCount = await prisma.user.count({
    where: { clinicId: archClinic.id }
  })
  console.log('\n✅ Total users linked to ArchClinic:', userCount)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
