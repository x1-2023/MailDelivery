#!/bin/bash

# Update Container Script
# Run this script on the HOST to update to latest Docker image

set -e

CONTAINER_NAME="privatemaildelivery"
IMAGE_NAME="nodegenius/mailsystem:latest"
DATA_PATH="/home/user/maildelivery-data"

echo "========================================="
echo "Container Update Script"
echo "========================================="
echo ""

# Step 1: Stop maintenance mode if running
echo "Step 1: Checking for maintenance mode..."
if docker ps | grep -q "mailsystem-maintenance"; then
    echo "✓ Maintenance mode detected, stopping..."
    docker stop mailsystem-maintenance 2>/dev/null || true
    docker rm mailsystem-maintenance 2>/dev/null || true
    echo "✓ Maintenance mode stopped"
else
    echo "✓ No maintenance mode running"
fi

# Step 2: Safe shutdown of current container
echo ""
echo "Step 2: Safe shutdown of current container..."
if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✓ Container is running, performing safe shutdown..."
    
    # Stop SMTP server gracefully
    echo "  - Stopping SMTP server..."
    docker exec $CONTAINER_NAME pkill -SIGTERM -f "smtp-server" 2>/dev/null || true
    sleep 3
    
    # Checkpoint WAL
    echo "  - Checkpointing database WAL..."
    if [ -f "$DATA_PATH/emails.db" ]; then
        sqlite3 "$DATA_PATH/emails.db" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || echo "  ! WAL checkpoint failed (will delete WAL files manually)"
    fi
    
    # Stop container
    echo "  - Stopping container..."
    docker stop $CONTAINER_NAME
    
    # Delete WAL files (safe after container stop)
    echo "  - Cleaning up WAL files..."
    rm -f "$DATA_PATH/emails.db-wal" "$DATA_PATH/emails.db-shm" 2>/dev/null || true
    
    echo "✓ Container stopped safely"
else
    echo "✓ Container not running"
fi

# Step 3: Remove old container
echo ""
echo "Step 3: Removing old container..."
docker rm $CONTAINER_NAME 2>/dev/null || echo "✓ Container already removed"

# Step 4: Pull latest image
echo ""
echo "Step 4: Pulling latest image..."
docker pull $IMAGE_NAME

# Step 5: Start new container
echo ""
echo "Step 5: Starting new container..."
docker run -d --restart=unless-stopped --name $CONTAINER_NAME \
  -e "DOMAINS=0xf5.site" \
  -e "ADMIN_USERNAME=admin" \
  -e "ADMIN_PASSWORD=Deobiet1" \
  -e "DELETE_OLDER_THAN_DAYS=90" \
  -e "DISCARD_UNKNOWN=false" \
  -p 4000:80 \
  -p 25:25 \
  -v $DATA_PATH:/var/www/opentrashmail/data \
  $IMAGE_NAME

# Step 6: Verify startup
echo ""
echo "Step 6: Verifying startup..."
sleep 5

if docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✓ Container is running"
    
    # Check database integrity
    echo ""
    echo "Step 7: Checking database integrity..."
    if [ -f "$DATA_PATH/emails.db" ]; then
        INTEGRITY=$(sqlite3 "$DATA_PATH/emails.db" "PRAGMA integrity_check;" 2>/dev/null || echo "error")
        if [ "$INTEGRITY" = "ok" ]; then
            echo "✓ Database integrity: OK"
        else
            echo "⚠ Database integrity check failed: $INTEGRITY"
        fi
    fi
    
    echo ""
    echo "========================================="
    echo "✅ Update completed successfully!"
    echo "========================================="
    echo ""
    echo "Container logs:"
    docker logs --tail 20 $CONTAINER_NAME
else
    echo "❌ Container failed to start!"
    echo ""
    echo "Checking logs:"
    docker logs $CONTAINER_NAME 2>&1 || echo "No logs available"
    exit 1
fi
