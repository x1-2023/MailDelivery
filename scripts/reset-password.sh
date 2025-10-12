#!/bin/sh

# Quick script to reset admin password in Docker container
# Usage: ./reset-password.sh <container-name> <username> <new-password>

CONTAINER=${1:-privatemaildelivery}
USERNAME=${2:-admin}
PASSWORD=$3

if [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <container-name> <username> <new-password>"
  echo "Example: $0 privatemaildelivery admin NewPassword123"
  echo ""
  echo "Current container: $CONTAINER"
  echo "Current username: $USERNAME"
  echo ""
  read -p "Enter new password: " PASSWORD
fi

if [ -z "$PASSWORD" ]; then
  echo "❌ Password cannot be empty"
  exit 1
fi

echo "Resetting password for user '$USERNAME' in container '$CONTAINER'..."
docker exec $CONTAINER node scripts/reset-admin-password.js "$USERNAME" "$PASSWORD"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Password reset successful!"
  echo ""
  echo "You can now login with:"
  echo "  Username: $USERNAME"
  echo "  Password: $PASSWORD"
else
  echo ""
  echo "❌ Password reset failed"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check if container is running: docker ps | grep $CONTAINER"
  echo "  2. Check if database exists: docker exec $CONTAINER ls -la data/"
  echo "  3. Try listing users: docker exec $CONTAINER node scripts/list-users.js"
fi
