
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

interface CustomerRow {
  'Förnamn'?: string;
  'Efternamn'?: string;
  'E-post'?: string;
  'Mobiltelefonnummer'?: string;
  'Telefonnummer'?: string;
  'Kundstatus'?: string;
  'Roller'?: string;
  'Personnummer'?: string;
  'Kön'?: string;
  'Adress'?: string;
  'Postnummer'?: string;
  'Ort'?: string;
  'Land'?: string;
  'Skapad'?: string;
  'Antal besök'?: string | number;
  'Senaste besök'?: string;
  'SMS-godkänd'?: string;
  'E-post-godkänd'?: string;
  'Marknadsföring-godkänd'?: string;
  'Betalas av'?: string;
  'Kan boka för'?: string;
  'Har ansvarig'?: string;
  'Är ansvarig för'?: string;
  'Är företag'?: string;
  'Företagsnamn'?: string;
  'Anteckningar'?: string;
}

interface StatusRow {
  'ID'?: string | number;
  'Namn'?: string;
  'Beskrivning'?: string;
  'Färg'?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      include: { clinic: true }
    });

    if (!user?.clinicId) {
      return NextResponse.json({ error: 'No clinic associated with user' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    let count = 0;

    if (type === 'statuses') {
      // Import customer statuses
      for (const row of jsonData as StatusRow[]) {
        const sourceId = row['ID']?.toString() || `status_${Date.now()}_${count}`;
        
        const statusData = {
          sourceId: sourceId,
          name: row['Namn'] || 'Okänd',
          description: row['Beskrivning'] || null,
          color: row['Färg'] || null,
          isActive: true,
          clinicId: user.clinicId
        };

        await prisma.customerStatus.upsert({
          where: { 
            clinicId_sourceId: {
              clinicId: user.clinicId,
              sourceId: sourceId
            }
          },
          update: {
            name: statusData.name,
            description: statusData.description,
            color: statusData.color,
            isActive: statusData.isActive
          },
          create: statusData
        });
        count++;
      }
    } else if (type === 'customers') {
      // Import customers
      for (const row of jsonData as CustomerRow[]) {
        const phone = row['Mobiltelefonnummer'] || row['Telefonnummer'];
        
        if (!phone) continue; // Skip if no phone number

        const sourceId = phone; // Use phone as unique identifier
        const customerData = {
          source: 'zoezi' as const,
          sourceId: sourceId,
          firstName: row['Förnamn'] || null,
          lastName: row['Efternamn'] || null,
          name: [row['Förnamn'], row['Efternamn']].filter(Boolean).join(' ') || null,
          email: row['E-post'] || null,
          phone: phone || null,
          city: row['Ort'] || null,
          postalCode: row['Postnummer'] || null,
          clinicId: user.clinicId,
          importedAt: new Date(),
          lastSyncAt: new Date(),
          
          // Consent flags
          consentSms: row['SMS-godkänd']?.toLowerCase() === 'ja' || row['SMS-godkänd']?.toLowerCase() === 'yes',
          consentEmail: row['E-post-godkänd']?.toLowerCase() === 'ja' || row['E-post-godkänd']?.toLowerCase() === 'yes',
          consentMarketing: row['Marknadsföring-godkänd']?.toLowerCase() === 'ja' || row['Marknadsföring-godkänd']?.toLowerCase() === 'yes',
          consentedAt: new Date(),
          
          // Additional fields
          roles: row['Roller'] ? row['Roller'].split(',').map(r => r.trim()) : [],
          paidBy: row['Betalas av'] || null,
          canBookFor: row['Kan boka för'] ? row['Kan boka för'].split(',').map(r => r.trim()) : [],
          hasResponsible: row['Har ansvarig'] || null,
          isResponsibleFor: row['Är ansvarig för'] ? row['Är ansvarig för'].split(',').map(r => r.trim()) : [],
          isCompany: row['Är företag']?.toLowerCase() === 'ja' || row['Är företag']?.toLowerCase() === 'yes',
          companyName: row['Företagsnamn'] || null,
          notes: row['Anteckningar'] || null,
          
          // Visit tracking
          totalVisits: typeof row['Antal besök'] === 'number' ? row['Antal besök'] : parseInt(row['Antal besök'] as string || '0') || 0,
          firstVisitAt: row['Skapad'] ? new Date(row['Skapad']) : null,
          lastVisitAt: row['Senaste besök'] ? new Date(row['Senaste besök']) : null,
          
          // Activity status
          isActive: row['Senaste besök'] ? 
            (new Date(row['Senaste besök']).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000) : 
            true
        };

        // Find matching customer status
        if (row['Kundstatus']) {
          const status = await prisma.customerStatus.findFirst({
            where: { 
              clinicId: user.clinicId,
              name: row['Kundstatus'] 
            }
          });
          if (status) {
            (customerData as any).customerStatusId = status.id;
          }
        }

        // Check if customer already exists
        const existing = await prisma.customer.findFirst({
          where: {
            clinicId: user.clinicId,
            phone: phone
          }
        });

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: customerData
          });
        } else {
          await prisma.customer.create({
            data: customerData
          });
        }
        count++;
      }
    } else if (type === 'categories') {
      // Import course categories (if needed in the future)
      count = jsonData.length;
    }

    return NextResponse.json({ 
      success: true, 
      count,
      message: `Imported ${count} records successfully`
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to import data' 
    }, { status: 500 });
  }
}
