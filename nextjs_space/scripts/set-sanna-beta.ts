
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  // Mark Sanna as beta user
  const sannaEmails = ['sanna@archacademy.se', 'sanna@archclinic.se']
  
  for (const email of sannaEmails) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      })
      
      if (user) {
        await prisma.user.update({
          where: { email },
          data: { isBetaUser: true }
        })
        console.log(`✅ Markerade ${email} som beta-användare`)
      } else {
        console.log(`⚠️  Användare ${email} hittades inte`)
      }
    } catch (error) {
      console.error(`❌ Fel för ${email}:`, error)
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
