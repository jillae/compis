import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from the correct path
const envPath = resolve(__dirname, '.env');
dotenv.config({ path: envPath });

async function testBokadirektAPI() {
  const apiKey = process.env.BOKADIREKT_API_KEY;
  const baseUrl = 'https://external.api.portal.bokadirekt.se/api/v1';
  
  console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  console.log('🌐 Base URL:', baseUrl);
  console.log('');
  
  const endpoints = [
    '/services',
    '/resources',
    '/customers',
    '/bookings'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint}`;
    
    try {
      console.log(`📡 Testing ${endpoint}...`);
      console.log(`   URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey || '',
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS! Got ${Array.isArray(data) ? data.length : 'N/A'} items`);
        console.log(`   Sample data:`, JSON.stringify(data).substring(0, 200));
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Exception:`, error);
      console.log('');
    }
  }
}

testBokadirektAPI().then(() => {
  console.log('✅ Test complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
