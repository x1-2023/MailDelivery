#!/bin/bash

# Test login API
echo "Testing login API..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST http://localhost:80/api/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Deobiet1"}' \
  -c cookies.txt)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Login successful!"
  echo ""
  echo "Testing admin stats API..."
  curl -s -b cookies.txt http://localhost:80/api/admin/stats | jq '.' 2>/dev/null || echo "Failed"
else
  echo "✗ Login failed"
fi
