#!/bin/sh

# Start cleanup process in background
node scripts/cleanup.js &

# Start SMTP server in background
node lib/smtp-server.js &

# Start Next.js application
npm start
