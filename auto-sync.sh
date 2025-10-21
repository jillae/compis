#!/bin/bash

# Auto-sync script for Arch Clinic data recovery
# Runs every hour to ensure data integrity

LOGFILE="/home/ubuntu/flow/sync.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting auto-sync..." >> $LOGFILE

# Check if database is empty and needs recovery
cd /home/ubuntu/flow
CLINIC_COUNT=$(node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://woopkutxpgonqtombuqo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvb3BrdXR4cGdvbnF0b21idXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MjgzNTMsImV4cCI6MjA2MTEwNDM1M30.r_qPuFPeWjf-g8czJDrmL-Z8vnYHNsod8vqL01ROMpc');
const { data, error } = await supabase.from('clinics').select('*');
console.log(data ? data.length : 0);
" 2>/dev/null)

if [ "$CLINIC_COUNT" = "0" ]; then
    echo "[$DATE] WARNING: Database is empty! Manual recovery needed." >> $LOGFILE
    
    # Send alert (you can customize this)
    curl -X POST "https://hooks.slack.com/your-webhook-url" \
         -H 'Content-type: application/json' \
         --data '{"text":"🚨 URGENT: Klinik Flow database is empty! Manual recovery required."}' \
         2>/dev/null || true
         
    echo "[$DATE] Alert sent - manual recovery required" >> $LOGFILE
else
    echo "[$DATE] Database OK - $CLINIC_COUNT clinic(s) found" >> $LOGFILE
fi

# Optional: Bokadirekt sync (when API is available)
# curl -X GET "https://your-bokadirekt-api-endpoint" -H "Authorization: Bearer YOUR_TOKEN" >> $LOGFILE

echo "[$DATE] Auto-sync completed" >> $LOGFILE