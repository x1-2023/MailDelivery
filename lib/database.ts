import sqlite3 from "sqlite3"
import { open, type Database as SqliteDatabase } from "sqlite"
import path from "path"

export class Database {
  private db: SqliteDatabase | null = null

  async init() {
    if (this.db) return this.db

    const dbPath =
      process.env.NODE_ENV === "production"
        ? "/var/www/opentrashmail/data/emails.db"
        : path.join(process.cwd(), "data", "emails.db")

    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    // Create tables
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS temp_emails (
        email TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        html TEXT,
        timestamp TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        starred INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        email_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        data TEXT NOT NULL, -- base64 encoded
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
      )
    `)

    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
    `)

    // Thêm cột raw vào bảng emails
    await this.db
      .exec(`
      ALTER TABLE emails ADD COLUMN raw TEXT;
    `)
      .catch(() => {
        // Column might already exist, ignore error
      })

    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_emails_to_address ON emails(to_address);
      CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp);
      CREATE INDEX IF NOT EXISTS idx_emails_from_address ON emails(from_address);
      CREATE INDEX IF NOT EXISTS idx_emails_subject ON emails(subject);
      CREATE INDEX IF NOT EXISTS idx_emails_composite ON emails(to_address, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_emails_filter_composite ON emails(to_address, from_address, subject);
      CREATE INDEX IF NOT EXISTS idx_temp_emails_expires ON temp_emails(expires_at);
    `)

    return this.db
  }

  async run(sql: string, params: any[] = []) {
    const db = await this.init()
    return db.run(sql, params)
  }

  async get(sql: string, params: any[] = []) {
    const db = await this.init()
    return db.get(sql, params)
  }

  async all(sql: string, params: any[] = []) {
    const db = await this.init()
    return db.all(sql, params)
  }
}
