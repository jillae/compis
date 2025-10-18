
/**
 * KB-Whisper Configuration Script
 * 
 * This script helps you configure KB-Whisper server connection for Flow.
 * It will prompt for server details and update the database configuration.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface PromptAnswer {
  serverIp: string;
  serverPort: string;
  apiToken: string;
}

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptForConfig(): Promise<PromptAnswer> {
  console.log('\n🔧 KB-Whisper Server Configuration\n');
  console.log('Vänligen ange följande information:\n');

  const serverIp = await question('Server IP-adress (t.ex. 192.168.1.100): ');
  const serverPort = await question('Server Port (standard: 8000): ') || '8000';
  const apiToken = await question('API Token (från /opt/kb-whisper/.env): ');

  return { serverIp, serverPort, apiToken };
}

async function testConnection(serverIp: string, serverPort: string): Promise<boolean> {
  console.log('\n🔍 Testar anslutning till servern...');
  
  try {
    const response = await fetch(`http://${serverIp}:${serverPort}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      console.log('✅ Serveranslutning OK!');
      return true;
    } else {
      console.log(`⚠️  Server svarade med status: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Kunde inte ansluta till servern:', error.message);
    return false;
  }
}

async function updateDatabase(config: PromptAnswer) {
  console.log('\n💾 Uppdaterar databaskonfiguration...');

  const apiEndpoint = `http://${config.serverIp}`;
  const port = parseInt(config.serverPort, 10);

  // Update KB-Whisper Flow-Speak configuration
  await prisma.$executeRaw`
    UPDATE stt_provider_config
    SET 
      api_endpoint = ${apiEndpoint},
      port = ${port},
      config_json = jsonb_set(
        config_json,
        '{api_token}',
        to_jsonb(${config.apiToken}::text)
      ),
      updated_at = NOW()
    WHERE provider_name = 'KB_WHISPER_FLOW_SPEAK'
  `;

  console.log('✅ Databas uppdaterad!');
}

async function verifyConfiguration() {
  console.log('\n📊 Verifierar konfiguration...');

  const providers = await prisma.$queryRaw<any[]>`
    SELECT 
      id, 
      provider_name, 
      display_name, 
      api_endpoint, 
      port, 
      priority_order,
      is_active,
      config_json->>'api_token' as has_token
    FROM stt_provider_config
    WHERE provider_name = 'KB_WHISPER_FLOW_SPEAK'
  `;

  if (providers.length === 0) {
    console.log('❌ KB-Whisper provider hittades inte i databasen!');
    return;
  }

  const provider = providers[0];
  console.log('\n✅ Konfiguration sparad:');
  console.log(`   Provider: ${provider.display_name}`);
  console.log(`   Endpoint: ${provider.api_endpoint}:${provider.port}`);
  console.log(`   Prioritet: #${provider.priority_order}`);
  console.log(`   Status: ${provider.is_active ? '✅ Aktiv' : '❌ Inaktiv'}`);
  console.log(`   API Token: ${provider.has_token ? '✅ Konfigurerad' : '❌ Saknas'}`);
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   KB-Whisper Configuration for Flow       ║');
    console.log('╚════════════════════════════════════════════╝');

    // Prompt for configuration
    const config = await promptForConfig();

    if (!config.serverIp || !config.apiToken) {
      console.log('\n❌ Server IP och API Token måste anges!');
      process.exit(1);
    }

    // Test connection
    const connectionOk = await testConnection(config.serverIp, config.serverPort);
    
    if (!connectionOk) {
      const continueAnyway = await question('\n⚠️  Anslutningen misslyckades. Vill du fortsätta ändå? (ja/nej): ');
      if (continueAnyway.toLowerCase() !== 'ja') {
        console.log('\n❌ Avbryter konfiguration.');
        process.exit(1);
      }
    }

    // Update database
    await updateDatabase(config);

    // Verify
    await verifyConfiguration();

    console.log('\n🎉 Konfiguration klar!');
    console.log('\nNästa steg:');
    console.log('1. Logga in som Superadmin i Flow');
    console.log('2. Gå till Superadmin → STT Providers');
    console.log('3. Klicka "Test" på KB-Whisper Flow-Speak');
    console.log('4. Verifiera att transkribering fungerar\n');

  } catch (error: any) {
    console.error('\n❌ Ett fel uppstod:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
