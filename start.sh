#!/bin/sh

echo "Starting Mail Delivery System..."

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
