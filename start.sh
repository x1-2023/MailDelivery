#!/bin/sh

echo "Starting Mail Delivery System..."

# Start cleanup process in background
echo "Starting cleanup service..."
node scripts/cleanup-standalone.js &

# Start SMTP server in background  
echo "Starting SMTP server..."
tsx lib/smtp-server.ts &

# Start Next.js application in background
echo "Starting web application..."
npm start &

# Wait for application and database to be ready
echo "Waiting for database initialization..."
sleep 8

# Additional wait for WAL mode to be fully set up
echo "Waiting for WAL mode initialization..."
sleep 2

# Check if admin user exists, if not create default admin
echo "Checking admin user..."
if [ ! -z "$ADMIN_USERNAME" ] && [ ! -z "$ADMIN_PASSWORD" ]; then
  echo "Creating admin user: $ADMIN_USERNAME"
  # Retry logic with exponential backoff
  max_retries=3
  retry_count=0
  while [ $retry_count -lt $max_retries ]; do
    if node scripts/create-admin.js "$ADMIN_USERNAME" "$ADMIN_PASSWORD"; then
      break
    fi
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $max_retries ]; then
      echo "Retrying in 3 seconds... (attempt $((retry_count + 1))/$max_retries)"
      sleep 3
    else
      echo "⚠️  Admin creation failed after $max_retries attempts. You can create it manually later."
    fi
  done
else
  echo "⚠️  ADMIN_USERNAME and ADMIN_PASSWORD not set!"
  echo "   To create admin user, run:"
  echo "   docker exec <container> node scripts/create-admin.js admin yourpassword"
fi

echo ""
echo "=========================================="
echo "Mail Delivery System is running!"
echo "=========================================="
echo ""
echo "📧 SMTP Server: Port 25"
echo "🌐 Web Interface: Port 80"
echo ""
echo "To reset admin password:"
echo "  docker exec <container> node scripts/reset-admin-password.js admin newpassword"
echo ""

# Keep container running
wait
