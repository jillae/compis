import { PrismaClient, UserRole } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function testStatsQuery() {
  try {
    console.log('Testing SuperAdmin stats query...');
    
    const clinics = await prisma.clinic.findMany({
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            bookings: true,
            services: true,
            staff: true,
          }
        },
        bookings: {
          select: {
            revenue: true,
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${clinics.length} clinics`);
    console.log('First clinic:', JSON.stringify(clinics[0], null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStatsQuery();
