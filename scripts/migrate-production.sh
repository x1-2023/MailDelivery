#!/bin/bash

# Migration script for production server
# Run this AFTER deploying new code to migrate temp_emails data

echo "🔄 Starting temp_emails migration on production server..."
echo "📍 Location: /var/www/opentrashmail/data/"

cd /var/www/opentrashmail

# Run migration
NODE_ENV=production node scripts/migrate-temp-emails.js

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo "🔄 Restarting docker container..."
    docker-compose restart
    echo "✅ Done!"
else
    echo "❌ Migration failed!"
    exit 1
fi
