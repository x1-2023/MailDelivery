#!/bin/bash

# Quick Update Script (No Maintenance Mode)
# Pull latest image and restart container

CONTAINER_NAME="privatemaildelivery"
IMAGE_NAME="nodegenius/mailsystem:latest"

echo "Pulling latest image..."
docker pull $IMAGE_NAME

echo "Stopping container..."
docker stop $CONTAINER_NAME

echo "Removing old container..."
docker rm $CONTAINER_NAME

echo "Starting new container..."
docker run -d --restart=unless-stopped --name $CONTAINER_NAME \
  -e "DOMAINS=0xf5.site" \
  -e "ADMIN_USERNAME=admin" \
  -e "ADMIN_PASSWORD=Deobiet1" \
  -e "DELETE_OLDER_THAN_DAYS=90" \
  -e "DISCARD_UNKNOWN=false" \
  -p 4000:80 \
  -p 25:25 \
  -v /home/user/maildelivery-data:/var/www/opentrashmail/data \
  $IMAGE_NAME

echo "Done! Checking status..."
sleep 3
docker ps | grep $CONTAINER_NAME
docker logs --tail 20 $CONTAINER_NAME
