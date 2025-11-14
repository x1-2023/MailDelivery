"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Announcement {
  enabled: boolean
  title: string
  message: string
  type: 'warning' | 'info' | 'success'
  updatedAt: string
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetchAnnouncement()
  }, [])

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcement')
      if (response.ok) {
        const data = await response.json()
        if (data.enabled) {
          setAnnouncement(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error)
    }
  }

  if (!announcement || !announcement.enabled || dismissed) {
    return null
  }

  const getIcon = () => {
    switch (announcement.type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />
      case 'success':
        return <CheckCircle className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getColors = () => {
    switch (announcement.type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-300'
      case 'success':
        return 'bg-green-50 border-green-400 text-green-800 dark:bg-green-950/30 dark:border-green-700 dark:text-green-300'
      default:
        return 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-300'
    }
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-4`}>
      <div className={`p-4 rounded-lg border-2 ${getColors()} relative`}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          {getIcon()}
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{announcement.title}</h3>
            <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
