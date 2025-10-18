
/**
 * Configure KB-Whisper Production Server
 * 
 * This script configures the KB-Whisper Flow-Speak provider with production server details.
 * Server: 69.62.126.30:5000
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   KB-Whisper Production Configuration     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('🔧 Konfigurerar KB-Whisper Flow-Speak...\n');

  // Update KB-Whisper configuration
  await prisma.$executeRaw`
    UPDATE stt_provider_config
    SET 
      api_endpoint = 'http://69.62.126.30',
      port = 5000,
      config_json = jsonb_build_object(
        'language', 'sv',
        'model', 'kb-whisper-medium-highest-quality',
        'beam_size', 5,
        'best_of', 5
      ),
      updated_at = NOW()
    WHERE provider_name = 'KB_WHISPER_FLOW_SPEAK'
  `;

  console.log('✅ Databas uppdaterad!\n');

  // Verify configuration
  const providers = await prisma.$queryRaw<any[]>`
    SELECT 
      id,
      provider_name,
      display_name,
      api_endpoint,
      port,
      priority_order,
      is_active,
      config_json
    FROM stt_provider_config
    WHERE provider_name = 'KB_WHISPER_FLOW_SPEAK'
  `;

  if (providers.length === 0) {
    console.log('❌ KB-Whisper provider hittades inte i databasen!');
    process.exit(1);
  }

  const provider = providers[0];
  
  console.log('📊 Verifierad konfiguration:\n');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log(`│ Provider: ${provider.display_name.padEnd(38)} │`);
  console.log(`│ Endpoint: ${(provider.api_endpoint + ':' + provider.port).padEnd(38)} │`);
  console.log(`│ Modell: ${provider.config_json.model.padEnd(40)} │`);
  console.log(`│ Språk: ${provider.config_json.language.padEnd(42)} │`);
  console.log(`│ Beam Size: ${String(provider.config_json.beam_size).padEnd(39)} │`);
  console.log(`│ Best Of: ${String(provider.config_json.best_of).padEnd(41)} │`);
  console.log(`│ Prioritet: #${provider.priority_order.toString().padEnd(39)} │`);
  console.log(`│ Status: ${(provider.is_active ? '✅ Aktiv' : '❌ Inaktiv').padEnd(42)} │`);
  console.log('└─────────────────────────────────────────────────────┘\n');

  // Test health endpoint
  console.log('🔍 Testar serveranslutning...');
  try {
    const response = await fetch(`${provider.api_endpoint}:${provider.port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server health check OK!');
      console.log(`   Modell: ${data.model}`);
      console.log(`   Status: ${data.status}\n`);
    } else {
      console.log(`⚠️  Server svarade med status: ${response.status}\n`);
    }
  } catch (error: any) {
    console.error('❌ Kunde inte ansluta till servern:', error.message);
    console.log('⚠️  Kontrollera att servern är tillgänglig och att firewall tillåter anslutningar.\n');
  }

  console.log('🎉 Konfiguration klar!');
  console.log('\n📝 Nästa steg:');
  console.log('   1. Logga in som Superadmin i Flow');
  console.log('   2. Gå till Superadmin → STT Providers');
  console.log('   3. Klicka "Test" på KB-Whisper Flow-Speak');
  console.log('   4. Verifiera att transkribering fungerar med KB-Whisper\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Ett fel uppstod:', error);
  process.exit(1);
});
