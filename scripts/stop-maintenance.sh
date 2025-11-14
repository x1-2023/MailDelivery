#!/bin/bash
##
## Stop Maintenance Mode
## Stops maintenance server and starts main container
##

set -e

CONTAINER_NAME="${CONTAINER_NAME:-mailsystem}"
PID_FILE="/tmp/maintenance-server.pid"

# Auto-detect container name if default not found
if ! docker ps -a -q -f name="^${CONTAINER_NAME}$" | grep -q .; then
  DETECTED=$(docker ps -a --format '{{.Names}}' | grep -i mail | head -n1)
  if [ -n "$DETECTED" ]; then
    CONTAINER_NAME="$DETECTED"
  fi
fi

echo ""
echo "🚀 STOPPING MAINTENANCE MODE"
echo "================================"
echo ""

# Step 1: Stop maintenance server
echo "🛑 Step 1: Stopping maintenance server..."
if [ -f "$PID_FILE" ]; then
    MAINTENANCE_PID=$(cat "$PID_FILE")
    if ps -p "$MAINTENANCE_PID" > /dev/null 2>&1; then
        kill "$MAINTENANCE_PID" 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if ps -p "$MAINTENANCE_PID" > /dev/null 2>&1; then
            kill -9 "$MAINTENANCE_PID" 2>/dev/null || true
        fi
        
        echo "   ✅ Maintenance server stopped"
    else
        echo "   ℹ️  Maintenance server not running"
    fi
    rm -f "$PID_FILE"
else
    echo "   ℹ️  No PID file found"
fi
echo ""

# Step 2: Start main container
echo "🚀 Step 2: Starting main container..."
if docker ps -a -q -f name="$CONTAINER_NAME" | grep -q .; then
    docker start "$CONTAINER_NAME"
    echo "   ✅ Container started"
    
    # Wait for container to be ready
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 10
    echo "   ✅ Services should be ready"
else
    echo "   ❌ Container '$CONTAINER_NAME' not found!"
    exit 1
fi
echo ""

echo "✅ BACK ONLINE!"
echo ""
echo "📝 Status:"
echo "   • Maintenance server: STOPPED"
echo "   • Main container: RUNNING"
echo ""
echo "🌐 Website is now live!"
echo ""
