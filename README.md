# MailDelivery System

A modern, full-featured temporary email service with Gmail-like interface and comprehensive admin panel.

## 🎯 Features

- 🎯 **Modern UI**: Gmail/Hotmail-inspired interface
- 📱 **Mobile Responsive**: Optimized for mobile devices  
- 🔄 **Real-time Updates**: Auto-refresh incoming emails
- ⭐ **Email Management**: Star, delete, mark as read
- 🔍 **Search**: Search through emails
- 🗂️ **Organization**: Inbox, starred views
- 🔒 **Privacy**: Automatic email cleanup
- 👨‍💼 **Admin Panel**: Complete system management
- 📊 **Dashboard**: Statistics and monitoring
- 🐳 **Docker Ready**: Easy deployment with Docker
- 📚 **API Documentation**: Complete REST API

## 📧 How Email Reception Works

### **System Architecture:**
\`\`\`
Email sent → MX Record → Your Server:25 → SMTP Server → Parse → Database → Web UI
\`\`\`

### **Built-in SMTP Server:**
- Integrated SMTP server runs on **port 25**
- Listens for incoming emails from external sources
- Automatically parses and stores emails in SQLite database
- Real-time processing and web interface updates

---

## 🚀 Quick Start with Docker

### Option 1: Docker Run (Recommended)

\`\`\`bash
docker run -d \
  --restart=unless-stopped \
  --name privatemaildelivery \
  -e "DOMAINS=yourdomain.com,mail.yourdomain.com" \
  -e "ADMIN_PASSWORD=your_secure_password_here" \
  -e "DELETE_OLDER_THAN_DAYS=7" \
  -e "DISCARD_UNKNOWN=false" \
  -p 4000:80 \
  -p 25:25 \
  -v /opt/maildelivery/data:/var/www/opentrashmail/data \
  maildelivery:latest
\`\`\`

### Option 2: Docker Compose

1. **Clone the repository:**
\`\`\`bash
git clone <repository-url>
cd maildelivery-system
\`\`\`

2. **Edit docker-compose.yml:**
\`\`\`yaml
environment:
  - DOMAINS=yourdomain.com,mail.yourdomain.com
  - ADMIN_PASSWORD=your_secure_password_here
  - DELETE_OLDER_THAN_DAYS=7
  - DISCARD_UNKNOWN=false
\`\`\`

3. **Start the service:**
\`\`\`bash
docker-compose up -d
\`\`\`

---

## 🔧 Complete Setup Requirements

### **1. Server/VPS Requirements:**
\`\`\`bash
# Minimum specifications
- RAM: 512MB+ (1GB+ recommended)
- Storage: 1GB+ (depends on email volume)
- OS: Linux (Ubuntu/CentOS/Debian)
- Network: Unblocked port 25 (critical!)
\`\`\`

⚠️ **Important**: Many residential ISPs and some cloud providers block port 25. Ensure your hosting provider allows SMTP traffic on port 25.

### **2. Domain & DNS Configuration:**

#### **Required DNS Records:**
\`\`\`bash
# MX Record (Mail Exchange) - REQUIRED
yourdomain.com.     IN  MX  10  yourdomain.com.

# A Record (Domain to IP) - REQUIRED  
yourdomain.com.     IN  A   YOUR_SERVER_IP

# Optional: Subdomain for mail service
mail.yourdomain.com. IN  A   YOUR_SERVER_IP
\`\`\`

#### **Cloudflare DNS Setup Guide:**

**Step 1: Access Cloudflare DNS Management**
- Login to your Cloudflare account
- Select your domain
- Go to **DNS** → **Records**

**Step 2: Add A Record**
\`\`\`
Type: A
Name: @ (or your domain name)
IPv4 address: YOUR_SERVER_IP
Proxy status: DNS only (gray cloud)
TTL: Auto
\`\`\`

**Step 3: Add MX Record**
\`\`\`
Type: MX
Name: @ (or your domain name)  
Mail server: yourdomain.com
Priority: 10
TTL: Auto
\`\`\`

**Example Configuration:**
\`\`\`
# A Record
yourdomain.com    A    YOUR_SERVER_IP    (DNS only)

# MX Record  
yourdomain.com    MX   yourdomain.com    Priority: 10
\`\`\`

**Advanced: Wildcard Support (Optional)**
\`\`\`
# A Record for mail subdomain
mail.yourdomain.com    A     YOUR_SERVER_IP    (DNS only)

# Wildcard MX Record (accepts all subdomains)
*.yourdomain.com       MX    mail.yourdomain.com    Priority: 10
\`\`\`

**Step 4: Verify Configuration**
- Wait 5-10 minutes for DNS propagation
- Test with: `dig MX yourdomain.com`
- Expected result: `yourdomain.com. 300 IN MX 10 yourdomain.com.`

⚠️ **Important Cloudflare Notes:**
- Set A record to **DNS only** (gray cloud), not proxied
- MX records cannot be proxied through Cloudflare
- DNS propagation on Cloudflare is usually fast (5-10 minutes)

#### **DNS Verification:**
\`\`\`bash
# Check MX record
dig MX yourdomain.com

# Expected result:
# yourdomain.com. 300 IN MX 10 yourdomain.com.

# Check A record
dig A yourdomain.com
\`\`\`

### **3. Firewall Configuration:**

#### **Ubuntu/Debian:**
\`\`\`bash
sudo ufw allow 25/tcp    # SMTP (Required)
sudo ufw allow 4000/tcp  # Web Interface
sudo ufw allow 22/tcp    # SSH (Management)
sudo ufw enable
\`\`\`

#### **CentOS/RHEL:**
\`\`\`bash
sudo firewall-cmd --permanent --add-port=25/tcp
sudo firewall-cmd --permanent --add-port=4000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
\`\`\`

#### **Check Open Ports:**
\`\`\`bash
# Verify ports are listening
sudo netstat -tlnp | grep :25
sudo netstat -tlnp | grep :4000

# Test SMTP connection externally
telnet yourdomain.com 25
\`\`\`

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DOMAINS` | Comma-separated list of domains to accept emails | `tempmail.local` | ✅ |
| `ADMIN_PASSWORD` | Password for admin panel access | `admin123` | ✅ |
| `DELETE_OLDER_THAN_DAYS` | Days to keep emails before auto-deletion | `1` | ❌ |
| `DISCARD_UNKNOWN` | Discard emails to unknown domains | `false` | ❌ |
| `DATEFORMAT` | Date format for display | `D.M.YYYY HH:mm` | ❌ |

