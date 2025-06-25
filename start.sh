#!/bin/sh

# Start cleanup process in background
tsx scripts/cleanup.js &

# Start SMTP server in background
tsx lib/smtp-server.ts &

# Start Next.js application
npm start
