# PostgreSQL Migration Plan

## 📊 Current State Analysis

**Current System:**
- Database: SQLite (emails.db + auth.db)
- Volume: 400-500K accounts/month
- Traffic: 1000+ emails/hour
- Retention: 90 days
- Total: ~250K accounts, ~261K emails (growing)

**Pain Points:**
- SQLite SQLITE_BUSY errors under heavy concurrent writes
- Limited horizontal scaling
- Full-text search performance degradation
- Single point of failure

**Decision:** Migrate to PostgreSQL for better concurrency and scalability.

---

## 🎯 Migration Goals

1. **Zero Data Loss** - 100% data integrity
2. **Minimal Downtime** - <10 minutes planned maintenance
3. **Rollback Ready** - Can revert if issues arise
4. **Performance Gain** - 2-3x faster under load
5. **Future Proof** - Support 1M+ accounts

---

## 📋 Pre-Migration Checklist

### Week 1: Planning & Preparation

- [ ] **Backup Current Database**
  ```bash
  cp data/emails.db data/emails.db.backup.$(date +%Y%m%d)
  cp data/auth.db data/auth.db.backup.$(date +%Y%m%d)
  tar -czf data-backup-$(date +%Y%m%d).tar.gz data/
  ```

- [ ] **PostgreSQL Schema Design**
  ```sql
  -- Optimized schema with partitioning
  CREATE TABLE emails (
    id SERIAL PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    html TEXT,
    headers JSONB, -- Store as JSONB for efficient querying
    raw_email TEXT,
    size INTEGER,
    starred BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    spam_score REAL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) PARTITION BY RANGE (created_at);

  -- Create partitions by month (90 days = 3 partitions)
  CREATE TABLE emails_2024_10 PARTITION OF emails
    FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
  
  CREATE TABLE emails_2024_11 PARTITION OF emails
    FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
  
  CREATE TABLE emails_2024_12 PARTITION OF emails
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

  -- Indexes for performance
  CREATE INDEX idx_emails_to_address ON emails (to_address);
  CREATE INDEX idx_emails_from_address ON emails (from_address);
  CREATE INDEX idx_emails_created_at ON emails (created_at);
  CREATE INDEX idx_emails_starred ON emails (starred) WHERE starred = true;
  
  -- Full-text search index
  CREATE INDEX idx_emails_search ON emails 
    USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(body, '')));
  ```

- [ ] **Setup PostgreSQL Container**
  ```yaml
  # docker-compose.yml
  services:
    postgres:
      image: postgres:16-alpine
      container_name: mailsystem-postgres
      environment:
        POSTGRES_DB: mailsystem
        POSTGRES_USER: mailuser
        POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
        POSTGRES_INITDB_ARGS: "-E UTF8 --locale=en_US.UTF-8"
      volumes:
        - pgdata:/var/lib/postgresql/data
        - ./backups:/backups
      ports:
        - "5432:5432"
      restart: unless-stopped
      command:
        - "postgres"
        - "-c" 
        - "max_connections=200"
        - "-c"
        - "shared_buffers=256MB"
        - "-c"
        - "effective_cache_size=1GB"
        - "-c"
        - "maintenance_work_mem=64MB"
        - "-c"
        - "checkpoint_completion_target=0.9"
        - "-c"
        - "wal_buffers=16MB"
        - "-c"
        - "default_statistics_target=100"
  
  volumes:
    pgdata:
      driver: local
  ```

- [ ] **Install Migration Tools**
  ```bash
  npm install pg
  npm install --save-dev @types/pg
  ```

