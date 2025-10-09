
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing ArchClinic data...')
  
  // Find ArchClinic
  const archClinic = await prisma.clinic.findFirst({
    where: {
      OR: [
        { name: { contains: 'ArchClinic', mode: 'insensitive' } },
        { name: { contains: 'Arch', mode: 'insensitive' } }
      ]
    }
  })

  if (!archClinic) {
    console.log('❌ ArchClinic not found! Creating one...')
    const newClinic = await prisma.clinic.create({
      data: {
        name: 'ArchClinic',
        description: 'Beauty & Health Clinic',
        isActive: true,
        tier: 'BASIC',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      }
    })
    console.log('✅ ArchClinic created:', newClinic.id)
    return
  }

  console.log('✅ Found ArchClinic:', archClinic.name, archClinic.id)

  // Update admin@archclinic.se to be a CLINIC_ADMIN for ArchClinic
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@archclinic.se' }
  })

  if (adminUser) {
    await prisma.user.update({
      where: { email: 'admin@archclinic.se' },
      data: {
        role: UserRole.CLINIC_ADMIN,
        clinicId: archClinic.id,
      },
    })
    console.log('✅ Updated admin@archclinic.se to CLINIC_ADMIN for ArchClinic')
  }

  // Update demo@archclinic.se to be a CLINIC_STAFF for ArchClinic
  const demoUser = await prisma.user.findUnique({
    where: { email: 'demo@archclinic.se' }
  })

  if (demoUser) {
    await prisma.user.update({
      where: { email: 'demo@archclinic.se' },
      data: {
        role: UserRole.CLINIC_STAFF,
        clinicId: archClinic.id,
      },
    })
    console.log('✅ Updated demo@archclinic.se to CLINIC_STAFF for ArchClinic')
  }

  // Update ArchClinic with tier and subscription info
  await prisma.clinic.update({
    where: { id: archClinic.id },
    data: {
      tier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: null,
      subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  })
  console.log('✅ Updated ArchClinic to PROFESSIONAL tier with ACTIVE subscription')

  // Count stats
  const stats = await prisma.clinic.findUnique({
    where: { id: archClinic.id },
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
          bookings: true,
          services: true,
          staff: true,
        }
      }
    }
  })

  console.log('\n📊 ArchClinic Stats:')
  console.log('   Users:', stats?._count.users)
  console.log('   Customers:', stats?._count.customers)
  console.log('   Bookings:', stats?._count.bookings)
  console.log('   Services:', stats?._count.services)
  console.log('   Staff:', stats?._count.staff)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
