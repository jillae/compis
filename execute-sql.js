import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://woopkutxpgonqtombuqo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb3BrdXR4cGdvbnF0b21idXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjgzNTMsImV4cCI6MjA2MTEwNDM1M30.r_qPuFPeWjf-g8czJDrmL-Z8vnYHNsod8vqL01ROMpc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile() {
  console.log('🛠️ EXECUTING SQL FILE');
  console.log('====================');
  
  try {
    const sql = readFileSync('./create-missing-table.sql', 'utf8');
    console.log('📄 SQL file loaded successfully');
    
    // Note: The anon key might not have permission to execute DDL statements
    // This might fail, but let's try
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n⚠️  This might fail due to RLS permissions.');
      console.log('The SQL needs to be executed by a superuser in the Supabase dashboard.');
    } else {
      console.log('✅ SQL executed successfully:', data);
    }
    
  } catch (error) {
    console.error('💥 Script error:', error.message);
  }
}

executeSqlFile();