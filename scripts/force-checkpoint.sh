#!/bin/bash
##
## Force WAL Checkpoint - Emergency tool
## Use when normal checkpoint fails
##

HOST_DATA_PATH="${HOST_DATA_PATH:-/home/user/maildelivery-data}"

echo ""
echo "🔥 FORCE WAL CHECKPOINT"
echo "================================"
echo ""

echo "📊 Before checkpoint:"
cd "$HOST_DATA_PATH"
ls -lh *.db* | awk '{print $9, $5}'
echo ""

echo "💾 Attempting checkpoint with RESTART mode..."
sqlite3 "$HOST_DATA_PATH/emails.db" "PRAGMA wal_checkpoint(RESTART);"
echo "   Result: $?"
echo ""

echo "💾 Attempting checkpoint with TRUNCATE mode..."  
sqlite3 "$HOST_DATA_PATH/emails.db" "PRAGMA wal_checkpoint(TRUNCATE);"
echo "   Result: $?"
echo ""

echo "🔄 Running VACUUM to reclaim space..."
sqlite3 "$HOST_DATA_PATH/emails.db" "VACUUM;"
echo "   ✅ VACUUM complete"
echo ""

echo "📊 After checkpoint:"
ls -lh *.db* | awk '{print $9, $5}'
echo ""

echo "✅ Done!"
echo ""
