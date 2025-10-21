#!/bin/bash

# Klinik Flow - Database Health Check & Backup Alert
# Runs every hour via cron
# Note: Uses Prisma client for DB access (no pg_dump needed)

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/flow/backups"
LOG_FILE="$BACKUP_DIR/backup.log"
HEALTH_FILE="$BACKUP_DIR/health_check_$TIMESTAMP.json"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database health check..." >> "$LOG_FILE"

# Change to project directory
cd /home/ubuntu/flow/nextjs_space

# Perform health check using Prisma
HEALTH_OUTPUT=$(yarn tsx --require dotenv/config -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  async function healthCheck() {
    try {
      const users = await prisma.user.count();
      const clinics = await prisma.clinic.count();
      const customers = await prisma.customer.count();
      const bookings = await prisma.booking.count();

      const health = {
        timestamp: new Date().toISOString(),
        status: users > 0 ? 'HEALTHY' : 'EMPTY',
        counts: { users, clinics, customers, bookings }
      };

      console.log(JSON.stringify(health, null, 2));
      await prisma.\$disconnect();
      return health.status === 'HEALTHY' ? 0 : 1;
    } catch (error) {
      console.error('Health check failed:', error);
      await prisma.\$disconnect();
      return 2;
    }
  }

  healthCheck().then(code => process.exit(code));
" 2>&1)

HEALTH_EXIT_CODE=$?

# Save health check output
echo "$HEALTH_OUTPUT" > "$HEALTH_FILE"

# Log results
if [ $HEALTH_EXIT_CODE -eq 0 ]; then
    echo "[$(date)] ✅ Database HEALTHY" >> "$LOG_FILE"
    echo "$HEALTH_OUTPUT" >> "$LOG_FILE"
elif [ $HEALTH_EXIT_CODE -eq 1 ]; then
    echo "[$(date)] ⚠️ WARNING: Database appears EMPTY!" >> "$LOG_FILE"
    echo "$HEALTH_OUTPUT" >> "$LOG_FILE"
    # TODO: Send critical alert (email/SMS)
else
    echo "[$(date)] ❌ Health check FAILED" >> "$LOG_FILE"
    echo "$HEALTH_OUTPUT" >> "$LOG_FILE"
    # TODO: Send critical alert
fi

# Clean old health checks (keep last 48 = 2 days)
ls -t "$BACKUP_DIR"/health_check_*.json | tail -n +49 | xargs -r rm 2>/dev/null || true

echo "[$(date)] Health check complete" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

exit $HEALTH_EXIT_CODE
