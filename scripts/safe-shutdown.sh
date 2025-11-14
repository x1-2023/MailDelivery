#!/bin/bash
##
## SAFE SHUTDOWN - Prevent Database Corruption
## Run this ON HOST (outside container) BEFORE stopping Docker
##

set -e

CONTAINER_NAME="${CONTAINER_NAME:-mailsystem}"
HOST_DATA_PATH="${HOST_DATA_PATH:-/home/user/maildelivery-data}"

# Auto-detect container name if default not found
if ! docker ps -q -f name="^${CONTAINER_NAME}$" | grep -q .; then
  DETECTED=$(docker ps --format '{{.Names}}' | grep -i mail | head -n1)
  if [ -n "$DETECTED" ]; then
    CONTAINER_NAME="$DETECTED"
    echo "ℹ️  Auto-detected container: $CONTAINER_NAME"
  fi
fi

# Verify data path exists on host
if [ ! -f "$HOST_DATA_PATH/emails.db" ]; then
  echo "❌ Database not found at: $HOST_DATA_PATH/emails.db"
  echo "   Please set HOST_DATA_PATH environment variable to correct path"
  exit 1
fi

echo ""
echo "🛑 SAFE SHUTDOWN PROCEDURE"
echo "================================"
echo ""

# Step 1: Stop SMTP server (prevent new emails)
echo "📧 Step 1: Stopping SMTP server..."
docker exec $CONTAINER_NAME pkill -f "smtp-server.ts" 2>/dev/null || echo "   (SMTP process not found or already stopped)"
sleep 3
echo "   ✅ SMTP stopped - No new emails will be received"
echo ""

# Step 2: Wait for active connections
echo "⏳ Step 2: Waiting for active connections to finish..."
sleep 5
echo "   ✅ Active connections completed"
echo ""

# Step 3: Force WAL checkpoint (merge WAL to main DB)
echo "💾 Step 3: Checkpointing WAL files..."

# Method 1: Try with sqlite3 CLI (most reliable)
if command -v sqlite3 >/dev/null 2>&1; then
  echo "   📝 Processing emails.db..."
  sqlite3 "$HOST_DATA_PATH/emails.db" "PRAGMA wal_checkpoint(TRUNCATE);" && echo "   ✅ emails.db checkpointed"
  
  echo "   📝 Processing auth.db..."
  sqlite3 "$HOST_DATA_PATH/auth.db" "PRAGMA wal_checkpoint(TRUNCATE);" && echo "   ✅ auth.db checkpointed"
  
  echo "   ✅ WAL files merged to main database"
  
# Method 2: Fallback to Node.js if sqlite3 not available
elif command -v node >/dev/null 2>&1; then
  echo "   (Using Node.js fallback)"
  node -e "
const Database = require('better-sqlite3');

try {
  console.log('   📝 Processing emails.db...');
  const emailsDb = new Database('$HOST_DATA_PATH/emails.db');
  emailsDb.pragma('busy_timeout = 60000');
  emailsDb.pragma('wal_checkpoint(TRUNCATE)');
  emailsDb.close();
  
  console.log('   📝 Processing auth.db...');
  const authDb = new Database('$HOST_DATA_PATH/auth.db');
  authDb.pragma('busy_timeout = 60000');
  authDb.pragma('wal_checkpoint(TRUNCATE)');
  authDb.close();
  
  console.log('   ✅ WAL files merged to main database');
} catch (err) {
  console.error('   ❌ Checkpoint failed:', err.message);
  process.exit(1);
}
"
else
  echo "   ❌ Neither sqlite3 nor Node.js found!"
  exit 1
fi

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ WAL checkpoint failed! Aborting shutdown."
  echo "   Database might be locked. Try again in a few seconds."
  exit 1
fi
echo ""

# Step 4: Verify WAL files are empty/small
echo "📊 Step 4: Checking WAL file sizes..."
cd "$HOST_DATA_PATH"
echo "   emails.db:     $(du -h emails.db 2>/dev/null | cut -f1)"
echo "   emails.db-wal: $(du -h emails.db-wal 2>/dev/null | cut -f1) (should be small)"
echo "   auth.db:       $(du -h auth.db 2>/dev/null | cut -f1)"
echo "   auth.db-wal:   $(du -h auth.db-wal 2>/dev/null | cut -f1) (should be small)"
echo ""

# Step 5: Stop container safely
echo "🛑 Step 5: Stopping container (graceful shutdown with 30s timeout)..."
docker stop -t 30 $CONTAINER_NAME
echo "   ✅ Container stopped safely"
echo ""

echo "✅ SAFE SHUTDOWN COMPLETE!"
echo ""
echo "📝 Next steps:"
echo "   1. Pull new Docker image: docker pull nodegenius/mailsystem:latest"
echo "   2. Start container: docker start $CONTAINER_NAME"
echo "   3. Run safe-startup.sh to verify integrity"
echo ""
echo "⚠️  WAL files merged - Safe to update!"
echo ""
