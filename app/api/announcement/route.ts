import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const ANNOUNCEMENTS_FILE = path.join(process.cwd(), 'data', 'announcements.json')

interface Announcement {
  enabled: boolean
  title: string
  message: string
  type: 'warning' | 'info' | 'success'
  updatedAt: string
}

// Ensure data directory exists
async function ensureDataDir() {
  const dir = path.dirname(ANNOUNCEMENTS_FILE)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// Read announcements
async function readAnnouncements(): Promise<Announcement> {
  try {
    const data = await fs.readFile(ANNOUNCEMENTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // Default announcement
    return {
      enabled: false,
      title: 'Thông Báo Hệ Thống',
      message: 'Chưa có thông báo mới',
      type: 'info',
      updatedAt: new Date().toISOString(),
    }
  }
}

// Write announcements
async function writeAnnouncements(data: Announcement) {
  await ensureDataDir()
  await fs.writeFile(ANNOUNCEMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// GET - Fetch announcement (public)
export async function GET() {
  try {
    const announcement = await readAnnouncements()
    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Failed to fetch announcement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    )
  }
}

// POST - Update announcement (admin only)
export async function POST(request: Request) {
  try {
    // Check admin auth (reuse from other admin APIs)
    const authHeader = request.headers.get('cookie')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { enabled, title, message, type } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 })
    }

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
    }

    const announcement: Announcement = {
      enabled,
      title,
      message,
      type: type || 'info',
      updatedAt: new Date().toISOString(),
    }

    await writeAnnouncements(announcement)

    return NextResponse.json({ success: true, announcement })
  } catch (error) {
    console.error('Failed to update announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}
