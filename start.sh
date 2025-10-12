#!/bin/sh

echo "Starting Mail Delivery System..."

# Check if admin user exists, if not create default admin
echo "Checking admin user..."
if [ ! -z "$ADMIN_USERNAME" ] && [ ! -z "$ADMIN_PASSWORD" ]; then
  echo "Creating admin user: $ADMIN_USERNAME"
  node scripts/create-admin.js "$ADMIN_USERNAME" "$ADMIN_PASSWORD" 2>/dev/null || echo "Admin user may already exist or database not ready"
else
  echo "⚠️  ADMIN_USERNAME and ADMIN_PASSWORD not set!"
  echo "   Run: docker exec <container> node scripts/create-admin.js admin yourpassword"
fi

# Start cleanup process in background
echo "Starting cleanup service..."
node scripts/cleanup.js &

# Start SMTP server in background  
echo "Starting SMTP server..."
tsx lib/smtp-server.ts &

# Wait a moment for services to start
sleep 2

# Start Next.js application
echo "Starting web application..."
npm start
