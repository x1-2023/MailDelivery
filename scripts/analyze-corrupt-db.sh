#!/bin/bash

echo "🔍 DATABASE CORRUPTION ANALYSIS & RECOVERY"
echo "=========================================="
echo ""

DB_PATH="/var/www/opentrashmail/data/emails.db"
CONTAINER="privatemaildelivery"

# Check if container is running
if ! docker ps | grep -q $CONTAINER; then
  echo "❌ Container $CONTAINER is not running!"
  echo "Start it first: docker start $CONTAINER"
  exit 1
fi

echo "📊 Step 1: Check database integrity..."
docker exec $CONTAINER sqlite3 $DB_PATH "PRAGMA integrity_check;" 2>&1 | head -20

echo ""
echo "📊 Step 2: Check database size and tables..."
docker exec $CONTAINER ls -lh $DB_PATH
echo ""

echo "📊 Step 3: Try to read basic info..."
docker exec $CONTAINER sqlite3 $DB_PATH ".tables" 2>&1

echo ""
echo "📊 Step 4: Count records (if possible)..."
docker exec $CONTAINER sqlite3 $DB_PATH "SELECT COUNT(*) as total_emails FROM emails;" 2>&1 || echo "❌ Cannot count emails"
docker exec $CONTAINER sqlite3 $DB_PATH "SELECT COUNT(*) as total_attachments FROM attachments;" 2>&1 || echo "❌ Cannot count attachments"

echo ""
echo "📊 Step 5: Check WAL files..."
docker exec $CONTAINER ls -lh /var/www/opentrashmail/data/ | grep -E "emails.db|auth.db"

echo ""
echo "🔧 Step 6: Attempt to dump recoverable data..."
echo "This may take a few minutes..."

# Try to dump what we can
docker exec $CONTAINER sqlite3 $DB_PATH ".mode insert" ".output /tmp/dump-partial.sql" ".dump emails" 2>&1 | head -10

if [ $? -eq 0 ]; then
  echo "✅ Partial dump created in container at /tmp/dump-partial.sql"
  echo "Copy it out: docker cp $CONTAINER:/tmp/dump-partial.sql ./emails-dump.sql"
else
  echo "❌ Dump failed"
fi

echo ""
echo "🔧 Step 7: Try PRAGMA recover..."
docker exec $CONTAINER sqlite3 $DB_PATH "PRAGMA wal_checkpoint(FULL);" 2>&1
docker exec $CONTAINER sqlite3 $DB_PATH "PRAGMA integrity_check(100);" 2>&1 | head -30

echo ""
echo "=========================================="
echo "🎯 RECOVERY OPTIONS:"
echo ""
echo "Option 1: Recover to new DB (RECOMMENDED)"
echo "  docker exec $CONTAINER sqlite3 $DB_PATH \".recover\" | docker exec -i $CONTAINER sqlite3 /var/www/opentrashmail/data/emails-recovered.db"
echo ""
echo "Option 2: Export CSV and reimport"
echo "  docker exec $CONTAINER sqlite3 $DB_PATH \".mode csv\" \".output /tmp/emails.csv\" \"SELECT * FROM emails WHERE id NOT NULL;\""
echo ""
echo "Option 3: Use Database_test backup"
echo "  Stop container, replace emails.db with cleaned backup from Database_test/"
echo ""
echo "Option 4: Start fresh (LAST RESORT)"
echo "  Stop container, delete emails.db, restart (will create new DB)"
echo ""
