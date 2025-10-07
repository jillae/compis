
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mappings = JSON.parse(formData.get('mappings') as string || '{}')

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create import log entry
    const importLog = await prisma.importLog.create({
      data: {
        filename: file.name,
        status: 'PROCESSING',
        metadata: mappings
      }
    })

    // Parse CSV content
    const csvText = await file.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''))
    
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
        
        // Map CSV values to our schema based on user mappings
        const customerEmail = values[headers.indexOf(mappings.customerEmail)] || ''
        const customerPhone = values[headers.indexOf(mappings.customerPhone)] || ''
        const customerName = values[headers.indexOf(mappings.customerName)] || ''
        const treatmentType = values[headers.indexOf(mappings.treatmentType)] || 'General'
        const scheduledTime = values[headers.indexOf(mappings.scheduledTime)] || ''
        const duration = parseInt(values[headers.indexOf(mappings.duration)]) || 60
        const price = parseFloat(values[headers.indexOf(mappings.price)]) || 0
        const status = values[headers.indexOf(mappings.status)] || 'SCHEDULED'
        const staffName = values[headers.indexOf(mappings.staffName)] || ''

        if (!scheduledTime || !customerEmail) {
          errors.push(`Row ${i + 1}: Missing required fields`)
          errorCount++
          continue
        }

        // Find or create customer
        let customer = await prisma.customer.findFirst({
          where: {
            OR: [
              { email: customerEmail },
              { phone: customerPhone }
            ]
          }
        })

        if (!customer) {
          const nameParts = customerName.split(' ')
          customer = await prisma.customer.create({
            data: {
              email: customerEmail,
              phone: customerPhone,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || ''
            }
          })
        }

        // Find or create staff
        let staff = null
        if (staffName) {
          staff = await prisma.staff.findFirst({
            where: { name: { contains: staffName, mode: 'insensitive' } }
          })
          
          if (!staff) {
            staff = await prisma.staff.create({
              data: { name: staffName }
            })
          }
        }

        // Create booking
        await prisma.booking.create({
          data: {
            customerId: customer.id,
            staffId: staff?.id,
            treatmentType,
            scheduledTime: new Date(scheduledTime),
            duration,
            price,
            bookedAt: new Date(scheduledTime),
            status: status as any,
            bookingChannel: 'import'
          }
        })

        successCount++
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error?.toString?.() || 'Unknown error'}`)
        errorCount++
      }
    }

    // Update import log
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        status: errorCount > 0 && successCount === 0 ? 'FAILED' : 'COMPLETED',
        totalRows: lines.length - 1,
        successRows: successCount,
        errorRows: errorCount,
        errors: errors.length > 0 ? errors.join('\n') : null
      }
    })

    return NextResponse.json({
      success: true,
      importId: importLog.id,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Return first 10 errors
    })
  } catch (error) {
    console.error("CSV import error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
