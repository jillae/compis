
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Checking current STT providers...\n');

  // Check current state
  const providers = await prisma.sttProviderConfig.findMany({
    orderBy: { priority: 'asc' }
  });

  console.log('Current providers:');
  providers.forEach(p => {
    console.log(`${p.priority}. ${p.displayName} (${p.providerName})`);
    console.log(`   Endpoint: ${p.apiEndpoint}:${p.port}`);
    console.log(`   Active: ${p.isActive ? '✅' : '❌'}`);
  });

  // Update KB-Whisper Flow-Speak to ensure port 5001
  console.log('\n🔄 Updating KB-Whisper Flow-Speak to port 5001...\n');
  
  const flowSpeakUpdate = await prisma.sttProviderConfig.updateMany({
    where: {
      providerName: {
        contains: 'FLOW_SPEAK'
      }
    },
    data: {
      port: 5001,
      configJson: {
        language: 'sv',
        model: 'kb-whisper-medium-highest-quality',
        beam_size: 5,
        best_of: 5,
        temperature: 0.0,
        purpose: 'telephone-audio-optimized'
      }
    }
  });

  console.log(`✅ Updated ${flowSpeakUpdate.count} provider(s)\n`);

  // Show final state
  const finalProviders = await prisma.sttProviderConfig.findMany({
    orderBy: { priority: 'asc' }
  });

  console.log('📊 Final configuration:\n');
  finalProviders.forEach(p => {
    console.log(`${p.priority}. ${p.displayName}`);
    console.log(`   Provider: ${p.providerName}`);
    console.log(`   Endpoint: ${p.apiEndpoint || 'N/A'}:${p.port || 'N/A'}`);
    console.log(`   Active: ${p.isActive ? '✅' : '❌'}`);
    console.log(`   Config: ${JSON.stringify(p.configJson, null, 2)}`);
    console.log('---\n');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
