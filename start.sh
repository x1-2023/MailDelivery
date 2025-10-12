#!/bin/sh

echo "Starting Mail Delivery System..."

# Start SMTP server in background  
echo "Starting SMTP server..."
tsx lib/smtp-server.ts &

# Start Next.js application in background
echo "Starting web application..."
npm start &

# Wait for Next.js to be fully ready
echo "Waiting for Next.js to be ready..."
sleep 10

# Now start cleanup after Next.js has initialized database
echo "Starting cleanup service..."
node scripts/cleanup-standalone.js &

# Additional wait for services to stabilize
echo "Waiting for services to stabilize..."
sleep 3

# Create admin user in background (non-blocking)
if [ ! -z "$ADMIN_USERNAME" ] && [ ! -z "$ADMIN_PASSWORD" ]; then
  echo "Scheduling admin user creation..."
  (
    # Wait a bit more for services to fully stabilize
    sleep 5
    echo "Creating admin user: $ADMIN_USERNAME"
    if node scripts/create-admin.js "$ADMIN_USERNAME" "$ADMIN_PASSWORD" 2>&1; then
      echo "✅ Admin user created successfully!"
    else
      echo ""
      echo "⚠️  Admin creation failed. Create it manually with:"
      echo "   docker exec <container> node scripts/create-admin.js $ADMIN_USERNAME yourpassword"
    fi
  ) &
else
  echo "ℹ️  ADMIN_USERNAME and ADMIN_PASSWORD not set"
  echo "   To create admin user later, run:"
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
echo "🔧 Setup & Management:"
echo "  • First time setup: http://localhost:80/setup"
echo "  • Admin panel: http://localhost:80/admin"
echo ""
echo "🛠️  Manual admin creation:"
echo "  docker exec <container> node scripts/create-admin.js admin yourpassword"
echo ""
echo "🔑 Reset admin password:"
echo "  docker exec <container> node scripts/reset-admin-password.js admin newpassword"
echo ""

# Keep container running
wait
