
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/customers/import-xls - Import customers from XLS with tags
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Read file as text
    const text = await file.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File must contain header and at least one data row' },
        { status: 400 }
      );
    }

    // Parse CSV/TSV
    const separator = text.includes('\t') ? '\t' : ',';
    const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase());

    // Expected columns: name, email, phone, tags
    const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('namn'));
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('e-post'));
    const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('tel') || h.includes('mobil'));
    const tagsIdx = headers.findIndex((h) => h.includes('tag') || h.includes('etikett'));

    if (nameIdx === -1 && emailIdx === -1 && phoneIdx === -1) {
      return NextResponse.json(
        { error: 'File must contain at least one of: name, email, phone' },
        { status: 400 }
      );
    }

    // Process rows
    let imported = 0;
    let updated = 0;
    let errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(separator).map((c) => c.trim());

      const name = nameIdx >= 0 ? cols[nameIdx] : null;
      const email = emailIdx >= 0 ? cols[emailIdx] : null;
      const phone = phoneIdx >= 0 ? cols[phoneIdx] : null;
      const tagsStr = tagsIdx >= 0 ? cols[tagsIdx] : null;

      // Skip if no identifier
      if (!email && !phone) {
        errors.push(`Row ${i + 1}: Missing email or phone`);
        continue;
      }

      try {
        // Find or create customer
        const where: any = {
          clinicId: session.user.clinicId,
          ...(email && { email }),
          ...(phone && { phone }),
        };

        let customer = await prisma.customer.findFirst({ where });

        if (customer) {
          // Update existing
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              ...(name && { name }),
              ...(email && { email }),
              ...(phone && { phone }),
            },
          });
          updated++;
        } else {
          // Create new
          customer = await prisma.customer.create({
            data: {
              clinicId: session.user.clinicId,
              name: name || 'Imported Customer',
              email,
              phone,
              source: 'xlsImport',
              importedAt: new Date(),
            },
          });
          imported++;
        }

        // Apply tags if provided
        if (tagsStr) {
          const tagNames = tagsStr
            .split(/[,;|]/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0);

          for (const tagName of tagNames) {
            // Find or create tag
            let tag = await prisma.tag.findUnique({
              where: {
                clinicId_name: {
                  clinicId: session.user.clinicId,
                  name: tagName,
                },
              },
            });

            if (!tag) {
              tag = await prisma.tag.create({
                data: {
                  clinicId: session.user.clinicId,
                  name: tagName,
                  description: `Imported from XLS file: ${file.name}`,
                  color: '#6366f1',
                },
              });
            }

            // Apply tag
            await prisma.customerTag.upsert({
              where: {
                customerId_tagId: {
                  customerId: customer.id,
                  tagId: tag.id,
                },
              },
              create: {
                customerId: customer.id,
                tagId: tag.id,
                source: 'XLS_IMPORT',
                sourceReference: file.name,
              },
              update: {
                appliedAt: new Date(),
              },
            });

            // Update tag count
            const count = await prisma.customerTag.count({
              where: { tagId: tag.id },
            });
            await prisma.tag.update({
              where: { id: tag.id },
              data: { customerCount: count },
            });
          }
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: imported + updated,
      errors: errors.slice(0, 10), // Return first 10 errors
      errorCount: errors.length,
    });
  } catch (error) {
    console.error('[Import XLS API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to import customers' },
      { status: 500 }
    );
  }
}
