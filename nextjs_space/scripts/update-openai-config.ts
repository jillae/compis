
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating OpenAI Whisper configuration...\n');

  // Update OpenAI provider with full configuration
  const updated = await prisma.sttProviderConfig.updateMany({
    where: {
      providerName: 'OPENAI'
    },
    data: {
      configJson: {
        model: 'whisper-1',
        language: 'sv',
        response_format: 'verbose_json',
        temperature: 0.0,
        timestamp_granularities: ['word'],
        prompt: 'Dr. Andersson, Bokadirekt, Restylane, Botox, hyaluronsyra, fillers, estetiska behandlingar, ansiktsbehandling, kemisk peeling, microneedling, IPL-behandling, laserbehandling, klinikbesök, tidsbokning, bokningssystem, kundtjänst, receptionist, behandlingsrum'
      }
    }
  });

  console.log(`✅ Updated ${updated.count} provider(s)\n`);

  // Show final configuration
  const providers = await prisma.sttProviderConfig.findMany({
    orderBy: { priority: 'asc' }
  });

  console.log('📊 All STT Providers:\n');
  providers.forEach(p => {
    console.log(`${p.priority}. ${p.displayName}`);
    console.log(`   Provider: ${p.providerName}`);
    console.log(`   Endpoint: ${p.apiEndpoint || 'N/A'}:${p.port || 'N/A'}`);
    console.log(`   Active: ${p.isActive ? '✅' : '❌'}`);
    console.log(`   Config:`, JSON.stringify(p.configJson, null, 2));
    console.log('---\n');
  });

  console.log('✅ OpenAI Whisper fully configured with:');
  console.log('  - Model: whisper-1');
  console.log('  - Language: Swedish (sv)');
  console.log('  - Response format: verbose_json (with timestamps)');
  console.log('  - Temperature: 0.0 (deterministic)');
  console.log('  - Timestamp granularity: word-level');
  console.log('  - Prompt: Clinic-specific Swedish medical terminology');

  await prisma.$disconnect();
}

main().catch(console.error);
