
/**
 * Fix STT Providers:
 * 1. Remove KB-Whisper Pudun
 * 2. Set OpenAI as #1
 * 3. Set KB-Whisper Lokal as #2
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing STT providers...\n');

  // 1. Remove KB-Whisper Pudun
  console.log('1️⃣ Removing KB-Whisper Pudun...');
  const deleted = await prisma.$executeRaw`
    DELETE FROM stt_provider_config WHERE provider_name = 'KB_WHISPER_PUDUN'
  `;
  console.log(`   ✓ Removed ${deleted} provider(s)\n`);

  // 2. Temporarily set high priority to avoid conflicts
  console.log('2️⃣ Reordering providers...');
  
  // Set temporary high priorities to avoid unique constraint conflicts
  await prisma.$executeRaw`
    UPDATE stt_provider_config 
    SET priority_order = 100 + priority_order, updated_at = NOW()
  `;
  
  // Now set the correct priorities
  await prisma.$executeRaw`
    UPDATE stt_provider_config 
    SET priority_order = 1, updated_at = NOW()
    WHERE provider_name = 'OPENAI'
  `;
  
  await prisma.$executeRaw`
    UPDATE stt_provider_config 
    SET priority_order = 2, updated_at = NOW()
    WHERE provider_name = 'KB_WHISPER_FLOW_SPEAK'
  `;
  
  console.log('   ✓ Priorities updated\n');

  // Verify
  console.log('📊 Current STT providers:');
  const providers = await prisma.$queryRaw<any[]>`
    SELECT id, provider_name, display_name, priority_order, is_active 
    FROM stt_provider_config 
    ORDER BY priority_order
  `;
  
  providers.forEach((p) => {
    console.log(`   ${p.priority_order}. ${p.display_name} (${p.provider_name}) - ${p.is_active ? '✓ Active' : '✗ Inactive'}`);
  });

  console.log('\n✅ STT providers fixed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
