import sqlite3 from "sqlite3"
import { open, type Database as SqliteDatabase } from "sqlite"
import path from "path"
import fs from "fs"

export class Database {
  private db: SqliteDatabase | null = null

  async init() {
    if (this.db) return this.db

    const dbPath =
      process.env.NODE_ENV === "production"
        ? "/var/www/opentrashmail/data/emails.db"
        : path.join(process.cwd(), "data", "emails.db")

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

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
      CREATE INDEX IF NOT EXISTS idx_temp_emails_expires ON temp_emails(expires_at);
    `)

    // Create spam filter rules table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS spam_filters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        filter_type TEXT NOT NULL CHECK(filter_type IN ('subject', 'sender', 'both')),
        subject_pattern TEXT,
        sender_pattern TEXT,
        action TEXT NOT NULL CHECK(action IN ('block', 'auto_delete')),
        auto_delete_minutes INTEGER,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Add spam_filtered column to emails table for tracking
    await this.db
      .exec(`
      ALTER TABLE emails ADD COLUMN spam_filtered INTEGER DEFAULT 0;
    `)
      .catch(() => {
        // Column might already exist, ignore error
      })

    await this.db
      .exec(`
      ALTER TABLE emails ADD COLUMN auto_delete_at TEXT;
    `)
      .catch(() => {
        // Column might already exist, ignore error
      })

    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_emails_spam_filtered ON emails(spam_filtered);
      CREATE INDEX IF NOT EXISTS idx_emails_auto_delete ON emails(auto_delete_at);
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
