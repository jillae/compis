
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Sample data
const TREATMENT_TYPES = [
  'Facial Treatment',
  'Massage Therapy',
  'Hair Cut & Style',
  'Manicure',
  'Pedicure',
  'Eyebrow Threading',
  'Body Wrap',
  'Laser Hair Removal',
  'Chemical Peel',
  'Botox Consultation',
  'Dermaplaning',
  'Microneedling'
]

const BOOKING_CHANNELS = ['online', 'phone', 'walk-in', 'referral']

const STAFF_MEMBERS = [
  { name: 'Sarah Johnson', specialization: 'Facial Treatments', hourlyRate: 75 },
  { name: 'Maria Rodriguez', specialization: 'Massage Therapy', hourlyRate: 80 },
  { name: 'Emma Wilson', specialization: 'Hair Styling', hourlyRate: 65 },
  { name: 'Lisa Chen', specialization: 'Nail Care', hourlyRate: 50 },
  { name: 'Anna Kowalski', specialization: 'Laser Treatments', hourlyRate: 90 },
  { name: 'Jennifer Taylor', specialization: 'Aesthetic Treatments', hourlyRate: 85 }
]

const ROOMS = [
  { name: 'Treatment Room 1', equipmentType: 'Facial Equipment' },
  { name: 'Treatment Room 2', equipmentType: 'Massage Equipment' },
  { name: 'Hair Station 1', equipmentType: 'Hair Styling' },
  { name: 'Hair Station 2', equipmentType: 'Hair Styling' },
  { name: 'Nail Station 1', equipmentType: 'Manicure/Pedicure' },
  { name: 'Nail Station 2', equipmentType: 'Manicure/Pedicure' },
  { name: 'Laser Room', equipmentType: 'Laser Equipment' },
  { name: 'Consultation Room', equipmentType: 'General' }
]

