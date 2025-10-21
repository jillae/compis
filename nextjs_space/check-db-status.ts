import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Verifying database status...\n')
    
    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, name: true }
    })
    console.log(`✅ Users: ${users.length} found`)
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    
    // Check clinics
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true }
    })
    console.log(`\n✅ Clinics: ${clinics.length} found`)
    clinics.forEach(c => console.log(`   - ${c.name}`))
    
    // Check customers
    const customers = await prisma.customer.findMany({
      take: 5,
      select: { id: true, name: true, email: true }
    })
    console.log(`\n✅ Customers: ${customers.length} shown (top 5)`)
    customers.forEach(c => console.log(`   - ${c.name} (${c.email})`))
    
    // Check bookings
    const bookings = await prisma.booking.findMany({
      take: 5,
      select: { id: true, service: true, startTime: true }
    })
    console.log(`\n✅ Bookings: ${bookings.length} shown (top 5)`)
    bookings.forEach(b => console.log(`   - ${b.service} at ${b.startTime}`))
    
    console.log('\n✨ Database recovery verification COMPLETE!')
    
  } catch (error) {
    console.error('❌ Database check failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
