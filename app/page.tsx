"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import {
  Mail,
  Inbox,
  RefreshCwIcon as Refresh,
  Copy,
  Trash2,
  Search,
  Menu,
  Star,
  Send,
  Plus,
  Clock,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Email {
  id: string
  from: string
  to: string
  subject: string
  body: string
  html?: string
  timestamp: string
  read: boolean
  starred: boolean
}

interface TempEmail {
  email: string
  domain: string
  expiresAt: string
}

export default function TrashMailApp() {
  const [currentEmail, setCurrentEmail] = useState<TempEmail | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<"inbox" | "starred" | "sent" | "trash">("inbox")
  const [customEmail, setCustomEmail] = useState("")
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(10000)

  // Generate custom email
  const generateCustomEmail = async (customAddress?: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customEmail: customAddress }),
      })
      const data = await response.json()
      setCurrentEmail(data)
      setEmails([])
      setSelectedEmail(null)
      setCustomEmail("")
      setShowCustomInput(false)
      toast({
        title: "Email created!",
        description: `Your email: ${data.email}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate new temporary email
  const generateEmail = async () => {
    await generateCustomEmail()
  }

  // Fetch emails for current temporary email
  const fetchEmails = async () => {
    if (!currentEmail) return

    setLoading(true)
    try {
      const response = await fetch(`/api/email/list?email=${currentEmail.email}`)
      const data = await response.json()
      setEmails(data.emails || [])
    } catch (error) {
      console.error("Failed to fetch emails:", error)
    } finally {
      setLoading(false)
    }
  }

  // Copy email to clipboard
  const copyEmail = () => {
    if (currentEmail) {
      navigator.clipboard.writeText(currentEmail.email)
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard",
      })
    }
  }

  // Delete email
  const deleteEmail = async (emailId: string) => {
    try {
      await fetch(`/api/email/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emailId }),
      })
      setEmails(emails.filter((e) => e.id !== emailId))
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null)
      }
      toast({
        title: "Deleted",
        description: "Email deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete email",
        variant: "destructive",
      })
    }
  }

  // Mark email as read
  const markAsRead = async (emailId: string) => {
    try {
      await fetch(`/api/email/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emailId }),
      })
      setEmails(emails.map((e) => (e.id === emailId ? { ...e, read: true } : e)))
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  // Toggle star
  const toggleStar = async (emailId: string) => {
    try {
      const email = emails.find((e) => e.id === emailId)
      await fetch(`/api/email/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emailId, starred: !email?.starred }),
      })
      setEmails(emails.map((e) => (e.id === emailId ? { ...e, starred: !e.starred } : e)))
    } catch (error) {
      console.error("Failed to toggle star:", error)
    }
  }

  // Filter emails based on view and search
  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase())

    switch (view) {
      case "starred":
        return email.starred && matchesSearch
      case "trash":
        return false // Just for show - no actual trash functionality
      case "sent":
        return false // Just for show - no actual sent functionality
      default:
        return matchesSearch
    }
  })

  useEffect(() => {
    if (currentEmail) {
      fetchEmails()
      const interval = setInterval(fetchEmails, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [currentEmail, refreshInterval])

  useEffect(() => {
    generateEmail()
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)

    if (hours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  return (
    <div className={`flex h-screen ${darkMode ? "dark bg-gray-900 text-white" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
        } shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? "border-gray-700" : ""}`}>
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-lg">MailDelivery</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="lg:hidden">
            ×
          </Button>
        </div>

        <div className="p-4">
          <Button onClick={generateEmail} disabled={loading} className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            New Email
          </Button>

          <nav className="space-y-1">
            <Button
              variant={view === "inbox" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setView("inbox")}
            >
              <Inbox className="h-4 w-4 mr-3" />
              Inbox
              {emails.filter((e) => !e.read).length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {emails.filter((e) => !e.read).length}
                </Badge>
              )}
            </Button>

            <Button
              variant={view === "starred" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setView("starred")}
            >
              <Star className="h-4 w-4 mr-3" />
              Starred
            </Button>

            <Button
              variant={view === "sent" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setView("sent")}
              disabled
            >
              <Send className="h-4 w-4 mr-3" />
              Sent
            </Button>

            <Button
              variant={view === "trash" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setView("trash")}
              disabled
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Trash
            </Button>
          </nav>
        </div>

        {/* Custom Email Section - Mobile in Sidebar */}
        <div className={`p-4 border-t lg:hidden ${darkMode ? "border-gray-700" : ""}`}>
          <div className="space-y-3">
            <div className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Create Custom Email
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Enter custom email (optional)"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className={`text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}`}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => generateCustomEmail(customEmail)}
                  disabled={loading}
                  className="flex-1"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateCustomEmail()}
                  disabled={loading}
                  className={`flex-1 ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}`}
                >
                  Random
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* API Documentation Link */}
        <div className={`p-4 border-t ${darkMode ? "border-gray-700" : ""}`}>
          <Link href="/api-docs">
            <Button
              variant="outline"
              className={`w-full ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              API Documentation
            </Button>
          </Link>
        </div>

        {currentEmail && (
          <div className={`p-4 border-t mt-auto ${darkMode ? "border-gray-700" : ""}`}>
            <div className={`text-sm mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Current Email:</div>
            <div className="flex items-center space-x-2">
              <div
                className={`flex-1 text-sm font-mono p-2 rounded truncate ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100"}`}
              >
                {currentEmail.email}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copyEmail}
                className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              <Clock className="h-3 w-3 inline mr-1" />
              Expires: {new Date(currentEmail.expiresAt).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header
          className={`px-4 py-3 flex items-center justify-between border-b ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
          }`}
        >
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative flex-1 max-w-md">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? "text-gray-400" : "text-gray-400"}`}
              />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""}`}
              />
            </div>

            {/* Custom Email Input - Desktop Only */}
            <div className="hidden lg:flex items-center space-x-2 ml-4">
              {!showCustomInput ? (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateCustomEmail()}
                    disabled={loading}
                    className={`whitespace-nowrap ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Random
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomInput(true)}
                    className={`whitespace-nowrap ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}`}
                  >
                    Custom Email
                  </Button>
                </div>
              ) : (
                <div
                  className={`flex items-center space-x-2 border rounded-lg p-2 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border"}`}
                >
                  <Input
                    placeholder="Enter custom email or leave blank for random"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className={`w-64 border-0 focus-visible:ring-0 ${darkMode ? "bg-gray-700 text-white placeholder-gray-400" : ""}`}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        generateCustomEmail(customEmail)
                      }
                    }}
                  />
                  <Button size="sm" onClick={() => generateCustomEmail(customEmail)} disabled={loading}>
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomEmail("")
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchEmails} disabled={loading}>
              <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/api-docs">
              <Button variant="ghost" size="sm">
                <BookOpen className="h-4 w-4" />
              </Button>
            </Link>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className={`text-sm border rounded px-2 py-1 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
            </select>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Email List */}
          <div
            className={`${selectedEmail ? "hidden md:block" : "block"} w-full md:w-96 border-r ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
            }`}
          >
            <ScrollArea className="h-full">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className={`h-12 w-12 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                    {view === "sent" || view === "trash"
                      ? `${view.charAt(0).toUpperCase() + view.slice(1)} is empty`
                      : "No emails yet"}
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {view === "sent" || view === "trash"
                      ? `No ${view} emails to display.`
                      : currentEmail
                        ? "Emails sent to your temporary address will appear here."
                        : "Generate a temporary email to get started."}
                  </p>
                </div>
              ) : (
                <div className={`divide-y ${darkMode ? "divide-gray-700" : ""}`}>
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedEmail?.id === email.id
                          ? darkMode
                            ? "bg-gray-700 border-r-2 border-blue-500"
                            : "bg-blue-50 border-r-2 border-blue-500"
                          : darkMode
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                      } ${!email.read ? (darkMode ? "bg-gray-750" : "bg-blue-25") : ""}`}
                      onClick={() => {
                        setSelectedEmail(email)
                        if (!email.read) {
                          markAsRead(email.id)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {email.from.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm truncate ${!email.read ? "font-semibold" : "font-medium"}`}>
                              {email.from}
                            </div>
                            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              to {email.to}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(email.id)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Star
                              className={`h-3 w-3 ${email.starred ? "fill-yellow-400 text-yellow-400" : darkMode ? "text-gray-400" : "text-gray-400"}`}
                            />
                          </Button>
                          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {formatTime(email.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className={`text-sm mb-1 ${!email.read ? "font-medium" : ""}`}>
                        {email.subject || "(No subject)"}
                      </div>

                      <div className={`text-sm line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {email.body.replace(/<[^>]*>/g, "").substring(0, 100)}...
                      </div>

                      {!email.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Email Content */}
          <div
            className={`${selectedEmail ? "block" : "hidden md:block"} flex-1 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                <div className={`border-b p-4 ${darkMode ? "border-gray-700" : ""}`}>
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)} className="md:hidden">
                      ← Back
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleStar(selectedEmail.id)}>
                        <Star className={`h-4 w-4 ${selectedEmail.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteEmail(selectedEmail.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <h1 className="text-xl font-semibold mb-3">{selectedEmail.subject || "(No subject)"}</h1>

                  <div
                    className={`flex items-center space-x-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {selectedEmail.from.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                          {selectedEmail.from}
                        </div>
                        <div className="text-xs">to {selectedEmail.to}</div>
                      </div>
                    </div>
                    <div className={`ml-auto text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div
                    className={`prose max-w-none ${darkMode ? "prose-invert" : ""}`}
                    dangerouslySetInnerHTML={{
                      __html: selectedEmail.html || selectedEmail.body.replace(/\n/g, "<br>"),
                    }}
                  />
                </ScrollArea>
              </div>
            ) : (
              <div
                className={`h-full flex items-center justify-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <div className="text-center">
                  <Mail className={`h-16 w-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                  <p className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : ""}`}>
                    Select an email to read
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : ""}`}>
                    Choose an email from the list to view its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
