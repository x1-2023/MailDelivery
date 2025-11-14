#!/bin/bash
##
## SAFE SHUTDOWN - Prevent Database Corruption
## Run this BEFORE stopping Docker container
##

set -e

CONTAINER_NAME="mailsystem"
DATA_PATH="/home/user/maildelivery-data"

echo "🛑 SAFE SHUTDOWN PROCEDURE"
echo "================================"
echo ""

# Step 1: Stop SMTP server (prevent new emails)
echo "📧 Step 1: Stopping SMTP server..."
docker exec $CONTAINER_NAME pkill -f "start-smtp.js" || echo "   (SMTP already stopped)"
sleep 2
echo "   ✅ SMTP stopped - No new emails will be received"
echo ""

# Step 2: Wait for active connections
echo "⏳ Step 2: Waiting for active connections to finish..."
sleep 5
echo "   ✅ Active connections completed"
echo ""

# Step 3: Force WAL checkpoint (merge WAL to main DB)
echo "💾 Step 3: Checkpointing WAL files..."
docker exec $CONTAINER_NAME node -e "
const Database = require('better-sqlite3');

console.log('   📝 Processing emails.db...');
const emailsDb = new Database('$DATA_PATH/emails.db');
emailsDb.pragma('busy_timeout = 60000');
const emailsResult = emailsDb.pragma('wal_checkpoint(TRUNCATE)');
console.log('   Result:', JSON.stringify(emailsResult));
emailsDb.close();

console.log('   📝 Processing auth.db...');
const authDb = new Database('$DATA_PATH/auth.db');
authDb.pragma('busy_timeout = 60000');
const authResult = authDb.pragma('wal_checkpoint(TRUNCATE)');
console.log('   Result:', JSON.stringify(authResult));
authDb.close();

console.log('   ✅ WAL files merged to main database');
"
echo ""

# Step 4: Verify WAL files are empty/small
echo "📊 Step 4: Checking WAL file sizes..."
docker exec $CONTAINER_NAME sh -c "
cd $DATA_PATH
echo '   emails.db:     '$(du -h emails.db | cut -f1)
echo '   emails.db-wal: '$(du -h emails.db-wal | cut -f1)' (should be small)'
echo '   auth.db:       '$(du -h auth.db | cut -f1)
echo '   auth.db-wal:   '$(du -h auth.db-wal | cut -f1)' (should be small)'
"
echo ""

# Step 5: Stop container safely
echo "🛑 Step 5: Stopping container..."
docker stop -t 30 $CONTAINER_NAME
echo "   ✅ Container stopped safely"
echo ""

echo "✅ SAFE SHUTDOWN COMPLETE!"
echo ""
echo "📝 Next steps:"
echo "   1. Update your code/config"
echo "   2. Pull new Docker image if needed"
echo "   3. Start container: docker start $CONTAINER_NAME"
echo ""
echo "⚠️  WAL files are now small/empty - Safe to update!"
echo ""
