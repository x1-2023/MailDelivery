"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Megaphone, Save, Eye, EyeOff } from "lucide-react"

interface Announcement {
  enabled: boolean
  title: string
  message: string
  type: 'warning' | 'info' | 'success'
  updatedAt: string
}

export function AnnouncementManager() {
  const [announcement, setAnnouncement] = useState<Announcement>({
    enabled: false,
    title: '',
    message: '',
    type: 'info',
    updatedAt: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAnnouncement()
  }, [])

  const fetchAnnouncement = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/announcement')
      if (response.ok) {
        const data = await response.json()
        setAnnouncement(data)
      }
    } catch (error) {
      console.error('Failed to fetch announcement:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAnnouncement = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(announcement),
      })

      if (response.ok) {
        toast({
          title: "Saved!",
          description: "Announcement updated successfully",
        })
        fetchAnnouncement() // Refresh to get updated timestamp
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle>System Announcements</CardTitle>
            <CardDescription>
              Manage global announcements displayed to all users (stored in file, not database)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            {announcement.enabled ? (
              <Eye className="h-5 w-5 text-green-600" />
            ) : (
              <EyeOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <Label htmlFor="enabled" className="text-base font-semibold">
                Display Announcement
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Show announcement banner to all users
              </p>
            </div>
          </div>
          <Switch
            id="enabled"
            checked={announcement.enabled}
            onCheckedChange={(checked) =>
              setAnnouncement({ ...announcement, enabled: checked })
            }
          />
        </div>

        {/* Type Selector */}
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-2">
            {(['info', 'warning', 'success'] as const).map((type) => (
              <Button
                key={type}
                variant={announcement.type === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnnouncement({ ...announcement, type })}
                className={
                  announcement.type === type
                    ? type === 'warning'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : type === 'success'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    : ''
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g., Server Maintenance Notice"
            value={announcement.title}
            onChange={(e) =>
              setAnnouncement({ ...announcement, title: e.target.value })
            }
            className="text-lg font-semibold"
          />
        </div>

        {/* Message Textarea */}
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Enter your announcement message here..."
            value={announcement.message}
            onChange={(e) =>
              setAnnouncement({ ...announcement, message: e.target.value })
            }
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Supports plain text. Keep it concise and clear.
          </p>
        </div>

        {/* Preview */}
        {announcement.title && announcement.message && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className={`p-4 rounded-lg border-2 ${
                announcement.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-700 dark:text-yellow-300'
                  : announcement.type === 'success'
                    ? 'bg-green-50 border-green-400 text-green-800 dark:bg-green-950/30 dark:border-green-700 dark:text-green-300'
                    : 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-300'
              }`}
            >
              <div className="font-semibold text-lg mb-2">{announcement.title}</div>
              <div className="text-sm whitespace-pre-wrap">{announcement.message}</div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {announcement.updatedAt && (
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date(announcement.updatedAt).toLocaleString()}
          </p>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={saveAnnouncement}
            disabled={saving || !announcement.title || !announcement.message}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {saving ? (
              <>
                <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Announcement
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Announcements are stored in{' '}
            <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">
              data/announcements.json
            </code>
            {' '}file (not in database). Changes take effect immediately for all users.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
