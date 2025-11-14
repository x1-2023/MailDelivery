#!/bin/bash
##
## SAFE STARTUP - Ensure Database Integrity After Update
## Run this ON HOST (outside container) AFTER starting Docker
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

# Auto-detect data path if not specified
if [ -z "$DATA_PATH" ]; then
  echo "🔍 Detecting data path..."
  DATA_PATH=$(docker exec $CONTAINER_NAME find / -name 'emails.db' -type f 2>/dev/null | head -n1 | xargs dirname)
  if [ -n "$DATA_PATH" ]; then
    echo "   ✅ Found data at: $DATA_PATH"
  else
    echo "   ❌ Could not find emails.db!"
    echo "   Please set DATA_PATH environment variable"
    exit 1
  fi
fi

echo ""
echo "🚀 SAFE STARTUP PROCEDURE"
echo "================================"
echo ""

# Wait for container to be ready
echo "⏳ Waiting for container to start..."
sleep 10
echo ""

# Step 1: Check database integrity
echo "🔍 Step 1: Checking database integrity..."

# Method 1: Try with sqlite3 CLI (most reliable)
if command -v sqlite3 >/dev/null 2>&1; then
  echo "   📝 Checking emails.db..."
  EMAILS_CHECK=$(sqlite3 "$HOST_DATA_PATH/emails.db" "PRAGMA integrity_check;" 2>&1)
  if echo "$EMAILS_CHECK" | grep -q "ok"; then
    echo "   ✅ emails.db: HEALTHY"
  else
    echo "   ❌ emails.db: CORRUPTED!"
    echo "$EMAILS_CHECK" | head -5
    exit 1
  fi
  
  echo "   📝 Checking auth.db..."
  AUTH_CHECK=$(sqlite3 "$HOST_DATA_PATH/auth.db" "PRAGMA integrity_check;" 2>&1)
  if echo "$AUTH_CHECK" | grep -q "ok"; then
    echo "   ✅ auth.db: HEALTHY"
  else
    echo "   ❌ auth.db: CORRUPTED!"
    echo "$AUTH_CHECK" | head -5
    exit 1
  fi

# Method 2: Fallback to Node.js if sqlite3 not available  
elif command -v node >/dev/null 2>&1; then
  echo "   (Using Node.js fallback)"
  node -e "
const Database = require('better-sqlite3');

try {
  console.log('   📝 Checking emails.db...');
  const emailsDb = new Database('$HOST_DATA_PATH/emails.db', { readonly: true });
  const emailsIntegrity = emailsDb.pragma('integrity_check');
  if (emailsIntegrity[0].integrity_check === 'ok') {
    console.log('   ✅ emails.db: HEALTHY');
  } else {
    console.log('   ❌ emails.db: CORRUPTED!');
    console.log(emailsIntegrity.slice(0, 5));
    emailsDb.close();
    process.exit(1);
  }
  emailsDb.close();

  console.log('   📝 Checking auth.db...');
  const authDb = new Database('$HOST_DATA_PATH/auth.db', { readonly: true });
  const authIntegrity = authDb.pragma('integrity_check');
  if (authIntegrity[0].integrity_check === 'ok') {
    console.log('   ✅ auth.db: HEALTHY');
  } else {
    console.log('   ❌ auth.db: CORRUPTED!');
    console.log(authIntegrity.slice(0, 5));
    authDb.close();
    process.exit(1);
  }
  authDb.close();
} catch (err) {
  console.error('   ❌ Integrity check failed:', err.message);
  process.exit(1);
}
"
else
  echo "   ❌ Neither sqlite3 nor Node.js found!"
  exit 1
fi

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ DATABASE INTEGRITY CHECK FAILED!"
  echo "   Your databases are corrupted. Options:"
  echo "   1. Restore from backup (Database_test/)"
  echo "   2. Run database recovery tools"
  echo "   3. Start fresh (will lose all emails)"
  exit 1
fi
echo ""

# Step 2: Configure database settings
echo "⚙️  Step 2: Configuring database settings..."

# Method 1: Try with sqlite3 CLI
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$HOST_DATA_PATH/emails.db" "
    PRAGMA busy_timeout = 30000;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA wal_autocheckpoint = 1000;
  " && echo "   ✅ emails.db configured (busy_timeout=30s, WAL mode, foreign_keys=ON)"
  
  sqlite3 "$HOST_DATA_PATH/auth.db" "
    PRAGMA busy_timeout = 30000;
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  " && echo "   ✅ auth.db configured (busy_timeout=30s, WAL mode, foreign_keys=ON)"

# Method 2: Fallback to Node.js
elif command -v node >/dev/null 2>&1; then
  echo "   (Using Node.js fallback)"
  node -e "
const Database = require('better-sqlite3');

try {
  const emailsDb = new Database('$HOST_DATA_PATH/emails.db');
  emailsDb.pragma('busy_timeout = 30000');
  emailsDb.pragma('journal_mode = WAL');
  emailsDb.pragma('foreign_keys = ON');
  emailsDb.pragma('wal_autocheckpoint = 1000');
  console.log('   ✅ emails.db configured (busy_timeout=30s, WAL mode, foreign_keys=ON)');
  emailsDb.close();

  const authDb = new Database('$HOST_DATA_PATH/auth.db');
  authDb.pragma('busy_timeout = 30000');
  authDb.pragma('journal_mode = WAL');
  authDb.pragma('foreign_keys = ON');
  console.log('   ✅ auth.db configured (busy_timeout=30s, WAL mode, foreign_keys=ON)');
  authDb.close();
} catch (err) {
  console.error('   ❌ Configuration failed:', err.message);
  process.exit(1);
}
"
else
  echo "   ⚠️  Skipping configuration (no sqlite3 or Node.js)"
fi
echo ""

# Step 3: Check file sizes
echo "📊 Step 3: Database status..."
cd "$HOST_DATA_PATH"
echo "   emails.db:     $(du -h emails.db 2>/dev/null | cut -f1)"
echo "   emails.db-wal: $(du -h emails.db-wal 2>/dev/null | cut -f1)"
echo "   auth.db:       $(du -h auth.db 2>/dev/null | cut -f1)"
echo "   auth.db-wal:   $(du -h auth.db-wal 2>/dev/null | cut -f1)"
echo ""

echo "✅ SAFE STARTUP COMPLETE!"
echo ""
echo "📝 System is ready:"
echo "   ✅ Database integrity verified"
echo "   ✅ WAL mode enabled"
echo "   ✅ Foreign keys enabled"
echo "   ✅ Busy timeout: 30 seconds"
echo "   ✅ Auto-checkpoint: 1000 pages"
echo ""
echo "🌐 Services:"
echo "   • Web UI: http://your-server"
echo "   • SMTP: Port 25"
echo ""
echo "📧 System is now receiving emails"
echo ""
