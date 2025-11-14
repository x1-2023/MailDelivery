# Multi-Domain Setup Guide

## Overview
The MailSystem now supports multiple domains for receiving emails. Users can see all available domains and select which domain to use when creating custom email addresses.

## Features
- ✅ Multiple domains via `DOMAINS` environment variable
- ✅ Domain selector UI for custom emails
- ✅ Available domains banner showing all configured domains
- ✅ API endpoint `/api/domains` to expose domains to frontend
- ✅ Random email generation uses first domain by default

## How to Add Multiple Domains

### 1. Stop and Remove Current Container
```bash
docker stop privatemaildelivery
docker rm privatemaildelivery
```

### 2. Run with Multiple Domains
```bash
docker run -d --restart=unless-stopped --name privatemaildelivery \
  -e "DOMAINS=0xf5.site,domain2.com,domain3.net" \
  -e "ADMIN_USERNAME=admin" \
  -e "ADMIN_PASSWORD=Deobiet1" \
  -e "DELETE_OLDER_THAN_DAYS=90" \
  -e "DISCARD_UNKNOWN=false" \
  -p 4000:80 \
  -p 25:25 \
  -v /home/user/maildelivery-data:/var/www/opentrashmail/data \
  nodegenius/mailsystem:latest
```

**Important:** Separate domains with commas (no spaces)

### 3. Configure DNS Records
For each domain, add MX records pointing to your server:

```
# Example DNS Records
domain2.com.        MX 10 mail.domain2.com.
domain3.net.        MX 10 mail.domain3.net.

# A record pointing to your server IP
mail.domain2.com.   A  YOUR_SERVER_IP
mail.domain3.net.   A  YOUR_SERVER_IP
```

### 4. Verify Configuration
Check if domains are loaded correctly:
```bash
docker logs privatemaildelivery | grep DOMAINS
```

## User Interface Changes

### Available Domains Banner
- Displays automatically when multiple domains are configured
- Shows all domains users can use
- Only appears when 2+ domains are available

### Domain Selector
- Appears in custom email input when multiple domains exist
- Dropdown next to email input field
- Auto-selects first domain by default
- User can switch domains before creating email

### Random Email Generation
- Uses first domain in the list
- Example: DOMAINS=0xf5.site,test.com → random emails use @0xf5.site

## API Endpoint

**GET /api/domains**

Returns list of available domains:
```json
{
  "domains": ["0xf5.site", "domain2.com", "domain3.net"]
}
```

## Testing Multi-Domain Setup

1. **Test SMTP Reception:**
```bash
# Send test email to each domain
telnet YOUR_SERVER_IP 25
HELO test
MAIL FROM: test@gmail.com
RCPT TO: testuser@0xf5.site
DATA
Subject: Test
Test email
.
QUIT
```

2. **Test Frontend:**
- Visit homepage
- Check "Available Domains" banner appears
- Create custom email and select different domain
- Verify email creation works for all domains

3. **Test Random Generation:**
- Click "Random" button
- Verify generated email uses first domain

## Important Notes

### SMTP Configuration
- SMTP server listens on port 25 for ALL configured domains
- No additional SMTP configuration needed
- Each domain receives emails independently

### Database
- All emails stored in same database
- Domain information stored with each email
- No domain isolation at database level

### Performance
- No performance impact from multiple domains
- Domain list cached in frontend (refetches every 30s in AvailableDomains component)
- API endpoint is lightweight (reads from env var)

### Security
- All domains share same SMTP server
- No per-domain authentication
- Anyone can create email addresses on any domain
- Suitable for temporary/disposable email service

## Troubleshooting

### Domains Not Showing in UI
1. Check container logs: `docker logs privatemaildelivery`
2. Verify DOMAINS env var: `docker inspect privatemaildelivery | grep DOMAINS`
3. Check /api/domains endpoint: `curl http://localhost:4000/api/domains`

### Emails Not Received for New Domain
1. Verify DNS MX records: `dig MX domain2.com`
2. Test SMTP directly: `telnet YOUR_SERVER_IP 25`
3. Check container logs for SMTP errors
4. Verify firewall allows port 25

### Domain Selector Not Appearing
- Domain selector only appears when 2+ domains configured
- Check browser console for errors
- Verify /api/domains returns multiple domains

## Examples

### Single Domain (Current Setup)
```bash
-e "DOMAINS=0xf5.site"
```
- No domain selector
- No available domains banner
- All emails use @0xf5.site

### Multiple Domains
```bash
-e "DOMAINS=0xf5.site,mail.example.com,temp.example.net"
```
- Domain selector appears
- Available domains banner shows 3 domains
- Users can choose which domain to use
- Random emails use @0xf5.site (first domain)

## Removal of Domains

To remove a domain:
1. Stop container
2. Update DOMAINS env var (remove domain from list)
3. Restart container
4. Existing emails with old domain remain in database
5. New emails cannot be created with removed domain

**Note:** Removing a domain does NOT delete existing emails. Use cleanup scripts if needed.