### Port Configuration

- **Port 25**: SMTP server for receiving emails (Required)
- **Port 4000**: Web interface and API (Configurable)

---

## 🌐 Access Points

After starting the container, access these URLs:

- **Main App**: `http://your-server-ip:4000` or `http://yourdomain.com:4000`
- **Admin Panel**: `http://your-server-ip:4000/admin`
- **API Documentation**: `http://your-server-ip:4000/api-docs`

---

## 🌐 Production Setup (Optional)

### **Nginx Reverse Proxy (Optional):**

If you want to use standard ports (80/443) instead of 4000:

\`\`\`nginx
# /etc/nginx/sites-available/maildelivery
server {
    listen 80;
    server_name yourdomain.com mail.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

### **SSL with Let's Encrypt (Optional):**
\`\`\`bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d mail.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

---

## 📧 Testing Email Reception

### **1. Verify DNS Propagation:**
\`\`\`bash
# Check MX record globally
# Visit: https://dnschecker.org/
# Enter your domain and select MX record

# Command line check
nslookup -type=MX yourdomain.com
\`\`\`

### **2. Test SMTP Connection:**
\`\`\`bash
# Test from external server or different network
telnet yourdomain.com 25

# Expected response:
# 220 yourdomain.com ESMTP
\`\`\`

### **3. Send Test Email:**
\`\`\`bash
# From Gmail, Yahoo, Outlook, or any email provider
# Send to: test@yourdomain.com
# Subject: Test Email Reception
# Body: This is a test message for MailDelivery system

# Check logs for processing
docker logs -f privatemaildelivery
\`\`\`

### **4. Verify in Web Interface:**
\`\`\`bash
# Access web interface
http://your-server-ip:4000

# Generate email: test@yourdomain.com
# Check if test email appears in inbox
\`\`\`

---

## 🔍 Troubleshooting

### **Common Issues & Solutions:**

#### **1. Emails Not Received:**

**Check Container Status:**
\`\`\`bash
# Container running?
docker ps | grep maildelivery

# Check logs
docker logs privatemaildelivery

# Check SMTP server
docker exec privatemaildelivery netstat -tlnp | grep :25
\`\`\`

**Verify DNS Configuration:**
\`\`\`bash
# MX record correct?
dig MX yourdomain.com

# Domain resolving to correct IP?
dig A yourdomain.com

# DNS propagation complete? (can take 24-48 hours)
\`\`\`

**Network Issues:**
\`\`\`bash
# Port 25 blocked by ISP/hosting provider?
telnet yourdomain.com 25

# Firewall blocking?
sudo ufw status
sudo iptables -L | grep 25
\`\`\`

#### **2. Admin Panel Not Accessible:**

\`\`\`bash
# Check if container is running
docker ps

# Verify admin password
docker exec privatemaildelivery env | grep ADMIN_PASSWORD

# Check port 4000
sudo netstat -tlnp | grep :4000
\`\`\`

#### **3. High Storage Usage:**

\`\`\`bash
# Check database size
docker exec privatemaildelivery ls -lah /var/www/opentrashmail/data/

# Run manual cleanup
# Access admin panel → Maintenance → Clean Old Emails

# Adjust retention period
docker exec privatemaildelivery env | grep DELETE_OLDER_THAN_DAYS
\`\`\`

#### **4. Performance Issues:**

\`\`\`bash
# Check resource usage
docker stats privatemaildelivery

# Check disk space
df -h

# Monitor email processing
docker logs -f privatemaildelivery | grep "Email saved"
\`\`\`

---

## 👨‍💼 Admin Panel

The admin panel provides comprehensive system management:

### Login
- Access: `http://your-server-ip:4000/admin`
- Password: Set via `ADMIN_PASSWORD` environment variable

