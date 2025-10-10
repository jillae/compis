import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing Customer totalSpent Calculation Bug...\n')
  
  // Get all customers
  const customers = await prisma.customer.findMany({
    include: {
      bookings: {
        where: {
          status: { in: ['COMPLETED', 'completed'] }
        },
        select: {
          price: true
        }
      }
    }
  })
  
  console.log(`Found ${customers.length} customers to process\n`)
  
  let updatedCount = 0
  let totalRevenueAdded = 0
  
  for (const customer of customers) {
    // Calculate correct totalSpent from completed bookings
    const correctTotalSpent = customer.bookings.reduce((sum, booking) => {
      return sum + Number(booking.price)
    }, 0)
    
    const oldTotal = Number(customer.totalSpent)
    
    // Only update if there's a difference
    if (correctTotalSpent !== oldTotal) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { totalSpent: correctTotalSpent }
      })
      
      const diff = correctTotalSpent - oldTotal
      totalRevenueAdded += diff
      updatedCount++
      
      if (diff !== 0) {
        console.log(`✓ ${customer.name}: ${oldTotal} kr → ${correctTotalSpent} kr (${diff > 0 ? '+' : ''}${diff} kr)`)
      }
    }
  }
  
  console.log(`\n✨ Fixed ${updatedCount} customers`)
  console.log(`💰 Total revenue recovered: ${totalRevenueAdded.toLocaleString('sv-SE')} kr`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
