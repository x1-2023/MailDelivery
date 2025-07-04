"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, Mail, Database, Trash2, Eye, BarChart3, Shield, HardDrive, Activity, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [accountEmails, setAccountEmails] = useState<any[]>([])
  const [showEmailDialog, setShowEmailDialog] = useState(false)

  // Check if already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("admin_auth")
    if (authToken === "authenticated") {
      setIsAuthenticated(true)
      loadAdminData()
    }
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        localStorage.setItem("admin_auth", "authenticated")
        loadAdminData()
        toast({
          title: "Login successful",
          description: "Welcome to admin panel",
        })
      } else {
        toast({
          title: "Login failed",
          description: "Invalid password",
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

  const loadAdminData = async () => {
    try {
      // Load stats
      const statsResponse = await fetch("/api/admin/stats")
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Load accounts
      const accountsResponse = await fetch("/api/admin/accounts")
      const accountsData = await accountsResponse.json()
      setAccounts(accountsData)

      // Load config
      const configResponse = await fetch("/api/admin/config")
      const configData = await configResponse.json()
      setConfig(configData)
    } catch (error) {
      console.error("Failed to load admin data:", error)
    }
  }

  const updateConfig = async (newConfig: Partial<SystemConfig>) => {
    try {
      const response = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch(`/api/json/${email}`)
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

  const runCleanup = async () => {
    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter admin password to access the control panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-gray-600 dark:text-gray-400">MailDelivery System Management</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800">
            <TabsTrigger value="dashboard" className="dark:data-[state=active]:bg-gray-700">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="emails" className="dark:data-[state=active]:bg-gray-700">
              Email Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="dark:data-[state=active]:bg-gray-700">
              Settings
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="dark:data-[state=active]:bg-gray-700">
              Maintenance
            </TabsTrigger>
          </TabsList>

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
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Email Accounts</CardTitle>
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
                          <Button size="sm" variant="outline" onClick={() => viewAccountEmails(account.email)}>
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

      {/* Email Dialog */}
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