### Features
- **Dashboard**: System statistics and monitoring
- **Email Management**: View and manage all email accounts
- **Settings**: Configure auto-cleanup, retention policies
- **Maintenance**: Manual cleanup, database optimization

### Dashboard Metrics
- Total emails received
- Active email accounts
- Today's email count
- Storage usage
- System status

---

## 📚 API Documentation

Complete API documentation is available at `/api-docs` with:

- Interactive endpoint explorer
- Request/response examples
- cURL commands
- JavaScript examples
- Authentication details

### Key API Endpoints

\`\`\`bash
# Generate new email
POST /api/email/generate

# List emails for address
GET /api/email/list?email=test@yourdomain.com

# Get raw email content
GET /api/raw/[email]/[id]

# Delete specific email
DELETE /api/delete/[email]/[id]

# Get email with attachments (JSON)
GET /json/[email]/[id]
\`\`\`

---

## 📊 Monitoring & Maintenance

### **System Health Monitoring:**

\`\`\`bash
# Container status
docker ps
docker stats privatemaildelivery

# Application logs
docker logs -f privatemaildelivery

# Email processing logs
docker logs privatemaildelivery | grep "Email saved"

# Error logs
docker logs privatemaildelivery | grep -i error
\`\`\`

### **Regular Maintenance:**

\`\`\`bash
# Weekly cleanup (automated via cron in container)
# Manual cleanup via admin panel

# Database optimization
# Access admin panel → Maintenance → Optimize Database

# Backup data
tar -czf maildelivery-backup-$(date +%Y%m%d).tar.gz /opt/maildelivery/data/

# Update container
docker pull maildelivery:latest
docker-compose down && docker-compose up -d
\`\`\`

---

## 🔒 Security Considerations

### **Production Security Checklist:**

#### **1. Strong Authentication:**
\`\`\`bash
# Use strong admin password (20+ characters)
ADMIN_PASSWORD="Very_Secure_Random_Password_2024!@#$"

# Regular password rotation
# Update every 90 days
\`\`\`

#### **2. Network Security:**
\`\`\`bash
# Firewall configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH only from trusted IPs
sudo ufw allow 25/tcp    # SMTP
sudo ufw allow 4000/tcp  # Web interface

# Consider fail2ban for brute force protection
sudo apt install fail2ban
\`\`\`

#### **3. Regular Updates:**
\`\`\`bash
# System updates
sudo apt update && sudo apt upgrade

# Container updates
docker pull maildelivery:latest
docker-compose down && docker-compose up -d

# Security monitoring
# Monitor logs for suspicious activity
# Regular security audits
\`\`\`

#### **4. Data Protection:**
\`\`\`bash
# Regular backups
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/maildelivery-$DATE.tar.gz /opt/maildelivery/data/
find /backup -name "maildelivery-*.tar.gz" -mtime +30 -delete

# Encryption at rest (optional)
# Use encrypted storage volumes
\`\`\`

---

## 🔄 Backup & Restore

### **Backup Data:**
\`\`\`bash
# Stop container
docker stop privatemaildelivery

# Backup data directory
tar -czf maildelivery-backup-$(date +%Y%m%d).tar.gz /opt/maildelivery/data/

# Backup with Docker
docker exec privatemaildelivery tar -czf /tmp/backup.tar.gz /var/www/opentrashmail/data
docker cp privatemaildelivery:/tmp/backup.tar.gz ./backup.tar.gz

# Start container
docker start privatemaildelivery
\`\`\`

### **Restore Data:**
\`\`\`bash
# Stop container
docker stop privatemaildelivery

# Restore data
tar -xzf backup.tar.gz -C /opt/maildelivery/

# Start container
docker start privatemaildelivery
\`\`\`

### **Automated Backup Script:**
\`\`\`bash
#!/bin/bash
# /opt/scripts/backup-maildelivery.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/maildelivery"
DATA_DIR="/opt/maildelivery/data"

mkdir -p $BACKUP_DIR

# Create backup
tar -czf $BACKUP_DIR/maildelivery-$DATE.tar.gz $DATA_DIR

# Keep only last 30 days
find $BACKUP_DIR -name "maildelivery-*.tar.gz" -mtime +30 -delete

echo "Backup completed: maildelivery-$DATE.tar.gz"
\`\`\`

\`\`\`bash
# Add to crontab for daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-maildelivery.sh
\`\`\`

---

## 🛠️ Development

### **Local Development:**

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

### **Build Docker Image:**

\`\`\`bash
# Build image
docker build -t maildelivery:latest .

# Run locally
docker run -p 4000:80 -p 25:25 maildelivery:latest

# Test build
docker run --rm -it maildelivery:latest /bin/sh
\`\`\`

---

## 📝 Complete Setup Checklist

### **Pre-Setup Requirements:**
- [ ] ✅ **VPS/Server** with unblocked port 25
- [ ] ✅ **Domain name** registered
- [ ] ✅ **Root/sudo access** to server
- [ ] ✅ **Docker** installed on server

### **DNS Configuration:**
- [ ] ✅ **A Record**: `yourdomain.com → YOUR_SERVER_IP`
- [ ] ✅ **MX Record**: `yourdomain.com → yourdomain.com (priority 10)`
- [ ] ✅ **DNS Propagation**: Verified with `dig MX yourdomain.com`

### **Server Configuration:**
- [ ] ✅ **Firewall**: Ports 25, 4000, 22 opened
- [ ] ✅ **Docker Container**: Running successfully
- [ ] ✅ **Environment Variables**: Properly configured
- [ ] ✅ **Data Volume**: Mounted and writable

### **Testing & Verification:**
- [ ] ✅ **SMTP Connection**: `telnet yourdomain.com 25` successful
- [ ] ✅ **Web Interface**: Accessible at `http://server-ip:4000`
- [ ] ✅ **Admin Panel**: Login successful at `/admin`
- [ ] ✅ **Test Email**: Sent and received successfully
- [ ] ✅ **Email Processing**: Visible in web interface

