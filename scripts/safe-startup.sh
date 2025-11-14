#!/bin/bash
##
## SAFE STARTUP - Ensure Database Integrity After Update
## Run this AFTER starting Docker container
##

set -e

CONTAINER_NAME="mailsystem"
DATA_PATH="/home/user/maildelivery-data"

echo "🚀 SAFE STARTUP PROCEDURE"
echo "================================"
echo ""

# Wait for container to be ready
echo "⏳ Waiting for container to start..."
sleep 5

# Step 1: Check database integrity
echo "🔍 Step 1: Checking database integrity..."
docker exec $CONTAINER_NAME node -e "
const Database = require('better-sqlite3');

console.log('   📝 Checking emails.db...');
const emailsDb = new Database('$DATA_PATH/emails.db');
const emailsIntegrity = emailsDb.pragma('integrity_check');
if (emailsIntegrity[0].integrity_check === 'ok') {
  console.log('   ✅ emails.db: OK');
} else {
  console.log('   ❌ emails.db: CORRUPTED!');
  console.log(emailsIntegrity);
  process.exit(1);
}
emailsDb.close();

console.log('   📝 Checking auth.db...');
const authDb = new Database('$DATA_PATH/auth.db');
const authIntegrity = authDb.pragma('integrity_check');
if (authIntegrity[0].integrity_check === 'ok') {
  console.log('   ✅ auth.db: OK');
} else {
  console.log('   ❌ auth.db: CORRUPTED!');
  console.log(authIntegrity);
  process.exit(1);
}
authDb.close();
"
echo ""

# Step 2: Configure database settings
echo "⚙️  Step 2: Configuring database settings..."
docker exec $CONTAINER_NAME node -e "
const Database = require('better-sqlite3');

const emailsDb = new Database('$DATA_PATH/emails.db');
emailsDb.pragma('busy_timeout = 30000');
emailsDb.pragma('journal_mode = WAL');
emailsDb.pragma('foreign_keys = ON');
emailsDb.pragma('wal_autocheckpoint = 1000');
console.log('   ✅ emails.db configured');
emailsDb.close();

const authDb = new Database('$DATA_PATH/auth.db');
authDb.pragma('busy_timeout = 30000');
authDb.pragma('journal_mode = WAL');
authDb.pragma('foreign_keys = ON');
console.log('   ✅ auth.db configured');
authDb.close();
"
echo ""

# Step 3: Check file sizes
echo "📊 Step 3: Database status..."
docker exec $CONTAINER_NAME sh -c "
cd $DATA_PATH
echo '   emails.db:     '$(du -h emails.db | cut -f1)
echo '   emails.db-wal: '$(du -h emails.db-wal | cut -f1)
echo '   auth.db:       '$(du -h auth.db | cut -f1)
echo '   auth.db-wal:   '$(du -h auth.db-wal | cut -f1)
"
echo ""

echo "✅ SAFE STARTUP COMPLETE!"
echo ""
echo "📝 System is ready to receive emails"
echo "   - Database integrity: OK"
echo "   - WAL mode: Enabled"
echo "   - Foreign keys: Enabled"
echo "   - Busy timeout: 30s"
echo ""
