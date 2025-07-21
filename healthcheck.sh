#!/bin/sh

# Health check for Docker container
# Checks if Next.js app is responding and SMTP server is listening

# Check web server
curl -f http://localhost:80/api/health >/dev/null 2>&1
WEB_STATUS=$?

# Check SMTP server
nc -z localhost 25 >/dev/null 2>&1  
SMTP_STATUS=$?

if [ $WEB_STATUS -eq 0 ] && [ $SMTP_STATUS -eq 0 ]; then
    echo "All services healthy"
    exit 0
else
    echo "Service health check failed - Web: $WEB_STATUS, SMTP: $SMTP_STATUS"
    exit 1
fi
