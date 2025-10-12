"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Mail, Database, Trash2, Eye, BarChart3, Shield, HardDrive, Activity, AlertTriangle, Search, Moon, Sun } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import UserManagement from "@/components/user-management"
import SpamFiltersManager from "@/components/spam-filters-manager"
import AdminManagement from "@/components/admin-management"

interface AdminStats {
  totalEmails: number
  totalAccounts: number
  emailsToday: number
  emailsThisWeek: number
  storageUsed: string
  oldestEmail: string
  newestEmail: string
}

interface EmailAccount {
  email: string
  emailCount: number
  lastActivity: string
  storageUsed: string
}

interface SystemConfig {
  deleteOlderThanDays: number
  maxEmailsPerAccount: number
  maxAttachmentSize: number
  allowedDomains: string[]
  autoCleanupEnabled: boolean
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [accountEmails, setAccountEmails] = useState<any[]>([])
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [orphanEmails, setOrphanEmails] = useState<string[]>([])
  const [loadingOrphans, setLoadingOrphans] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [emailSearch, setEmailSearch] = useState("")
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [emailMessages, setEmailMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [messageSearchTerm, setMessageSearchTerm] = useState("")

  // Check if already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("admin_auth")
    if (authToken === "authenticated") {
      setIsAuthenticated(true)
      loadAdminData()
    }

    // Check dark mode preference
    const isDark = localStorage.getItem("darkMode") === "true" ||
                   (!localStorage.getItem("darkMode") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setDarkMode(isDark)
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsAuthenticated(true)
        localStorage.setItem("admin_auth", "authenticated")
        localStorage.setItem("admin_username", username)
        loadAdminData()
        toast({
          title: "Login successful",
          description: `Welcome ${data.user.username}!`,
        })
      } else {
        toast({
          title: "Login failed",
          description: data.error || data.message || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("admin_auth")
    setPassword("")
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem("darkMode", String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const loadAdminData = async () => {
    try {
      // Load stats
      const statsResponse = await fetch("/api/admin/stats", {
        credentials: "include",
      })
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Load accounts
      const accountsResponse = await fetch("/api/admin/accounts", {
        credentials: "include",
      })
      const accountsData = await accountsResponse.json()
      setAccounts(accountsData)

      // Load config
      const configResponse = await fetch("/api/admin/config", {
        credentials: "include",
      })
      const configData = await configResponse.json()
      setConfig(configData)

      // Load orphan emails
      loadOrphanEmails()
    } catch (error) {
      console.error("Failed to load admin data:", error)
    }
  }

  const loadOrphanEmails = async () => {
    setLoadingOrphans(true)
    try {
      const response = await fetch("/api/admin/orphan-emails", {
        credentials: "include",
      })
      const data = await response.json()
      if (data.success) {
        setOrphanEmails(data.orphanEmails || [])
      }
    } catch (error) {
      console.error("Failed to load orphan emails:", error)
    } finally {
      setLoadingOrphans(false)
    }
  }

  const updateConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newConfig),
      })

      if (response.ok) {
        setConfig({ ...config!, ...newConfig })
        toast({
          title: "Configuration updated",
          description: "Settings have been saved successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      })
    }
  }

  const deleteAccount = async (email: string) => {
    if (!confirm(`Are you sure you want to delete all emails for ${email}?`)) return

    try {
      const response = await fetch(`/api/deleteaccount/${email}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setAccounts(accounts.filter((acc) => acc.email !== email))
        toast({
          title: "Account deleted",
          description: `All emails for ${email} have been deleted`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  const viewAccountEmails = async (email: string) => {
    try {
      const response = await fetch(`/api/json/${email}`, {
        credentials: "include",
      })
      const emails = await response.json()
      setAccountEmails(emails)
      setSelectedAccount(email)
      setShowEmailDialog(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive",
      })
    }
  }

  const handleEmailSearch = async (value: string) => {
    setEmailSearch(value)
    
    if (value.length >= 2) {
      // Get suggestions from accounts
      const suggestions = accounts
        .map(acc => acc.email)
        .filter(email => email.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
      setSearchSuggestions(suggestions)
    } else {
      setSearchSuggestions([])
    }
  }

  const loadEmailMessages = async (email: string) => {
    setLoadingMessages(true)
    setSelectedEmail(email)
    setMessageSearchTerm("") // Reset search when loading new email
    try {
      const response = await fetch(`/api/email/list?email=${email}`, {
        credentials: "include",
      })
      const data = await response.json()
      // Ensure data is an array
      if (Array.isArray(data)) {
        setEmailMessages(data)
      } else if (data && Array.isArray(data.emails)) {
        setEmailMessages(data.emails)
      } else {
        setEmailMessages([])
      }
    } catch (error) {
      setEmailMessages([])
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  // Memoized filtered messages for performance
  const filteredMessages = useMemo(() => {
    if (!messageSearchTerm) return emailMessages
    
    const searchLower = messageSearchTerm.toLowerCase()
    return emailMessages.filter(msg => 
      msg.subject?.toLowerCase().includes(searchLower) ||
      msg.from?.toLowerCase().includes(searchLower) ||
      msg.body?.toLowerCase().includes(searchLower)
    )
  }, [emailMessages, messageSearchTerm])

  const viewMessage = async (emailId: string) => {
    try {
      const response = await fetch(`/api/json/${selectedEmail}/${emailId}`, {
        credentials: "include",
      })
      const data = await response.json()
      setSelectedMessage(data)
      setShowMessageDialog(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load message",
        variant: "destructive",
      })
    }
  }

  const runCleanup = async () => {
    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Cleanup completed",
          description: `Deleted ${result.deletedCount} old emails`,
        })
        loadAdminData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Cleanup failed",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="dark:text-white">Admin Login</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Enter password to access the admin control panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}>
              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Admin Panel</h1>
                <p className={darkMode ? "text-gray-400" : "text-gray-600"}>MailDelivery System Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
                className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className={darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : ""}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 dark:bg-gray-800">
            <TabsTrigger value="dashboard" className="dark:data-[state=active]:bg-gray-700">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="dark:data-[state=active]:bg-gray-700">
              Users
            </TabsTrigger>
            <TabsTrigger value="emails" className="dark:data-[state=active]:bg-gray-700">
              Email Management
            </TabsTrigger>
            <TabsTrigger value="spam-filters" className="dark:data-[state=active]:bg-gray-700">
              <Shield className="h-4 w-4 mr-2" />
              Spam Filters
            </TabsTrigger>
            <TabsTrigger value="admins" className="dark:data-[state=active]:bg-gray-700">
              <Shield className="h-4 w-4 mr-2" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="settings" className="dark:data-[state=active]:bg-gray-700">
              Settings
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="dark:data-[state=active]:bg-gray-700">
              Maintenance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="spam-filters" className="space-y-6">
            <SpamFiltersManager darkMode={darkMode} />
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
            <AdminManagement darkMode={darkMode} />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200">Total Emails</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{stats?.totalEmails || 0}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200">Active Accounts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{stats?.totalAccounts || 0}</div>
                  <p className="text-xs text-muted-foreground">Email addresses</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200">Today's Emails</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{stats?.emailsToday || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium dark:text-gray-200">Storage Used</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold dark:text-white">{stats?.storageUsed || "0 MB"}</div>
                  <p className="text-xs text-muted-foreground">Database size</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="dark:text-gray-300">Auto Cleanup</span>
                    <Badge variant={config?.autoCleanupEnabled ? "default" : "secondary"}>
                      {config?.autoCleanupEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="dark:text-gray-300">Email Retention</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {config?.deleteOlderThanDays || 1} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="dark:text-gray-300">Allowed Domains</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {config?.allowedDomains?.length || 0} domains
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="dark:text-gray-300">Oldest Email</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stats?.oldestEmail ? new Date(stats.oldestEmail).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={runCleanup} className="w-full" variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Run Cleanup Now
                  </Button>
                  <Button onClick={loadAdminData} className="w-full" variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export Statistics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            {/* Email Search Section */}
            <Card className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white shadow-xl"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  <Mail className="h-5 w-5 text-blue-600" />
                  Search & View Emails
                </CardTitle>
                <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  Search for any email address and view all messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search email address... (e.g., user@domain.com)"
                    value={emailSearch}
                    onChange={(e) => handleEmailSearch(e.target.value)}
                    className={darkMode ? "bg-gray-900 border-gray-600" : ""}
                  />
                  {searchSuggestions.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setEmailSearch(suggestion)
                            setSearchSuggestions([])
                            loadEmailMessages(suggestion)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-opacity-50 ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100"}`}
                        >
                          <Mail className="h-4 w-4 inline mr-2 text-blue-600" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => loadEmailMessages(emailSearch)}
                  disabled={!emailSearch || loadingMessages}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loadingMessages ? "Loading..." : "Search Messages"}
                </Button>

                {selectedEmail && (
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                          Showing messages for:
                        </p>
                        <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {selectedEmail}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {emailMessages.filter(msg => 
                          !messageSearchTerm || 
                          msg.subject?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                          msg.from?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                          msg.body?.toLowerCase().includes(messageSearchTerm.toLowerCase())
                        ).length} / {emailMessages.length} messages
                      </Badge>
                    </div>

                    {/* Message Search */}
                    <div className="mb-3 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search in messages... (subject, sender, content)"
                        value={messageSearchTerm}
                        onChange={(e) => setMessageSearchTerm(e.target.value)}
                        className={`pl-10 ${darkMode ? "bg-gray-800 border-gray-600" : ""}`}
                      />
                    </div>

                    {emailMessages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        No messages found
                      </p>
                    ) : (
                      <ScrollArea className="h-96">
                        <div className="space-y-2">
                          {emailMessages
                            .filter(msg => 
                              !messageSearchTerm || 
                              msg.subject?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                              msg.from?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                              msg.body?.toLowerCase().includes(messageSearchTerm.toLowerCase())
                            )
                            .map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded border cursor-pointer hover:shadow ${
                                darkMode 
                                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700" 
                                  : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                              onClick={() => viewMessage(msg.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                                      {msg.subject || "(No Subject)"}
                                    </span>
                                    {msg.starred && <Badge variant="secondary">⭐</Badge>}
                                    {!msg.read && <Badge variant="default">New</Badge>}
                                  </div>
                                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    From: {msg.from}
                                  </p>
                                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                    {new Date(msg.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Accounts List */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">All Email Accounts</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Manage all email accounts and their messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {accounts.map((account) => (
                      <div
                        key={account.email}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                      >
                        <div className="flex-1">
                          <div className="font-medium dark:text-white">{account.email}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {account.emailCount} emails • Last activity:{" "}
                            {new Date(account.lastActivity).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{account.storageUsed}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEmailSearch(account.email)
                              loadEmailMessages(account.email)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteAccount(account.email)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className={darkMode ? "bg-gradient-to-br from-gray-800 via-gray-900 to-yellow-950 border-yellow-900/50" : "bg-gradient-to-br from-yellow-50 via-white to-yellow-50/50"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Orphan Emails
                  <Badge variant="secondary" className="ml-2">
                    {orphanEmails.length}
                  </Badge>
                </CardTitle>
                <CardDescription className={darkMode ? "text-yellow-200" : "text-gray-600"}>
                  Email addresses without owners (from old database before authentication system)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-yellow-900/20 border border-yellow-900/30" : "bg-yellow-50 border border-yellow-200"}`}>
                    <div className="flex items-start gap-3">
                      <Mail className={`h-5 w-5 mt-0.5 flex-shrink-0 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}>
                          Assign to Users
                        </p>
                        <p className={`text-sm ${darkMode ? "text-yellow-300/80" : "text-yellow-700"}`}>
                          Go to "Users" tab → Select user → "Manage Emails" → Paste email addresses to assign ownership.
                        </p>
                      </div>
                    </div>
                  </div>

                  {loadingOrphans ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                      <p className={`text-sm mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Loading orphan emails...
                      </p>
                    </div>
                  ) : orphanEmails.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                        <Mail className="h-8 w-8 text-green-600" />
                      </div>
                      <p className={`font-medium mb-1 ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                        All Clear!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        No orphan emails found. All emails are assigned to users.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          Orphan Email List:
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(orphanEmails.join('\n'))
                            toast({
                              title: "Copied!",
                              description: `${orphanEmails.length} email addresses copied to clipboard`,
                            })
                          }}
                          className={darkMode ? "border-yellow-900/30" : ""}
                        >
                          Copy All
                        </Button>
                      </div>
                      <ScrollArea className={`h-64 rounded-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                        <div className="p-3 space-y-1">
                          {orphanEmails.map((email, index) => (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2 rounded hover:bg-opacity-50 ${
                                darkMode ? "hover:bg-yellow-900/20" : "hover:bg-yellow-50"
                              }`}
                            >
                              <code className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {email}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(email)
                                  toast({
                                    title: "Copied!",
                                    description: email,
                                  })
                                }}
                                className="h-7 px-2"
                              >
                                Copy
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => setActiveTab("users")} 
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Go to User Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">System Configuration</CardTitle>
                <CardDescription className="dark:text-gray-400">Configure system behavior and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-gray-300">
                      Auto-delete emails older than (days)
                    </label>
                    <Input
                      type="number"
                      value={config?.deleteOlderThanDays || 1}
                      onChange={(e) => updateConfig({ deleteOlderThanDays: Number.parseInt(e.target.value) || 1 })}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-gray-300">Max emails per account</label>
                    <Input
                      type="number"
                      value={config?.maxEmailsPerAccount || 100}
                      onChange={(e) => updateConfig({ maxEmailsPerAccount: Number.parseInt(e.target.value) || 100 })}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-gray-300">Max attachment size (MB)</label>
                    <Input
                      type="number"
                      value={config?.maxAttachmentSize || 20}
                      onChange={(e) => updateConfig({ maxAttachmentSize: Number.parseInt(e.target.value) || 20 })}
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium dark:text-gray-300">Auto cleanup enabled</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config?.autoCleanupEnabled || false}
                        onChange={(e) => updateConfig({ autoCleanupEnabled: e.target.checked })}
                      />
                      <span className="text-sm dark:text-gray-300">Enable automatic cleanup</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-gray-300">Allowed Domains (comma-separated)</label>
                  <Input
                    value={config?.allowedDomains?.join(", ") || ""}
                    onChange={(e) =>
                      updateConfig({
                        allowedDomains: e.target.value.split(",").map((d) => d.trim()),
                      })
                    }
                    placeholder="domain1.com, domain2.com"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">System Maintenance</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Database maintenance and system operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={runCleanup}
                    variant="outline"
                    className="h-20 flex-col dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="h-6 w-6 mb-2" />
                    <span>Clean Old Emails</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex-col dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Database className="h-6 w-6 mb-2" />
                    <span>Optimize Database</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex-col dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <HardDrive className="h-6 w-6 mb-2" />
                    <span>Backup Data</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-20 flex-col dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    <span>System Logs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {selectedMessage?.subject || "(No Subject)"}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${darkMode ? "bg-slate-900/50" : "bg-gray-50"}`}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className={`font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}>From:</span>
                      <p className={darkMode ? "text-white" : "text-gray-900"}>{selectedMessage.from}</p>
                    </div>
                    <div>
                      <span className={`font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}>To:</span>
                      <p className={darkMode ? "text-white" : "text-gray-900"}>{selectedMessage.to}</p>
                    </div>
                    <div>
                      <span className={`font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}>Date:</span>
                      <p className={darkMode ? "text-white" : "text-gray-900"}>
                        {new Date(selectedMessage.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className={`font-medium ${darkMode ? "text-slate-400" : "text-gray-600"}`}>ID:</span>
                      <p className={`text-xs ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                        {selectedMessage.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Message Content:
                  </h3>
                  {selectedMessage.html ? (
                    <div 
                      className={`p-4 rounded-lg border ${darkMode ? "bg-white text-black border-slate-700" : "bg-white border-gray-200"}`}
                      dangerouslySetInnerHTML={{ __html: selectedMessage.html }}
                    />
                  ) : (
                    <pre className={`p-4 rounded-lg border whitespace-pre-wrap ${darkMode ? "bg-slate-900 text-white border-slate-700" : "bg-gray-50 text-gray-900 border-gray-200"}`}>
                      {selectedMessage.body}
                    </pre>
                  )}
                </div>

                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div>
                    <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      Attachments ({selectedMessage.attachments.length}):
                    </h3>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((att: any, idx: number) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded border flex items-center justify-between ${darkMode ? "bg-slate-900 border-slate-700" : "bg-gray-50 border-gray-200"}`}
                        >
                          <div>
                            <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {att.filename}
                            </p>
                            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
                              {att.contentType} • {(att.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Old Email Dialog (for account view) */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Emails for {selectedAccount}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {accountEmails.map((email) => (
                <div key={email.id} className="p-3 border rounded-lg dark:border-gray-700 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium dark:text-white">{email.subject || "(No subject)"}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(email.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">From: {email.from}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {email.body.replace(/<[^>]*>/g, "").substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
