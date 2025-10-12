"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  UserPlus,
  Trash2,
  Mail,
  Key,
  Loader2,
  Shield,
  User as UserIcon,
  Plus,
  X,
  Upload,
  FileText,
  Search,
  ArrowRightLeft,
  Eye,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User {
  id: string
  username: string
  role: "admin" | "user"
  created_at: string
  last_login?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState<"user" | "admin">("user")

  // Change password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedUsername, setSelectedUsername] = useState("")
  const [changePassword, setChangePassword] = useState("")

  // Email management dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [userEmails, setUserEmails] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [importMode, setImportMode] = useState<"manual" | "file">("manual")

  // Search and transfer state
  const [emailSearchQuery, setEmailSearchQuery] = useState("")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferEmail, setTransferEmail] = useState("")
  const [transferFromUser, setTransferFromUser] = useState("")
  const [transferToUserId, setTransferToUserId] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users", {
        credentials: "include",
      })
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || "Failed to load users")
      }
    } catch (err) {
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      setError("Username and password are required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCreateDialogOpen(false)
        setNewUsername("")
        setNewPassword("")
        setNewRole("user")
        loadUsers()
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (err) {
      setError("Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        loadUsers()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (err) {
      setError("Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!changePassword) {
      setError("Password is required")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${selectedUserId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: changePassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordDialogOpen(false)
        setChangePassword("")
        alert(`Password changed successfully for ${selectedUsername}`)
      } else {
        setError(data.error || "Failed to change password")
      }
    } catch (err) {
      setError("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const openEmailDialog = async (userId: string, username: string) => {
    setSelectedUserId(userId)
    setSelectedUsername(username)
    setLoading(true)
    setEmailDialogOpen(true)
    setEmailSearchQuery("")

    try {
      const response = await fetch(`/api/users/${userId}/emails`, {
        credentials: "include",
      })
      const data = await response.json()

      if (response.ok) {
        // Assuming API returns array of email objects with { email, domain, expiresAt }
        setUserEmails(data.emails || [])
      } else {
        setError(data.error || "Failed to load emails")
      }
    } catch (err) {
      setError("Failed to load emails")
    } finally {
      setLoading(false)
    }
  }

  const openTransferDialog = (email: string, fromUsername: string) => {
    setTransferEmail(email)
    setTransferFromUser(fromUsername)
    setTransferToUserId("")
    setTransferDialogOpen(true)
  }

  const handleTransferEmail = async () => {
    if (!transferToUserId) {
      setError("Please select a target user")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/users/${selectedUserId}/emails/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: transferEmail,
          toUserId: transferToUserId,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Remove from current user's list
        setUserEmails(userEmails.filter((e) => e.email !== transferEmail))
        setTransferDialogOpen(false)
        alert(`✓ Email "${transferEmail}" transferred successfully`)
      } else {
        setError(data.error || "Failed to transfer email")
      }
    } catch (err) {
      setError("Failed to transfer email")
    } finally {
      setLoading(false)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setNewEmail(content)
    }
    reader.readAsText(file)
  }

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return

    setLoading(true)
    setError("")

    try {
      // Split by newlines and filter out empty lines
      const emails = newEmail
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0)

      if (emails.length === 0) {
        setError("Please enter at least one email address")
        setLoading(false)
        return
      }

      // Use bulk API endpoint
      const response = await fetch(`/api/users/${selectedUserId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emails }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add emails")
      }

      const { successCount = 0, failCount = 0, failedEmails = [] } = data
      const addedEmails = emails.filter((e) => !failedEmails.includes(e))

      // Update UI with newly added emails
      if (addedEmails.length > 0) {
        setUserEmails([...userEmails, ...addedEmails])
        setNewEmail("")
      }

      // Show result message
      if (successCount > 0 && failCount === 0) {
        alert(`✓ Successfully added ${successCount} email(s)`)
      } else if (successCount > 0 && failCount > 0) {
        alert(
          `⚠ Added ${successCount} email(s), ${failCount} failed (may already exist or invalid)`,
        )
      } else {
        setError(`Failed to add emails. They may already exist.`)
      }
    } catch (err) {
      setError("Failed to add emails")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEmail = async (email: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/users/${selectedUserId}/emails?email=${encodeURIComponent(email)}`,
        { 
          method: "DELETE",
          credentials: "include",
        },
      )

      if (response.ok) {
        setUserEmails(userEmails.filter((e) => e !== email))
      } else {
        const data = await response.json()
        setError(data.error || "Failed to remove email")
      }
    } catch (err) {
      setError("Failed to remove email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users and their permissions</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newRole} onValueChange={(value: "user" | "admin") => setNewRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? (
                          <Shield className="mr-1 h-3 w-3" />
                        ) : (
                          <UserIcon className="mr-1 h-3 w-3" />
                        )}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEmailDialog(user.id, user.username)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(user.id)
                            setSelectedUsername(user.username)
                            setPasswordDialogOpen(true)
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Change password for {selectedUsername}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={changePassword}
                onChange={(e) => setChangePassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Management Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Emails</DialogTitle>
            <DialogDescription>Manage email addresses for {selectedUsername}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Add Email Addresses</Label>
                <div className="flex gap-2">
                  <Button
                    variant={importMode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImportMode("manual")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Manual
                  </Button>
                  <Button
                    variant={importMode === "file" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setImportMode("file")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import File
                  </Button>
                </div>
              </div>

              {importMode === "manual" ? (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    Enter one email per line, or paste multiple emails (separated by newlines,
                    commas, or semicolons)
                  </div>
                  <textarea
                    className="w-full min-h-[120px] px-3 py-2 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
                    placeholder="Enter email addresses (one per line)&#10;example1@domain.com&#10;example2@domain.com&#10;example3@domain.com&#10;&#10;Or paste from Excel/CSV:&#10;email1@domain.com, email2@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        e.preventDefault()
                        handleAddEmail()
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    Upload a text file with email addresses (one per line, or comma/semicolon
                    separated)
                  </div>
                  <div className="border-2 border-dashed rounded-md p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <input
                      type="file"
                      accept=".txt,.csv"
                      onChange={handleFileImport}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported: .txt, .csv files
                    </p>
                  </div>
                  {newEmail && (
                    <div className="mt-2 p-2 border rounded-md bg-gray-50 dark:bg-gray-800">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <div className="text-xs max-h-24 overflow-y-auto font-mono">
                        {newEmail.split(/[\n,;]+/).filter((e) => e.trim()).length} email(s) loaded
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {importMode === "manual"
                    ? "Press Ctrl+Enter to add, or click the button"
                    : "After uploading, click the button to add"}
                </span>
                <Button onClick={handleAddEmail} disabled={loading || !newEmail.trim()}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  <Plus className="mr-2 h-4 w-4" />
                  Add Email(s)
                </Button>
              </div>
            </div>

            {/* Search box */}
            <div className="space-y-2">
              <Label>Search Emails</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email address..."
                  value={emailSearchQuery}
                  onChange={(e) => setEmailSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userEmails.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No emails assigned</p>
              ) : (
                userEmails
                  .filter((email) => {
                    const emailStr = typeof email === 'string' ? email : email.email
                    return emailStr.toLowerCase().includes(emailSearchQuery.toLowerCase())
                  })
                  .map((email) => {
                    const emailStr = typeof email === 'string' ? email : email.email
                    return (
                      <div
                        key={emailStr}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="text-sm font-mono">{emailStr}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTransferDialog(emailStr, selectedUsername)}
                            title="Transfer to another user"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmail(emailStr)}
                            title="Remove email"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
              )}
              {emailSearchQuery && userEmails.filter((e) => {
                const emailStr = typeof e === 'string' ? e : e.email
                return emailStr.toLowerCase().includes(emailSearchQuery.toLowerCase())
              }).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No emails match your search
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Email Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Email</DialogTitle>
            <DialogDescription>
              Transfer "{transferEmail}" from {transferFromUser} to another user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetUser">Target User</Label>
              <Select value={transferToUserId} onValueChange={setTransferToUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== selectedUserId)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" />
                          {user.username}
                          {user.role === "admin" && (
                            <Badge variant="outline" className="ml-2">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransferEmail} disabled={loading || !transferToUserId}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
