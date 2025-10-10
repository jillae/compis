import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find services that are packages (contain "paket" or "klippkort")
  const packageServices = await prisma.service.findMany({
    where: {
      OR: [
        { name: { contains: 'paket', mode: 'insensitive' } },
        { name: { contains: 'klippkort', mode: 'insensitive' } },
      ]
    }
  })
  
  console.log('\n📦 Package Services Found:')
  console.log('=========================')
  packageServices.forEach(s => console.log(`  - ${s.name} (${s.price} kr)`))
  
  // Get bookings for these package services
  const packageBookings = await prisma.booking.findMany({
    where: {
      serviceId: {
        in: packageServices.map(s => s.id)
      }
    },
    include: {
      customer: {
        select: {
          name: true,
          totalSpent: true
        }
      },
      service: {
        select: {
          name: true,
          price: true
        }
      }
    },
    take: 10
  })
  
  console.log('\n📊 Package Bookings Sample:')
  console.log('===========================')
  packageBookings.forEach(b => {
    console.log(`Customer: ${b.customer.name}`)
    console.log(`  Service: ${b.service?.name}`)
    console.log(`  Booking price: ${b.price} kr`)
    console.log(`  Service list price: ${b.service?.price} kr`)
    console.log(`  Customer total spent: ${b.customer.totalSpent} kr`)
    console.log(`  Status: ${b.status}`)
    console.log('---')
  })
  
  // Check for specific customers with multiple package bookings
  const customersWithPackages = await prisma.customer.findMany({
    where: {
      bookings: {
        some: {
          serviceId: {
            in: packageServices.map(s => s.id)
          }
        }
      }
    },
    include: {
      bookings: {
        where: {
          serviceId: {
            in: packageServices.map(s => s.id)
          }
        },
        include: {
          service: {
            select: {
              name: true,
              price: true
            }
          }
        }
      }
    },
    take: 5
  })
  
  console.log('\n👥 Customers with Package Purchases:')
  console.log('====================================')
  customersWithPackages.forEach(customer => {
    console.log(`\nCustomer: ${customer.name}`)
    console.log(`  Total Spent (in DB): ${customer.totalSpent} kr`)
    console.log(`  Package bookings:`)
    
    let calculatedTotal = 0
    customer.bookings.forEach(b => {
      console.log(`    - ${b.service?.name}: ${b.price} kr (status: ${b.status})`)
      if (b.status === 'COMPLETED' || b.status === 'completed') {
        calculatedTotal += Number(b.price)
      }
    })
    
    console.log(`  Calculated total from packages: ${calculatedTotal} kr`)
    console.log(`  Difference: ${Number(customer.totalSpent) - calculatedTotal} kr`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
