import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const clinics = await prisma.clinic.findMany()
  console.log('Clinics:', clinics.length)
  clinics.forEach(c => console.log('  -', c.name, c.id))

  const customers = await prisma.customer.findMany({ take: 5 })
  console.log('\nCustomers:', await prisma.customer.count())
  customers.forEach(c => console.log('  -', c.name, 'clinicId:', c.clinicId))

  const bookings = await prisma.booking.findMany({ take: 5 })
  console.log('\nBookings:', await prisma.booking.count())
  bookings.forEach(b => console.log('  - clinicId:', b.clinicId, 'revenue:', b.revenue))

  const services = await prisma.service.findMany({ take: 5 })
  console.log('\nServices:', await prisma.service.count())
  services.forEach(s => console.log('  -', s.name, 'clinicId:', s.clinicId))

  const staff = await prisma.staff.findMany({ take: 5 })
  console.log('\nStaff:', await prisma.staff.count())
  staff.forEach(s => console.log('  -', s.name, 'clinicId:', s.clinicId))

  const users = await prisma.user.findMany()
  console.log('\nUsers:', users.length)
  users.forEach(u => console.log('  -', u.email, 'role:', u.role, 'clinicId:', u.clinicId))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