### **Production Readiness:**
- [ ] ✅ **Strong Admin Password**: Set and documented
- [ ] ✅ **Backup Strategy**: Implemented and tested
- [ ] ✅ **Monitoring**: Logs and metrics reviewed
- [ ] ✅ **Security**: Firewall and access controls configured
- [ ] ✅ **SSL Certificate**: Installed (if using nginx)

---

## 🆘 Getting Help

### **Common Commands:**

\`\`\`bash
# Check system status
docker ps
docker logs privatemaildelivery

# Restart service
docker restart privatemaildelivery

# Update container
docker pull maildelivery:latest
docker-compose down && docker-compose up -d

# Access container shell
docker exec -it privatemaildelivery /bin/sh

# Check email processing
docker logs privatemaildelivery | grep "Email saved"
\`\`\`

### **Support Resources:**
- **Container Logs**: `docker logs privatemaildelivery`
- **Admin Panel**: System status and diagnostics
- **API Documentation**: `/api-docs` for integration help
- **Network Testing**: `telnet yourdomain.com 25`

---

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**⚠️ Important Notes:**
- This is a **temporary email service** - do not use for important communications
- **Port 25 must be unblocked** by your hosting provider for email reception
- **DNS propagation** can take 24-48 hours for MX records
- **Regular backups** are recommended for production use
- **Strong passwords** are essential for admin panel security

**🚀 Quick Start Summary:**
1. Get VPS with unblocked port 25
2. Configure DNS (A + MX records)
3. Run Docker container with your domain
4. Test email reception
5. Access web interface at `:4000`

For detailed troubleshooting and advanced configuration, refer to the sections above.
