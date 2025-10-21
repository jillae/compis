import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = 'https://woopkutxpgonqtombuqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb3BrdXR4cGdvbnF0b21idXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjgzNTMsImV4cCI6MjA2MTEwNDM1M30.r_qPuFPeWjf-g8czJDrmL-Z8vnYHNsod8vqL01ROMpc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recoveryWithCorrectFormat() {
  console.log('🚨 STARTING FIXED DATABASE RECOVERY');
  console.log('==================================');
  
  const clinicId = randomUUID();
  const profileId = randomUUID();
  
  console.log(`🔑 Using Clinic ID: ${clinicId}`);
  console.log(`🔑 Using Profile ID: ${profileId}`);
  
  try {
    // Step 1: Create Arch Clinic with proper UUID
    console.log('\n📋 Step 1: Creating Arch Clinic...');
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        id: clinicId,
        name: 'Arch Clinic',
        contact_person: 'Sanna Holmgren', 
        contact_email: 'sanna@archclinic.se',
        organization_number: '556677-8899'
      })
      .select();
      
    if (clinicError) {
      console.error('❌ Error creating Arch Clinic:', clinicError);
      // Try with different column names
      console.log('🔄 Trying with minimal data...');
      const { data: clinic2, error: clinicError2 } = await supabase
        .from('clinics')
        .insert({
          name: 'Arch Clinic'
        })
        .select();
        
      if (clinicError2) {
        console.error('❌ Still failed:', clinicError2);
      } else {
        console.log('✅ Clinic created with minimal data:', clinic2);
      }
    } else {
      console.log('✅ Arch Clinic created successfully:', clinic);
    }
    
    // Step 2: Check what columns exist in clinic_settings
    console.log('\n⚙️ Step 2: Testing clinic_settings columns...');
    const { data: settings, error: settingsError } = await supabase
      .from('clinic_settings')
      .insert({
        clinic_id: clinicId,
        // Try basic columns that likely exist
        cost_per_hour: 1200,
        weekly_operating_hours: 40
      })
      .select();
      
    if (settingsError) {
      console.error('❌ Error with clinic settings:', settingsError);
      console.log('ℹ️  This tells us about the expected column format');
    } else {
      console.log('✅ Clinic settings created:', settings);
    }
    
    // Step 3: Try to query existing table structures
    console.log('\n🔍 Step 3: Examining existing data...');
    const { data: existingClinics } = await supabase
      .from('clinics')
      .select('*')
      .limit(1);
      
    const { data: existingSettings } = await supabase
      .from('clinic_settings') 
      .select('*')
      .limit(1);
      
    console.log('📊 Sample clinic structure:', existingClinics?.[0] || 'No existing clinics');
    console.log('📊 Sample settings structure:', existingSettings?.[0] || 'No existing settings');
    
  } catch (error) {
    console.error('💥 Recovery error:', error);
  }
}

recoveryWithCorrectFormat();