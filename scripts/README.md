# Admin Management Scripts

Collection of useful scripts for managing admin users and database.

## 📝 Scripts

### 1. Create Admin User
Create a new admin user or check if one exists.

```bash
# Inside container
node scripts/create-admin.js <username> <password>

# From host
docker exec privatemaildelivery node scripts/create-admin.js admin MyPassword123
```

**Features:**
- ✅ Checks if user already exists
- ✅ Waits for database to be ready
- ✅ Creates admin user with proper role
- ✅ Shows detailed error messages

---

### 2. Reset Admin Password
Reset password for an existing user.

```bash
# Inside container
node scripts/reset-admin-password.js <username> <new-password>

# From host
docker exec privatemaildelivery node scripts/reset-admin-password.js admin NewPassword123
```

**Features:**
- ✅ Checks if user exists before resetting
- ✅ Shows list of available users if not found
- ✅ Hashes password with bcrypt
- ✅ Confirms successful password change

---

### 3. List Users
List all users in the database with their details.

```bash
# Inside container
node scripts/list-users.js

# From host
docker exec privatemaildelivery node scripts/list-users.js
```

**Output:**
- Username, email, role
- Active status
- Creation date
- Last login date
- Summary statistics

---

### 4. Quick Password Reset (Shell Script)
Interactive shell script for easy password reset from host machine.

```bash
# Make executable
chmod +x scripts/reset-password.sh

# Run
./scripts/reset-password.sh privatemaildelivery admin NewPassword123

# Or interactive mode
./scripts/reset-password.sh
```

---

## 🚀 Common Use Cases

### Forgot Admin Password

**Option 1: Direct reset**
```bash
docker exec privatemaildelivery node scripts/reset-admin-password.js admin YourNewPassword
```

**Option 2: Check users first**
```bash
# See what users exist
docker exec privatemaildelivery node scripts/list-users.js

# Then reset
docker exec privatemaildelivery node scripts/reset-admin-password.js username NewPassword
```

---

### Database Not Ready Error

If you see "database not ready" error:

```bash
# 1. Check if container is running
docker ps | grep privatemaildelivery

# 2. Check if data directory exists
docker exec privatemaildelivery ls -la data/

# 3. Check application logs
docker logs -f privatemaildelivery

# 4. Wait a few seconds and try again
sleep 5
docker exec privatemaildelivery node scripts/create-admin.js admin Password123
```

---

### Create Multiple Admins

```bash
docker exec privatemaildelivery node scripts/create-admin.js admin1 Password1
docker exec privatemaildelivery node scripts/create-admin.js admin2 Password2
docker exec privatemaildelivery node scripts/create-admin.js admin3 Password3
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'better-sqlite3'"

This means you're trying to run scripts before dependencies are installed.

**Solution:**
```bash
# Inside container
npm install

# Or rebuild container
docker-compose up --build
```

---

### Error: "Database file not found"

Database hasn't been initialized yet.

**Solution:**
```bash
# Wait for application to start
docker logs -f privatemaildelivery

# Look for "✓ Ready" message
# Then try creating admin again
```

---

### Error: "User already exists"

The user is already in the database. Use reset password instead.

**Solution:**
```bash
docker exec privatemaildelivery node scripts/reset-admin-password.js admin NewPassword
```

---

## 📋 Script Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `create-admin.js` | Create new admin user | First time setup, add more admins |
| `reset-admin-password.js` | Reset user password | Forgot password, security reset |
| `list-users.js` | View all users | Check who exists, debug |
| `reset-password.sh` | Interactive password reset | Quick password changes |
| `cleanup.mjs` | Auto cleanup old emails | Runs automatically |

---

## 🔐 Security Notes

- **Passwords are hashed** with bcrypt (10 rounds)
- **Never commit** passwords to git
- **Use environment variables** for default admin in Docker
- **Change default password** immediately after first login
- **Use strong passwords** (min 8 chars, mixed case, numbers, symbols)

---

## 💡 Tips

1. **Set admin credentials in docker-compose.yml:**
   ```yaml
   environment:
     - ADMIN_USERNAME=admin
     - ADMIN_PASSWORD=SecurePassword123!
   ```

2. **Check logs if scripts fail:**
   ```bash
   docker logs privatemaildelivery --tail 50
   ```

3. **Backup database before major changes:**
   ```bash
   docker cp privatemaildelivery:/var/www/opentrashmail/data/emails.db ./backup-$(date +%Y%m%d).db
   ```

4. **Reset everything (careful!):**
   ```bash
   docker exec privatemaildelivery rm -rf data/
   docker restart privatemaildelivery
   ```
