import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://woopkutxpgonqtombuqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb3BrdXR4cGdvbnF0b21idXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjgzNTMsImV4cCI6MjA2MTEwNDM1M30.r_qPuFPeWjf-g8czJDrmL-Z8vnYHNsod8vqL01ROMpc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 CHECKING DATABASE SCHEMA');
  console.log('==========================');
  
  try {
    // Check what tables exist by trying to query them
    console.log('\n📊 Attempting to query each table...');
    
    const tablesToCheck = [
      'clinics',
      'profiles', 
      'clinic_settings',
      'booked_customers',
      'services',
      'staff'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ Table '${tableName}' does not exist`);
          } else {
            console.log(`⚠️  Table '${tableName}' exists but error: ${error.message}`);
          }
        } else {
          console.log(`✅ Table '${tableName}' exists and accessible`);
        }
      } catch (e) {
        console.log(`💥 Exception checking '${tableName}':`, e.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Schema check error:', error);
  }
}

checkSchema();