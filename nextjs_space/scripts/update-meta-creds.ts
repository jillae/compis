import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find Arch Clinic
  const clinic = await prisma.clinic.findFirst({
    where: {
      name: {
        contains: 'Arch',
        mode: 'insensitive'
      }
    }
  })

  if (!clinic) {
    console.error('❌ Arch Clinic not found')
    return
  }

  console.log(`✅ Found clinic: ${clinic.name} (${clinic.id})`)

  // Update with Meta credentials
  const updated = await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      metaEnabled: true,
      metaAccessToken: process.env.META_ACCESS_TOKEN,
      metaAdAccountId: process.env.META_AD_ACCOUNT_ID,
      metaAppId: process.env.META_APP_ID,
      metaAppSecret: process.env.META_APP_SECRET,
      metaTargetCPL: 150.00, // 150 kr target cost per lead
      metaTargetROAS: 3.00, // 3.0x ROAS target
      metaCapacityMin: 75,
      metaCapacityMax: 90,
    }
  })

  console.log('✅ Meta credentials updated successfully!')
  console.log(`   - metaEnabled: ${updated.metaEnabled}`)
  console.log(`   - metaAdAccountId: ${updated.metaAdAccountId}`)
  console.log(`   - metaTargetCPL: ${updated.metaTargetCPL} kr`)
  console.log(`   - metaTargetROAS: ${updated.metaTargetROAS}x`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