const CUSTOMER_NAMES = [
  { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@email.com', phone: '+1-555-0101' },
  { firstName: 'Sophie', lastName: 'Anderson', email: 'sophie.anderson@email.com', phone: '+1-555-0102' },
  { firstName: 'Rachel', lastName: 'Thompson', email: 'rachel.thompson@email.com', phone: '+1-555-0103' },
  { firstName: 'Jessica', lastName: 'Martinez', email: 'jessica.martinez@email.com', phone: '+1-555-0104' },
  { firstName: 'Amanda', lastName: 'Garcia', email: 'amanda.garcia@email.com', phone: '+1-555-0105' },
  { firstName: 'Michelle', lastName: 'Brown', email: 'michelle.brown@email.com', phone: '+1-555-0106' },
  { firstName: 'Lauren', lastName: 'Jones', email: 'lauren.jones@email.com', phone: '+1-555-0107' },
  { firstName: 'Nicole', lastName: 'Miller', email: 'nicole.miller@email.com', phone: '+1-555-0108' },
  { firstName: 'Ashley', lastName: 'Wilson', email: 'ashley.wilson@email.com', phone: '+1-555-0109' },
  { firstName: 'Stephanie', lastName: 'Moore', email: 'stephanie.moore@email.com', phone: '+1-555-0110' },
  { firstName: 'Megan', lastName: 'Taylor', email: 'megan.taylor@email.com', phone: '+1-555-0111' },
  { firstName: 'Samantha', lastName: 'White', email: 'samantha.white@email.com', phone: '+1-555-0112' },
  { firstName: 'Christina', lastName: 'Harris', email: 'christina.harris@email.com', phone: '+1-555-0113' },
  { firstName: 'Danielle', lastName: 'Clark', email: 'danielle.clark@email.com', phone: '+1-555-0114' },
  { firstName: 'Brittany', lastName: 'Lewis', email: 'brittany.lewis@email.com', phone: '+1-555-0115' },
  { firstName: 'Victoria', lastName: 'Walker', email: 'victoria.walker@email.com', phone: '+1-555-0116' },
  { firstName: 'Kelly', lastName: 'Hall', email: 'kelly.hall@email.com', phone: '+1-555-0117' },
  { firstName: 'Heather', lastName: 'Allen', email: 'heather.allen@email.com', phone: '+1-555-0118' },
  { firstName: 'Catherine', lastName: 'Young', email: 'catherine.young@email.com', phone: '+1-555-0119' },
  { firstName: 'Amy', lastName: 'King', email: 'amy.king@email.com', phone: '+1-555-0120' }
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(daysBack: number, daysForward: number = 0): Date {
  const now = new Date()
  const minTime = now.getTime() - (daysBack * 24 * 60 * 60 * 1000)
  const maxTime = now.getTime() + (daysForward * 24 * 60 * 60 * 1000)
  return new Date(minTime + Math.random() * (maxTime - minTime))
}

function getBusinessHours(): Date {
  const date = getRandomDate(30, 7)
  // Set business hours (9 AM to 6 PM)
  const hour = 9 + Math.floor(Math.random() * 9)
  const minute = Math.random() > 0.5 ? 0 : 30
  date.setHours(hour, minute, 0, 0)
  return date
}

function getTreatmentPrice(treatmentType: string): number {
  const basePrices: Record<string, number> = {
    'Facial Treatment': 120,
    'Massage Therapy': 150,
    'Hair Cut & Style': 85,
    'Manicure': 45,
    'Pedicure': 55,
    'Eyebrow Threading': 35,
    'Body Wrap': 180,
    'Laser Hair Removal': 200,
    'Chemical Peel': 160,
    'Botox Consultation': 300,
    'Dermaplaning': 140,
    'Microneedling': 220
  }
  
  const basePrice = basePrices[treatmentType] || 100
  // Add some price variation (±20%)
  const variation = 0.8 + (Math.random() * 0.4)
  return Math.round(basePrice * variation)
}

function getTreatmentDuration(treatmentType: string): number {
  const durations: Record<string, number> = {
    'Facial Treatment': 75,
    'Massage Therapy': 90,
    'Hair Cut & Style': 60,
    'Manicure': 30,
    'Pedicure': 45,
    'Eyebrow Threading': 20,
    'Body Wrap': 120,
    'Laser Hair Removal': 45,
    'Chemical Peel': 60,
    'Botox Consultation': 30,
    'Dermaplaning': 45,
    'Microneedling': 75
  }
  
  return durations[treatmentType] || 60
}

function getBookingStatus(): 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' {
  const rand = Math.random()
  
  if (rand < 0.65) return 'COMPLETED'
  if (rand < 0.75) return 'CONFIRMED'
  if (rand < 0.85) return 'SCHEDULED'
  if (rand < 0.92) return 'NO_SHOW'
  return 'CANCELLED'
}

async function seed() {
  try {
    console.log('🌱 Starting database seed...')

    // Create default admin user (for testing)
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.upsert({
      where: { email: 'admin@flowclinic.com' },
      update: {},
      create: {
        email: 'admin@flowclinic.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        companyName: 'Flow Beauty Clinic',
        jobTitle: 'Operations Manager',
        name: 'Admin User'
      }
    })

    // Create default test user
    const testPassword = await bcrypt.hash('johndoe123', 10)
    await prisma.user.upsert({
      where: { email: 'john@doe.com' },
      update: {},
      create: {
        email: 'john@doe.com',
        password: testPassword,
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Flow Beauty Clinic',
        jobTitle: 'Clinic Owner',
        name: 'John Doe'
      }
    })

    console.log('👥 Creating staff members...')
    const staff = await Promise.all(
      STAFF_MEMBERS.map(staffMember =>
        prisma.staff.create({
          data: {
            name: staffMember.name,
            email: staffMember.name.toLowerCase().replace(' ', '.') + '@flowclinic.com',
            specialization: staffMember.specialization,
            hourlyRate: staffMember.hourlyRate
          }
        })
      )
    )

    console.log('🏠 Creating treatment rooms...')
    const rooms = await Promise.all(
      ROOMS.map(room =>
        prisma.room.create({
          data: {
            name: room.name,
            equipmentType: room.equipmentType
          }
        })
      )
    )

    console.log('👤 Creating customers...')
    const customers = await Promise.all(
      CUSTOMER_NAMES.map(customer =>
        prisma.customer.create({
          data: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            firstVisit: getRandomDate(365),
          }
        })
      )
    )

    console.log('📅 Creating bookings...')
    
    // Generate realistic booking patterns
    const bookingPromises = []
    
    for (let i = 0; i < 250; i++) {
      const customer = getRandomElement(customers)
      const treatmentType = getRandomElement(TREATMENT_TYPES)
      const scheduledTime = getBusinessHours()
      const bookedAt = new Date(scheduledTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const status = getBookingStatus()
      const price = getTreatmentPrice(treatmentType)
      const duration = getTreatmentDuration(treatmentType)
      const assignedStaff = getRandomElement(staff)
      const assignedRoom = getRandomElement(rooms)
      const bookingChannel = getRandomElement(BOOKING_CHANNELS)

      bookingPromises.push(
        prisma.booking.create({
          data: {
            customerId: customer.id,
            staffId: assignedStaff.id,
            roomId: assignedRoom.id,
            treatmentType,
            scheduledTime,
            duration,
            price,
            bookingChannel,
            bookedAt,
            status,
            notes: Math.random() > 0.8 ? 'Customer requested specific staff member' : null
          }
        })
      )
    }

    await Promise.all(bookingPromises)

    console.log('🔄 Updating customer statistics...')
    
    // Update customer statistics based on bookings
    for (const customer of customers) {
      const customerBookings = await prisma.booking.findMany({
        where: { customerId: customer.id }
      })
      
      const totalBookings = customerBookings.length
      const noShowCount = customerBookings.filter(b => b.status === 'NO_SHOW').length
      const completedBookings = customerBookings.filter(b => b.status === 'COMPLETED')
      const totalSpent = completedBookings.reduce((sum, booking) => sum + Number(booking.price), 0)
      const firstVisit = customerBookings.length > 0 
        ? new Date(Math.min(...customerBookings.map(b => b.scheduledTime.getTime())))
        : customer.firstVisit

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalBookings,
          noShowCount,
          totalSpent,
          firstVisit
        }
      })
    }

    console.log('✨ Database seeded successfully!')
    console.log(`Created:`)
    console.log(`  - 2 admin users`)
    console.log(`  - ${staff.length} staff members`)
    console.log(`  - ${rooms.length} treatment rooms`)  
    console.log(`  - ${customers.length} customers`)
    console.log(`  - 250 bookings with realistic patterns`)

  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
