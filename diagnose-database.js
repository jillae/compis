import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://woopkutxpgonqtombuqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb3BrdXR4cGdvbnF0b21idXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjgzNTMsImV4cCI6MjA2MTEwNDM1M30.r_qPuFPeWjf-g8czJDrmL-Z8vnYHNsod8vqL01ROMpc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseClinicsData() {
  console.log('🔍 DIAGNOSING SUPABASE DATABASE');
  console.log('================================');
  
  try {
    // Check clinics table
    console.log('\n📊 Checking clinics table...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*');
      
    if (clinicsError) {
      console.error('❌ Error fetching clinics:', clinicsError);
    } else {
      console.log(`✅ Found ${clinics.length} clinic(s):`);
      clinics.forEach(clinic => {
        console.log(`  - ${clinic.name} (ID: ${clinic.id})`);
      });
    }
    
    // Check profiles table
    console.log('\n👤 Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
      
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} profile(s):`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.email} | Role: ${profile.role} | Clinic ID: ${profile.clinic_id}`);
      });
    }
    
    // Check booked_customers table
    console.log('\n📋 Checking booked_customers table...');
    const { data: bookedCustomers, error: bookedError } = await supabase
      .from('booked_customers')
      .select('*');
      
    if (bookedError) {
      console.error('❌ Error fetching booked customers:', bookedError);
    } else {
      console.log(`✅ Found ${bookedCustomers.length} booked customer(s):`);
      bookedCustomers.forEach(customer => {
        console.log(`  - ${customer.name} | Clinic ID: ${customer.clinic_id}`);
      });
    }
    
    // Check clinic_settings table
    console.log('\n⚙️ Checking clinic_settings table...');
    const { data: settings, error: settingsError } = await supabase
      .from('clinic_settings')
      .select('*');
      
    if (settingsError) {
      console.error('❌ Error fetching clinic settings:', settingsError);
    } else {
      console.log(`✅ Found ${settings.length} clinic setting(s):`);
      settings.forEach(setting => {
        console.log(`  - Clinic ID: ${setting.clinic_id} | Active Customers: ${setting.activeCustomers}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

diagnoseClinicsData();