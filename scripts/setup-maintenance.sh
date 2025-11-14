#!/bin/bash
##
## Setup Nginx Maintenance Page
## Run this ONCE on server to configure maintenance page
##

set -e

echo ""
echo "🔧 SETUP MAINTENANCE PAGE"
echo "================================"
echo ""

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed!"
    echo ""
    echo "Install nginx first:"
    echo "  Ubuntu/Debian: sudo apt install nginx -y"
    echo "  CentOS/RHEL:   sudo yum install nginx -y"
    exit 1
fi

echo "✅ Nginx detected"
echo ""

# Create maintenance directory
echo "📁 Creating maintenance directory..."
sudo mkdir -p /var/www/maintenance
sudo chown -R www-data:www-data /var/www/maintenance 2>/dev/null || sudo chown -R nginx:nginx /var/www/maintenance
echo "   ✅ Created /var/www/maintenance"
echo ""

# Copy maintenance.html
echo "📄 Copying maintenance.html..."
if [ ! -f "maintenance.html" ]; then
    echo "❌ maintenance.html not found in current directory!"
    echo "   Please run this script from the project root"
    exit 1
fi
sudo cp maintenance.html /var/www/maintenance/
echo "   ✅ Copied maintenance.html"
echo ""

# Backup existing nginx config
if [ -f "/etc/nginx/sites-available/default" ]; then
    NGINX_CONF="/etc/nginx/sites-available/default"
    NGINX_ENABLED="/etc/nginx/sites-enabled/default"
elif [ -f "/etc/nginx/conf.d/default.conf" ]; then
    NGINX_CONF="/etc/nginx/conf.d/default.conf"
    NGINX_ENABLED=""
else
    NGINX_CONF="/etc/nginx/conf.d/mailsystem.conf"
    NGINX_ENABLED=""
fi

echo "🔧 Nginx config: $NGINX_CONF"
echo ""

# Backup existing config
if [ -f "$NGINX_CONF" ]; then
    echo "💾 Backing up existing config..."
    sudo cp "$NGINX_CONF" "$NGINX_CONF.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   ✅ Backup created"
    echo ""
fi

# Copy nginx config
echo "📝 Installing nginx config..."
sudo cp nginx-maintenance.conf "$NGINX_CONF"
echo "   ✅ Config installed"
echo ""

# Enable site if using sites-available/sites-enabled
if [ -n "$NGINX_ENABLED" ] && [ -d "/etc/nginx/sites-enabled" ]; then
    sudo ln -sf "$NGINX_CONF" "$NGINX_ENABLED" 2>/dev/null || true
fi

# Test nginx config
echo "🧪 Testing nginx config..."
if sudo nginx -t; then
    echo "   ✅ Config is valid"
else
    echo "   ❌ Config test failed!"
    echo "   Restoring backup..."
    sudo mv "$NGINX_CONF.backup."* "$NGINX_CONF" 2>/dev/null || true
    exit 1
fi
echo ""

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx || sudo service nginx reload
echo "   ✅ Nginx reloaded"
echo ""

echo "✅ SETUP COMPLETE!"
echo ""
echo "📝 How it works:"
echo "   • When container is running (port 4000) → Normal website"
echo "   • When container is stopped → Maintenance page"
echo ""
echo "🧪 Test it:"
echo "   1. docker stop mailsystem"
echo "   2. Open http://your-server in browser"
echo "   3. You should see maintenance page"
echo "   4. docker start mailsystem"
echo "   5. Refresh browser → Website is back"
echo ""
echo "🎨 Customize:"
echo "   Edit /var/www/maintenance/maintenance.html"
echo "   No need to reload nginx"
echo ""
