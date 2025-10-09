import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Linking all data to ArchClinic...')
  
  // Find ArchClinic
  const archClinic = await prisma.clinic.findFirst({
    where: { name: 'ArchClinic' }
  })

  if (!archClinic) {
    console.log('❌ ArchClinic not found!')
    return
  }

  console.log('✅ Found ArchClinic:', archClinic.id)

  // Link all customers
  const customersUpdated = await prisma.customer.updateMany({
    where: { clinicId: null },
    data: { clinicId: archClinic.id }
  })
  console.log('✅ Linked', customersUpdated.count, 'customers to ArchClinic')

  // Link all services
  const servicesUpdated = await prisma.service.updateMany({
    where: { clinicId: null },
    data: { clinicId: archClinic.id }
  })
  console.log('✅ Linked', servicesUpdated.count, 'services to ArchClinic')

  // Link all staff
  const staffUpdated = await prisma.staff.updateMany({
    where: { clinicId: null },
    data: { clinicId: archClinic.id }
  })
  console.log('✅ Linked', staffUpdated.count, 'staff to ArchClinic')

  // Link all bookings
  const bookingsUpdated = await prisma.booking.updateMany({
    where: { clinicId: null },
    data: { clinicId: archClinic.id }
  })
  console.log('✅ Linked', bookingsUpdated.count, 'bookings to ArchClinic')

  // Final stats
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
