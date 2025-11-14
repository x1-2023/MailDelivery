#!/bin/bash
##
## Start Maintenance Mode
## Shows maintenance page while you update the main container
##

set -e

PORT=4000
CONTAINER_NAME="${CONTAINER_NAME:-mailsystem}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Auto-detect container name if default not found
if ! docker ps -q -f name="^${CONTAINER_NAME}$" | grep -q .; then
  DETECTED=$(docker ps --format '{{.Names}}' | grep -i mail | head -n1)
  if [ -n "$DETECTED" ]; then
    CONTAINER_NAME="$DETECTED"
  fi
fi
MAINTENANCE_SERVER="$SCRIPT_DIR/maintenance-server.js"
MAINTENANCE_HTML="$SCRIPT_DIR/maintenance.html"
PID_FILE="/tmp/maintenance-server.pid"

echo ""
echo "🔧 STARTING MAINTENANCE MODE"
echo "================================"
echo ""

# Check if files exist
if [ ! -f "$MAINTENANCE_SERVER" ]; then
    echo "❌ maintenance-server.js not found!"
    echo "   Expected: $MAINTENANCE_SERVER"
    exit 1
fi

if [ ! -f "$MAINTENANCE_HTML" ]; then
    echo "❌ maintenance.html not found!"
    echo "   Expected: $MAINTENANCE_HTML"
    exit 1
fi

# Check if maintenance server is already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "⚠️  Maintenance server already running (PID: $OLD_PID)"
        echo ""
        exit 0
    else
        # Stale PID file, remove it
        rm -f "$PID_FILE"
    fi
fi

# Step 1: Stop main container
echo "🛑 Step 1: Stopping main container..."
if docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    docker stop "$CONTAINER_NAME"
    echo "   ✅ Container stopped"
else
    echo "   ℹ️  Container already stopped"
fi
echo ""

# Step 2: Start maintenance server
echo "🚀 Step 2: Starting maintenance server on port $PORT..."
cd "$SCRIPT_DIR"
nohup node maintenance-server.js > /tmp/maintenance-server.log 2>&1 &
MAINTENANCE_PID=$!
echo $MAINTENANCE_PID > "$PID_FILE"

# Wait a moment and check if it started successfully
sleep 2
if ps -p "$MAINTENANCE_PID" > /dev/null 2>&1; then
    echo "   ✅ Maintenance server started (PID: $MAINTENANCE_PID)"
else
    echo "   ❌ Failed to start maintenance server"
    echo "   Check logs: cat /tmp/maintenance-server.log"
    rm -f "$PID_FILE"
    exit 1
fi
echo ""

echo "✅ MAINTENANCE MODE ACTIVE!"
echo ""
echo "📝 Status:"
echo "   • Main container: STOPPED"
echo "   • Maintenance server: RUNNING on port $PORT"
echo "   • PID: $MAINTENANCE_PID"
echo "   • Logs: /tmp/maintenance-server.log"
echo ""
echo "👀 Users will see: Maintenance page"
echo ""
echo "🔄 When ready to go back online:"
echo "   ./stop-maintenance.sh"
echo ""
echo "📊 Monitor logs:"
echo "   tail -f /tmp/maintenance-server.log"
echo ""