- [ ] **Create Migration Script**
  ```typescript
  // scripts/migrate-to-postgres.ts
  import Database from 'better-sqlite3'
  import { Pool } from 'pg'
  
  const sqliteDb = new Database('data/emails.db')
  const pgPool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'mailsystem',
    user: 'mailuser',
    password: process.env.POSTGRES_PASSWORD
  })
  
  async function migrateEmails() {
    console.log('🚀 Starting email migration...')
    
    const emails = sqliteDb.prepare('SELECT * FROM emails').all()
    console.log(`📧 Found ${emails.length} emails to migrate`)
    
    let migrated = 0
    for (const email of emails) {
      await pgPool.query(`
        INSERT INTO emails (
          id, message_id, from_address, to_address, 
          subject, body, html, headers, raw_email, 
          size, starred, is_read, spam_score, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (message_id) DO NOTHING
      `, [
        email.id, email.message_id, email.from_address, 
        email.to_address, email.subject, email.body,
        email.html, JSON.stringify(email.headers || {}),
        email.raw_email, email.size, email.starred,
        email.is_read, email.spam_score, email.created_at
      ])
      
      migrated++
      if (migrated % 1000 === 0) {
        console.log(`✅ Migrated ${migrated}/${emails.length} emails`)
      }
    }
    
    console.log('✅ Email migration complete!')
  }
  ```

---

## 🔄 Migration Strategy: Dual-Database Mode

### Week 2-3: Implement Dual-Write

**Concept:** Write to both SQLite AND PostgreSQL simultaneously for safety.

```typescript
// lib/database-adapter.ts
import { sqliteDb } from './database'
import { pgPool } from './postgres-database'

export class DatabaseAdapter {
  private mode: 'sqlite' | 'postgres' | 'dual' = process.env.DB_MODE || 'dual'
  
  async saveEmail(email: Email) {
    if (this.mode === 'dual') {
      // Write to both databases
      const [sqliteResult, pgResult] = await Promise.allSettled([
        this.saveToSQLite(email),
        this.saveToPostgres(email)
      ])
      
      // Log any errors but don't fail
      if (sqliteResult.status === 'rejected') {
        console.error('SQLite write failed:', sqliteResult.reason)
      }
      if (pgResult.status === 'rejected') {
        console.error('PostgreSQL write failed:', pgResult.reason)
      }
      
      // As long as one succeeds, we're good
      return pgResult.status === 'fulfilled' ? pgResult.value : sqliteResult.value
    }
    
    // Single database mode
    return this.mode === 'postgres' 
      ? this.saveToPostgres(email)
      : this.saveToSQLite(email)
  }
  
  async getEmails(filter: EmailFilter) {
    // Always read from PostgreSQL in dual mode
    return this.mode === 'postgres' || this.mode === 'dual'
      ? this.getFromPostgres(filter)
      : this.getFromSQLite(filter)
  }
}
```

**Environment Variables:**
```bash
# .env
DB_MODE=dual              # sqlite | postgres | dual
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mailsystem
POSTGRES_USER=mailuser
POSTGRES_PASSWORD=your-secure-password
```

---

## 📊 Week 3: Validation & Testing

### Data Integrity Checks

```typescript
// scripts/validate-migration.ts
async function validateMigration() {
  // Count comparison
  const sqliteCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM emails').get()
  const pgCount = await pgPool.query('SELECT COUNT(*) as count FROM emails')
  
  console.log(`SQLite: ${sqliteCount.count} emails`)
  console.log(`PostgreSQL: ${pgCount.rows[0].count} emails`)
  
  if (sqliteCount.count !== pgCount.rows[0].count) {
    console.error('❌ Row count mismatch!')
    return false
  }
  
  // Sample data comparison
  const samples = sqliteDb.prepare('SELECT * FROM emails ORDER BY RANDOM() LIMIT 100').all()
  for (const sample of samples) {
    const pgEmail = await pgPool.query(
      'SELECT * FROM emails WHERE message_id = $1',
      [sample.message_id]
    )
    
    if (!pgEmail.rows[0]) {
      console.error(`❌ Missing email: ${sample.message_id}`)
      return false
    }
    
    // Compare fields
    if (sample.subject !== pgEmail.rows[0].subject) {
      console.error(`❌ Subject mismatch for ${sample.message_id}`)
      return false
    }
  }
  
  console.log('✅ Validation passed!')
  return true
}
```

### Performance Benchmarks

```typescript
// scripts/benchmark.ts
async function benchmark() {
  console.log('🏃 Running benchmarks...\n')
  
  // Test 1: Insert speed
  const insertStart = Date.now()
  for (let i = 0; i < 1000; i++) {
    await db.saveEmail(generateTestEmail())
  }
  console.log(`Insert 1000 emails: ${Date.now() - insertStart}ms`)
  
  // Test 2: Query speed
  const queryStart = Date.now()
  await db.getEmails({ limit: 100 })
  console.log(`Query 100 emails: ${Date.now() - queryStart}ms`)
  
  // Test 3: Full-text search
  const searchStart = Date.now()
  await db.searchEmails('invoice payment')
  console.log(`Full-text search: ${Date.now() - searchStart}ms`)
  
  // Test 4: Concurrent writes
  const concurrentStart = Date.now()
  await Promise.all(
    Array(100).fill(0).map(() => db.saveEmail(generateTestEmail()))
  )
  console.log(`100 concurrent writes: ${Date.now() - concurrentStart}ms`)
}
```

---

## 🚀 Week 4: Production Cut-over

### Day 1-3: Final Sync

```bash
# 1. Enable maintenance mode (optional)
echo "🔧 Maintenance mode - Migration in progress" > public/maintenance.html

# 2. Stop accepting new SMTP connections temporarily
docker-compose stop smtp-server

# 3. Final incremental sync (only new data)
node scripts/incremental-sync.ts

# 4. Validate one more time
node scripts/validate-migration.ts
```

### Day 4: Switch to PostgreSQL

```bash
# 1. Update environment
echo "DB_MODE=postgres" >> .env

# 2. Restart application
docker-compose down
docker-compose up -d

# 3. Monitor logs
docker logs -f mailsystem-app

# 4. Test key operations
curl -X POST http://localhost:4000/api/email/generate
curl http://localhost:4000/api/json/testuser@example.com
```

### Day 5-7: Monitor & Optimize

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔙 Rollback Plan

### If PostgreSQL Fails:

```bash
# 1. Immediate rollback
docker-compose stop
echo "DB_MODE=sqlite" > .env
docker-compose up -d

# 2. SQLite backup is still intact
ls -lh data/emails.db
# No data loss - SQLite was never deleted

# 3. Monitor recovery
docker logs -f mailsystem-app

# Recovery Time: <5 minutes
```

### If Data Inconsistency Detected:

```bash
# 1. Stop writes
docker-compose stop smtp-server

# 2. Re-sync from SQLite
node scripts/migrate-to-postgres.ts --force

# 3. Validate again
node scripts/validate-migration.ts

# 4. Resume if OK
docker-compose start smtp-server
```

---

## 📈 Performance Optimization Post-Migration

### Connection Pooling

```typescript
// lib/postgres-database.ts
import { Pool } from 'pg'

export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  
  // Pool settings
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if can't connect
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pgPool.end()
  process.exit(0)
})
```

### Query Optimization

```typescript
// Use prepared statements
const getEmailStmt = pgPool.prepare(`
  SELECT * FROM emails 
  WHERE to_address = $1 
  ORDER BY created_at DESC 
  LIMIT $2
`)

// Batch inserts
async function batchInsertEmails(emails: Email[]) {
  const values = emails.map((e, i) => 
    `($${i*14+1}, $${i*14+2}, ..., $${i*14+14})`
  ).join(',')
  
  const params = emails.flatMap(e => [
    e.message_id, e.from_address, e.to_address, ...
  ])
  
  await pgPool.query(
    `INSERT INTO emails VALUES ${values}`,
    params
  )
}
```

### Maintenance Schedule

```bash
# Add to crontab
# Daily vacuum (3 AM)
0 3 * * * docker exec mailsystem-postgres psql -U mailuser -d mailsystem -c "VACUUM ANALYZE;"

# Weekly full vacuum (Sunday 3 AM)
0 3 * * 0 docker exec mailsystem-postgres psql -U mailuser -d mailsystem -c "VACUUM FULL;"

# Monthly partition management (1st of month)
0 2 1 * * node /app/scripts/manage-partitions.ts
```

---

## 💾 Backup Strategy

### Continuous Backups

```bash
# Enable WAL archiving for point-in-time recovery
# In docker-compose.yml add:
command:
  - "postgres"
  - "-c"
  - "wal_level=replica"
  - "-c"
  - "archive_mode=on"
  - "-c"
  - "archive_command=cp %p /backups/wal/%f"

# Daily full backup (2 AM)
0 2 * * * docker exec mailsystem-postgres pg_dump -U mailuser -Fc mailsystem > /backups/daily/mailsystem-$(date +\%Y\%m\%d).dump

# Keep last 7 daily backups
find /backups/daily -name "*.dump" -mtime +7 -delete
```

### Disaster Recovery

```bash
# Restore from backup
docker exec -i mailsystem-postgres pg_restore \
  -U mailuser -d mailsystem -c /backups/daily/mailsystem-20241013.dump

# Point-in-time recovery
# 1. Restore base backup
# 2. Replay WAL files up to specific timestamp
pg_restore -U mailuser -d mailsystem /backups/base.dump
```

---

## 📋 Migration Checklist Summary

### Pre-Migration
- [ ] Full backup of SQLite databases
- [ ] PostgreSQL container configured and tested
- [ ] Migration scripts written and tested on sample data
- [ ] Performance benchmarks established (baseline)
- [ ] Team trained on new system

### During Migration
- [ ] Dual-write mode enabled and monitored (2 weeks)
- [ ] Data validation checks passed
- [ ] No errors in application logs
- [ ] Backup strategy tested and verified

### Post-Migration
- [ ] Switch to PostgreSQL-only mode
- [ ] Performance benchmarks met or exceeded
- [ ] SQLite backup retained for 30 days
- [ ] Monitoring alerts configured
- [ ] Documentation updated

### Rollback Ready
- [ ] Rollback procedure documented and tested
- [ ] SQLite backup accessible and verified
- [ ] Team knows rollback process
- [ ] Rollback can complete in <10 minutes

---

## 🎯 Success Criteria

**Migration is successful if:**
- ✅ 100% data integrity (all rows migrated correctly)
- ✅ Zero data loss
- ✅ Downtime <10 minutes
- ✅ Performance improved (2-3x faster queries)
- ✅ No SQLITE_BUSY errors
- ✅ Can handle 1000+ emails/hour without issues
- ✅ Rollback plan tested and working

**Key Metrics to Track:**
- Email insert time (should be <50ms)
- Query response time (should be <100ms for 100 records)
- Concurrent write capacity (should handle 100+ simultaneous)
- Disk I/O (should be lower than SQLite)
- Connection pool usage (should be <80%)

---

## 📞 Support & Resources

**PostgreSQL Documentation:**
- https://www.postgresql.org/docs/16/
- https://wiki.postgresql.org/wiki/Performance_Optimization

**Migration Tools:**
- pgloader: https://github.com/dimitri/pgloader
- node-postgres: https://node-postgres.com/

**Monitoring:**
- pg_stat_statements
- pgAdmin 4
- Grafana + Prometheus (postgres_exporter)

---

## 🎬 Estimated Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Planning & Setup | Week 1 | 16 hours |
| Dual-Write Implementation | Week 2 | 20 hours |
| Testing & Validation | Week 3 | 16 hours |
| Production Cut-over | Week 4 | 8 hours |
| **Total** | **4 weeks** | **60 hours** |

**Cost:** $0 (PostgreSQL is free, using existing infrastructure)

**Risk Level:** Low (with dual-write mode and rollback plan)

**Impact:** High (2-3x performance improvement, future-proof)

---

**Document Version:** 1.0  
**Last Updated:** October 13, 2025  
**Author:** System Admin  
**Status:** Ready for Implementation
