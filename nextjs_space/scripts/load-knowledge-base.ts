
/**
 * Load Knowledge Base Script
 * Process Vardagsstark data and load into database with embeddings
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  createServiceChunk,
  createPhilosophyChunk,
  createBookingInfoChunk,
  createPackageChunk,
  type KnowledgeChunk,
} from '../lib/rag/chunking';
import { generateEmbeddingsBatch } from '../lib/rag/embeddings';

const prisma = new PrismaClient();

// Arch Clinic ID (update this with actual clinic ID)
const ARCH_CLINIC_ID = 'clz6d9w3y0000v3z8h9x4y2z1'; // Replace with actual ID

interface RawData {
  clinic_name: string;
  services: any[];
  packages: any[];
  offers: any[];
  philosophy: any;
  booking_info: any;
  practitioners: any[];
  metadata: any;
}

async function loadKnowledgeBase() {
  console.log('🚀 Starting knowledge base import...\n');

  // Read JSON file
  const dataPath = path.join(process.cwd(), '..', 'rag-data', 'vardagsstark_knowledge_base.json');
  const rawData: RawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const chunks: KnowledgeChunk[] = [];

  // 1. Process Services
  console.log(`📦 Processing ${rawData.services?.length || 0} services...`);
  if (rawData.services) {
    for (const service of rawData.services) {
      try {
        const chunk = createServiceChunk(service);
        chunks.push(chunk);
      } catch (error) {
        console.error(`   ⚠️  Error processing service "${service.service_name}":`, error);
      }
    }
  }

  // 2. Process Packages
  console.log(`📦 Processing ${rawData.packages?.length || 0} packages...`);
  if (rawData.packages) {
    for (const pkg of rawData.packages) {
      try {
        const chunk = createPackageChunk(
          pkg.name || pkg.package_name,
          pkg.description || '',
          pkg.price_sek || pkg.price,
          pkg.keywords || ['klippkort', 'paket']
        );
        chunks.push(chunk);
      } catch (error) {
        console.error(`   ⚠️  Error processing package:`, error);
      }
    }
  }

  // 3. Process Philosophy
  console.log('📚 Processing philosophy...');
  if (rawData.philosophy) {
    const philosophyTexts = [
      {
        title: 'Archmethod® - Neurocentrerat Perspektiv',
        content: rawData.philosophy.archmethod || 'Archmethod® är en neurobaserad metod som fokuserar på att optimera hjärna och nervsystem för ökad funktion och minskad smärta.',
        keywords: ['archmethod', 'neurologi', 'neurobaserad', 'metod'],
      },
      {
        title: 'Smärta som Överlevnadsreflex',
        content: rawData.philosophy.pain_concept || 'Smärta är inte ett strukturellt problem utan en överlevnadsreflex från hjärnan. Vi behandlar inte smärtan i sig utan orsaken till varför hjärnan aktiverar smärtsignaler.',
        keywords: ['smärta', 'reflex', 'överlevnad', 'hjärnan'],
      },
      {
        title: 'LLLT - Low-Level Laser Therapy',
        content: rawData.philosophy.lllt || 'LLLT är en FDA-godkänd, icke-termisk laserbehandling som stimulerar cellulär läkning och minskar inflammation.',
        keywords: ['lllt', 'laser', 'fda', 'behandling'],
      },
    ];

    for (const phil of philosophyTexts) {
      const chunk = createPhilosophyChunk(phil.title, phil.content, phil.keywords);
      chunks.push(chunk);
    }
  }

  // 4. Process Booking Info
  console.log('📞 Processing booking info...');
  if (rawData.booking_info) {
    const bookingText = `
Bokning på Vardagsstark / Arch Clinic:

Telefon: ${rawData.booking_info.phone || '023-125 25'}
Email: ${rawData.booking_info.email || 'info@vardagsstark.nu'}
Adress: ${rawData.booking_info.address || 'Kopparvägen 28, 791 41 Falun'}

Öppettider:
${rawData.booking_info.opening_hours || 'Mån 09-20:30, Tis-Ons 08:30-20:30, Tor 08:30-17:30, Fre 08:30-14:00'}

Betalning: ${rawData.booking_info.payment || 'Vid bokning eller på plats'}

VIKTIGT: Vi rekommenderar alltid att börja med en konsultation för nya kunder så vi kan förstå dina behov och skapa en individuell behandlingsplan.
    `.trim();

    const chunk = createBookingInfoChunk(bookingText, [
      'boka',
      'bokning',
      'öppettider',
      'telefon',
      'kontakt',
      'adress',
    ]);
    chunks.push(chunk);
  }

  console.log(`\n✅ Created ${chunks.length} knowledge chunks\n`);

  // Generate embeddings in batches
  console.log('🧠 Generating embeddings...');
  const batchSize = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);
    
    process.stdout.write(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...\r`);
    
    try {
      const embeddings = await generateEmbeddingsBatch(texts);
      allEmbeddings.push(...embeddings);
    } catch (error) {
      console.error(`\n   ⚠️  Error generating embeddings for batch ${i}:`, error);
      // Add empty embeddings as fallback
      allEmbeddings.push(...batch.map(() => new Array(1536).fill(0)));
    }
    
    // Rate limiting: wait 1 second between batches
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Embeddings generated\n');

  // Insert into database
  console.log('💾 Inserting into database...');
  
  // Delete existing knowledge base for this clinic
  await prisma.knowledgeChunk.deleteMany({
    where: { clinicId: ARCH_CLINIC_ID },
  });
  console.log('   Cleared existing knowledge base');

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = allEmbeddings[i];

    try {
      await prisma.knowledgeChunk.create({
        data: {
          clinicId: ARCH_CLINIC_ID,
          content: chunk.content,
          contentType: chunk.contentType,
          category: chunk.category || null,
          subcategory: chunk.subcategory || null,
          serviceName: chunk.serviceName || null,
          duration: chunk.duration || null,
          price: chunk.price || null,
          practitioner: chunk.practitioner || null,
          embedding,
          keywords: chunk.keywords,
          sourceUrl: chunk.sourceUrl || null,
          sourceType: chunk.sourceType,
        },
      });
      inserted++;
      process.stdout.write(`   Inserted ${inserted}/${chunks.length}...\r`);
    } catch (error) {
      failed++;
      console.error(`\n   ⚠️  Error inserting chunk "${chunk.serviceName || chunk.contentType}":`, error);
    }
  }

  console.log(`\n\n✅ Knowledge base import complete!`);
  console.log(`   ✓ Inserted: ${inserted}`);
  console.log(`   ✗ Failed: ${failed}`);

  await prisma.$disconnect();
}

loadKnowledgeBase().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
