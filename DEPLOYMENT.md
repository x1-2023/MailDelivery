# Dual Database Architecture - Deployment Guide

## 🎯 Mục đích
Giải quyết SQLITE_BUSY errors bằng Dual Database Architecture:
- **auth.db** - WRITE: Authentication, users, sessions, temp_emails (better-sqlite3 sync)
- **emails.db** - WRITE: Emails, attachments, spam filters (sqlite async)
- **emails.db/temp_emails** - READ-ONLY: Preserved old data for access

## ⚠️ Quan trọng
Code mới **KHÔNG cần migration** - Tự động hoạt động song song:
- ✅ GHI vào auth.db (tránh conflict)
- ✅ ĐỌC từ cả 2 database (merge kết quả)
- ✅ Data cũ vẫn accessible
- ✅ Không mất dữ liệu

## 📋 Deployment Steps (SIMPLIFIED - No Migration Required!)

### Bước 1: Commit và Push Code
```bash
git add .
git commit -m "feat: dual-database architecture for temp_emails (backward compatible)"
git push origin main
```

### Bước 2: Deploy lên Server
```bash
# SSH vào server
ssh user@0xf5.site

# Vào thư mục project
cd /var/www/opentrashmail

# Pull code mới
git pull origin main

# Rebuild Docker image
docker-compose build

# Restart container - DONE!
docker-compose restart
```

**Không cần migration!** Code tự động:
- ✅ GHI temp_emails mới vào auth.db
- ✅ ĐỌC temp_emails cũ từ emails.db (READ-ONLY)
- ✅ Merge kết quả khi query
- ✅ Data cũ vẫn accessible

### Bước 3: Verify
```bash
# Check logs
docker-compose logs -f --tail=100

# Kiểm tra không còn SQLITE_BUSY errors
# Test gửi email vào hệ thống
```

## 🔍 Verify Dual Database

### Check Database Stats API:
```bash
curl http://0xf5.site:4000/api/admin/database-stats
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "auth_db": {
      "path": "/var/www/opentrashmail/data/auth.db",
      "size": "X.XX MB",
      "temp_emails_count": 123
    },
    "emails_db": {
      "path": "/var/www/opentrashmail/data/emails.db", 
      "size": "X.XX MB",
      "temp_emails_count": 456
    },
    "total_unique": 500,
    "summary": {
      "total_unique_temp_emails": 500,
      "auth_db_count": 123,
      "emails_db_count": 456,
      "duplicates": 79
    }
  }
}
```

### Manual Database Check:
```bash
# Check auth.db (NEW data)
sqlite3 /var/www/opentrashmail/data/auth.db
sqlite> SELECT COUNT(*) FROM temp_emails;
sqlite> SELECT * FROM temp_emails ORDER BY created_at DESC LIMIT 5;
sqlite> .exit

# Check emails.db (OLD data - still preserved)
sqlite3 /var/www/opentrashmail/data/emails.db
sqlite> SELECT COUNT(*) FROM temp_emails;
sqlite> .exit
```

## 🆘 Rollback (nếu có vấn đề)

**Rollback rất dễ** vì không có migration:

```bash
cd /var/www/opentrashmail

# Restore code cũ
git reset --hard HEAD~1

# Rebuild
docker-compose build
docker-compose restart
```

**Data cũ vẫn an toàn** trong emails.db!

## 📊 Expected Results

**TRƯỚC:**
- ❌ SQLITE_BUSY errors liên tục
- ❌ Emails bị mất
- ⚠️ Logs đầy errors

**SAU:**
- ✅ Không còn SQLITE_BUSY
- ✅ Emails được lưu 100%
- ✅ Performance tốt hơn
- ✅ Anonymous mode hoạt động
- ✅ Auth mode hoạt động

## 💡 Technical Details

### File Changes:
- `lib/database.ts` - Removed temp_emails table
- `lib/auth-database.ts` - Added temp_emails table + helper functions
- `lib/email-service.ts` - Use auth-database for temp_emails operations
- `lib/admin-service.ts` - Use auth-database for cleanup

### Dual Database Architecture:
```
auth.db (better-sqlite3 - sync) - WRITE MODE
├── users
├── sessions
├── user_emails
└── temp_emails ⭐ (NEW data writes here)

emails.db (sqlite async) - HYBRID MODE
├── emails (READ/WRITE)
├── attachments (READ/WRITE)
├── spam_filters (READ/WRITE)
└── temp_emails ⭐ (READ-ONLY - old data preserved)
```

### Why Dual Database Works:
- ✅ **No lock conflicts**: NEW writes go to auth.db (better-sqlite3)
- ✅ **Old data preserved**: emails.db/temp_emails kept READ-ONLY
- ✅ **Automatic merging**: Queries read from both, deduplicate results
- ✅ **Zero downtime**: No migration needed
- ✅ **Backward compatible**: Can rollback anytime
- ✅ **Better performance**: Async + Sync libraries no longer fight

### Data Flow:
```
┌─────────────────────────────────────┐
│  CREATE new temp_email              │
│  ↓                                  │
│  WRITE to auth.db/temp_emails       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  READ temp_emails                   │
│  ↓                                  │
│  1. Query auth.db (NEW)             │
│  2. Query emails.db (OLD)           │
│  3. Merge + Deduplicate             │
│  4. Return combined results         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DELETE temp_email                  │
│  ↓                                  │
│  Only delete from auth.db           │
│  (OLD data in emails.db preserved)  │
└─────────────────────────────────────┘
```

## 📞 Support

Nếu có vấn đề:
1. Check logs: `docker-compose logs -f`
2. Verify migration: `ls -lh /var/www/opentrashmail/data/`
3. Rollback nếu cần (xem phần trên)
