"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"
import {
  Mail,
  Inbox,
  RefreshCwIcon as Refresh,
  Copy,
  Trash2,
  Search,
  Star,
  Plus,
  Sun,
  Moon,
  BookOpen,
  Shield,
  Zap,
  Check,
  ChevronsUpDown,
  Timer,
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
  const [myEmails, setMyEmails] = useState<TempEmail[]>([]) // List of user's emails
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<"inbox" | "starred">("inbox")
  const [darkMode, setDarkMode] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [emailSelectorOpen, setEmailSelectorOpen] = useState(false)
  const [emailSearchQuery, setEmailSearchQuery] = useState("")

  // Check authentication (optional - allow anonymous)
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check", {
        credentials: "include",
      })

      if (!response.ok) {
        // Not authenticated - continue as anonymous
        setIsAuthenticated(false)
        setCurrentUser(null)
        return false
      }

      const data = await response.json()
      setIsAuthenticated(true)
      setCurrentUser(data.user)
      return true
    } catch (error) {
      console.error("Auth check failed:", error)
      setIsAuthenticated(false)
      setCurrentUser(null)
      return false
    }
  }

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Generate custom email
  const generateCustomEmail = async (customAddress?: string) => {
    setLoading(true)
    try {
      const response = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ customEmail: customAddress }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create email. It may already be in use by another user.",
          variant: "destructive",
        })
        setLoading(false)
        return false
      }
      
      const data = await response.json()
      setCurrentEmail(data)
      
      // Add to myEmails list if not already there
      if (!myEmails.find((e) => e.email === data.email)) {
        setMyEmails([...myEmails, data])
      }
      
      setEmails([])
      setSelectedEmail(null)
      toast({
        title: "Email created!",
        description: `Your email: ${data.email}`,
      })
      setLoading(false)
      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create email",
        variant: "destructive",
      })
      setLoading(false)
      return false
    }
  }

  // Generate new temporary email
  const generateEmail = async () => {
    await generateCustomEmail()
  }

  // Create email from search query
  const createEmailFromSearch = async (searchQuery: string) => {
    // Check if it's already in the list (exact match)
    const existingEmail = myEmails.find((e) => e.email === searchQuery)
    if (existingEmail) {
      setCurrentEmail(existingEmail)
      setEmailSelectorOpen(false)
      setEmailSearchQuery("")
      return true
    }

    // Create new email with custom address
    // If user types full email, use it. Otherwise append domain
    let customAddress = searchQuery
    if (!customAddress.includes("@")) {
      // Get domain from current email or use default
      const domain = currentEmail?.domain || "0xf5.site"
      customAddress = `${customAddress}@${domain}`
    }

    const success = await generateCustomEmail(customAddress)
    if (success) {
      setEmailSelectorOpen(false)
      setEmailSearchQuery("")
    }
    return success
  }

  // Fetch emails for current temporary email
  const fetchEmails = async () => {
    if (!currentEmail || !currentEmail.email) return

    setLoading(true)
    try {
      const response = await fetch(`/api/email/list?email=${currentEmail.email}`, {
        credentials: "include",
      })
      const data = await response.json()
      setEmails(data.emails || [])
    } catch (error) {
      console.error("Failed to fetch emails:", error)
    } finally {
      setLoading(false)
    }
  }

  // Copy email to clipboard
  const copyEmail = async () => {
    if (currentEmail) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(currentEmail.email)
          toast({
            title: "Copied!",
            description: "Email address copied to clipboard",
          })
        } else {
          // Fallback for older browsers
          const textArea = document.createElement("textarea")
          textArea.value = currentEmail.email
          textArea.style.position = "fixed"
          textArea.style.left = "-999999px"
          document.body.appendChild(textArea)
          textArea.select()
          try {
            document.execCommand("copy")
            toast({
              title: "Copied!",
              description: "Email address copied to clipboard",
            })
          } catch (err) {
            toast({
              title: "Copy failed",
              description: "Please copy manually",
              variant: "destructive",
            })
          }
          document.body.removeChild(textArea)
        }
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Please copy manually",
          variant: "destructive",
        })
      }
    }
  }

  // Delete email
  const deleteEmail = async (emailId: string) => {
    try {
      await fetch(`/api/email/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        credentials: "include",
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
        credentials: "include",
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

    if (view === "starred") {
      return email.starred && matchesSearch
    }
    return matchesSearch
  })

  useEffect(() => {
    if (currentEmail) {
      fetchEmails()
      const interval = setInterval(fetchEmails, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [currentEmail, refreshInterval])

  // Check auth on mount (allow anonymous)
  useEffect(() => {
    const initAuth = async () => {
      const authenticated = await checkAuth()
      // Generate email for both authenticated and anonymous users
      generateEmail()
    }
    initAuth()
  }, [])

  // Load user's emails from API
  const loadMyEmails = async () => {
    if (!currentUser) return
    try {
      const response = await fetch(`/api/users/${currentUser.id}/emails`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setMyEmails(data.emails || [])
        
        // If no current email selected, select the first one
        if (!currentEmail && data.emails && data.emails.length > 0) {
          setCurrentEmail(data.emails[0])
        }
      }
    } catch (error) {
      console.error("Failed to load user emails:", error)
    }
  }

  // Load emails on user change
  useEffect(() => {
    if (currentUser) {
      loadMyEmails()
    }
  }, [currentUser])

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

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading MailDelivery...</h2>
          <p className="text-gray-600">Please wait while we verify your session</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white" : "bg-gradient-to-br from-blue-50 via-white to-purple-50"}`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-lg border-b ${darkMode ? "bg-gray-900/80 border-gray-700" : "bg-white/80 border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MailDelivery
                  </h1>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Temporary Email Service
                  </p>
                </div>
              </div>
            </Link>

            <div className="flex items-center space-x-2">
              {currentUser ? (
                <>
                  <div className={`text-sm mr-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Welcome, <span className="font-semibold">{currentUser.username}</span>
                    {currentUser.role === "admin" && (
                      <Badge variant="outline" className="ml-2">
                        Admin
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <div className={`text-sm mr-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                    Anonymous Mode
                  </Badge>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Link href="/api-docs">
                <Button
                  variant="outline"
                  size="sm"
                  className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  API Docs
                </Button>
              </Link>
              {currentUser?.role === "admin" && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                  >
                    Admin Panel
                  </Button>
                </Link>
              )}
              {currentUser ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                >
                  Logout
                </Button>
              ) : (
                <Link href="/login">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Anonymous Mode Notice */}
      {!currentUser && currentEmail && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className={`p-4 rounded-lg border ${darkMode ? "bg-yellow-900/20 border-yellow-700 text-yellow-200" : "bg-yellow-50 border-yellow-200 text-yellow-800"}`}>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold mb-1">You're using Anonymous Mode</p>
                <p className="text-sm opacity-90">
                  Your email is temporary and cannot be accessed if you close the browser. 
                  <Link href="/login" className="underline ml-1 font-medium hover:opacity-80">
                    Login or Register
                  </Link> to save your emails and access them from any device.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentEmail ? (
        /* Hero Section - Before Email Generated */
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className={`text-5xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Temporary Email in Seconds
            </h2>
            <p className={`text-xl mb-8 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Get a disposable email address. No registration required.
            </p>
            
            {/* Custom Email Input for Anonymous Users */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Enter custom email (e.g., myname or myname@domain.com)"
                    value={emailSearchQuery}
                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && emailSearchQuery.trim()) {
                        e.preventDefault()
                        createEmailFromSearch(emailSearchQuery.trim())
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-base font-mono ${
                      darkMode 
                        ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500" 
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    } focus:outline-none transition-colors`}
                  />
                </div>
                <Button
                  size="lg"
                  onClick={() => emailSearchQuery.trim() ? createEmailFromSearch(emailSearchQuery.trim()) : generateEmail()}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <Refresh className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5 mr-2" />
                  )}
                  {emailSearchQuery.trim() ? "Create" : "Random"}
                </Button>
              </div>
              <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                💡 Leave empty for random email, or type your custom address
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Instant Setup
                </h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Get your temporary email in seconds. No registration needed.
                </p>
              </CardContent>
            </Card>

            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  100% Anonymous
                </h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Protect your privacy. No personal information required.
                </p>
              </CardContent>
            </Card>

            <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Auto-Expiring</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Emails auto-delete after expiry. Keep your inbox clean.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Main App - After Email Generated */
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Email Display Card */}
          <Card className={`mb-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white shadow-xl"}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Your Temporary Email Addresses:
                    </span>
                    <Badge
                      variant="outline"
                      className={`${darkMode ? "border-blue-500 text-blue-400" : "border-blue-600 text-blue-600"}`}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {myEmails.length} Active
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Email Selector with Search - Combobox */}
                    {myEmails.length > 0 ? (
                      <Popover open={emailSelectorOpen} onOpenChange={setEmailSelectorOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={emailSelectorOpen}
                            className={`flex-1 justify-between text-lg font-mono font-semibold h-14 ${
                              darkMode ? "bg-gray-700 text-blue-400 border-gray-600 hover:bg-gray-600" : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 hover:from-blue-100 hover:to-purple-100"
                            }`}
                          >
                            <span className="truncate">{currentEmail.email}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0" align="start">
                          <Command
                            shouldFilter={false}
                          >
                            <CommandInput
                              placeholder="Search or type email address, press Enter to create..."
                              value={emailSearchQuery}
                              onValueChange={setEmailSearchQuery}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && emailSearchQuery.trim()) {
                                  e.preventDefault()
                                  createEmailFromSearch(emailSearchQuery.trim())
                                }
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="py-6 px-4 text-center text-sm">
                                  {emailSearchQuery ? (
                                    <div className="space-y-3">
                                      <p className="text-muted-foreground">
                                        No matching email found
                                      </p>
                                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-muted-foreground mb-2">
                                          Create new email:
                                        </p>
                                        <p className="font-mono font-semibold text-blue-600 dark:text-blue-400 mb-3">
                                          {emailSearchQuery.includes("@") ? emailSearchQuery : `${emailSearchQuery}@...`}
                                        </p>
                                        <Button
                                          size="sm"
                                          disabled={loading}
                                          onClick={() => createEmailFromSearch(emailSearchQuery.trim())}
                                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Access
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          or press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border text-xs">Enter</kbd>
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">Type to search or create email</p>
                                  )}
                                </div>
                              </CommandEmpty>
                              <CommandGroup heading={`Your Emails (${myEmails.length})`}>
                                {myEmails
                                  .filter((email) =>
                                    email.email.toLowerCase().includes(emailSearchQuery.toLowerCase())
                                  )
                                  .slice(0, 10) // Show max 10 results
                                  .map((email) => (
                                    <CommandItem
                                      key={email.email}
                                      value={email.email}
                                      onSelect={() => {
                                        setCurrentEmail(email)
                                        setEmailSelectorOpen(false)
                                        setEmailSearchQuery("")
                                      }}
                                      className="font-mono"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          currentEmail.email === email.email ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {email.email}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                              {myEmails.length > 10 && (
                                <div className="px-2 py-2 text-xs text-center text-muted-foreground border-t">
                                  Showing 10 of {myEmails.length} emails. Use search to find more.
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div
                        className={`flex-1 text-xl font-mono font-semibold p-4 rounded-lg ${
                          darkMode ? "bg-gray-700 text-blue-400" : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600"
                        }`}
                      >
                        {currentEmail.email}
                      </div>
                    )}
                    <Button
                      onClick={copyEmail}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                    >
                      <Copy className="h-5 w-5 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={generateEmail}
                      disabled={loading}
                      size="lg"
                      variant="outline"
                      className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
                    >
                      <Refresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={`grid grid-cols-3 gap-4 mt-6 pt-6 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {emails.length}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Total Emails</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>
                    {emails.filter((e) => !e.read).length}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Unread</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>
                    {emails.filter((e) => e.starred).length}
                  </div>
                  <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Starred</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <div className={`mb-4 p-4 rounded-lg ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow-lg"}`}>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
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

              <div className="flex items-center space-x-2">
                <Button
                  variant={view === "inbox" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("inbox")}
                  className={
                    view === "inbox"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      : darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : ""
                  }
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Inbox
                  {emails.filter((e) => !e.read).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {emails.filter((e) => !e.read).length}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant={view === "starred" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("starred")}
                  className={
                    view === "starred"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      : darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : ""
                  }
                >
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchEmails}
                  disabled={loading}
                  className={darkMode ? "hover:bg-gray-700" : ""}
                >
                  <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>

                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className={`text-sm border rounded-lg px-3 py-2 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white"}`}
                >
                  <option value={30000}>30s</option>
                  <option value={60000}>1m</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email List and Content */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Email List */}
            <div
              className={`${selectedEmail ? "hidden md:block" : "block"} md:col-span-1 ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              } rounded-lg border overflow-hidden`}
            >
              <ScrollArea className="h-[600px]">
                {filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className={`h-12 w-12 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                      No emails yet
                    </p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Emails sent to your address will appear here.
                    </p>
                  </div>
                ) : (
                  <div className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedEmail?.id === email.id
                            ? darkMode
                              ? "bg-gray-700 border-l-4 border-blue-500"
                              : "bg-blue-50 border-l-4 border-blue-500"
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
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
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
                          <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
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

                        {!email.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Email Content */}
            <div
              className={`${selectedEmail ? "block" : "hidden md:block"} md:col-span-2 ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              } rounded-lg border overflow-hidden`}
            >
              {selectedEmail ? (
                <div className="h-[600px] flex flex-col">
                  <div className={`border-b p-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmail(null)}
                        className="md:hidden"
                      >
                        ← Back
                      </Button>

                      <div className="flex items-center space-x-2 ml-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStar(selectedEmail.id)}
                          className={darkMode ? "hover:bg-gray-700" : ""}
                        >
                          <Star
                            className={`h-4 w-4 ${selectedEmail.starred ? "fill-yellow-400 text-yellow-400" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmail(selectedEmail.id)}
                          className={darkMode ? "hover:bg-gray-700 text-red-400" : "text-red-600"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <h1 className={`text-2xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {selectedEmail.subject || "(No subject)"}
                    </h1>

                    <div
                      className={`flex items-center space-x-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
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

                  <ScrollArea className="flex-1 p-6">
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
                  className={`h-[600px] flex items-center justify-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  <div className="text-center">
                    <Mail className={`h-16 w-16 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                    <p className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      Select an email to read
                    </p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Choose an email from the list to view its contents
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`mt-16 py-8 border-t ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            © 2024 MailDelivery. Protect your privacy with temporary email addresses.
          </p>
        </div>
      </footer>
    </div>
  )
}
