
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SMS STOP keywords...');

  const keywords = [
    // Swedish
    { keyword: 'STOP', language: 'sv', responseMessage: 'Du är nu avprenumererad från våra SMS-utskick. Svara START för att prenumerera igen.' },
    { keyword: 'STOPP', language: 'sv', responseMessage: 'Du är nu avprenumererad från våra SMS-utskick. Svara START för att prenumerera igen.' },
    { keyword: 'SLUTA', language: 'sv', responseMessage: 'Du är nu avprenumererad från våra SMS-utskick. Svara START för att prenumerera igen.' },
    { keyword: 'AVSLUTA', language: 'sv', responseMessage: 'Du är nu avprenumererad från våra SMS-utskick. Svara START för att prenumerera igen.' },
    { keyword: 'AVPRENUMERERA', language: 'sv', responseMessage: 'Du är nu avprenumererad från våra SMS-utskick. Svara START för att prenumerera igen.' },
    
    // English (for international customers)
    { keyword: 'UNSUBSCRIBE', language: 'en', responseMessage: 'You have been unsubscribed from our SMS messages. Reply START to subscribe again.' },
    { keyword: 'QUIT', language: 'en', responseMessage: 'You have been unsubscribed from our SMS messages. Reply START to subscribe again.' },
    { keyword: 'CANCEL', language: 'en', responseMessage: 'You have been unsubscribed from our SMS messages. Reply START to subscribe again.' },
    { keyword: 'END', language: 'en', responseMessage: 'You have been unsubscribed from our SMS messages. Reply START to subscribe again.' },
  ];

  for (const keyword of keywords) {
    await prisma.sMSStopKeyword.upsert({
      where: { keyword: keyword.keyword },
      update: { ...keyword, isActive: true },
      create: keyword,
    });
    console.log(`✅ Created/updated keyword: ${keyword.keyword}`);
  }

  console.log('\n✅ SMS keywords seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding SMS keywords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
