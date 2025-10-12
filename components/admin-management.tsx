"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Plus, Trash2, Edit, UserCog, Key, CheckCircle, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface AdminUser {
  id: number
  username: string
  email?: string
  role: string
  created_at: string
  last_login?: string
  is_active: boolean
}

interface AdminManagementProps {
  darkMode?: boolean
}

export default function AdminManagement({ darkMode = false }: AdminManagementProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    role: "admin",
  })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admin/admins", {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins || [])
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Admin created",
          description: `${formData.username} has been added as admin`,
        })
        setShowAddDialog(false)
        setFormData({ username: "", password: "", email: "", role: "admin" })
        fetchAdmins()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    setLoading(true)

    try {
      const response = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editingAdmin.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Admin updated",
          description: `${formData.username} has been updated`,
        })
        setShowEditDialog(false)
        setEditingAdmin(null)
        setFormData({ username: "", password: "", email: "", role: "admin" })
        fetchAdmins()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update admin",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (id: number, username: string) => {
    if (!confirm(`Delete admin "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Admin deleted",
          description: `${username} has been removed`,
        })
        fetchAdmins()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete admin",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (id: number, is_active: boolean) => {
    try {
      const response = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, is_active: !is_active }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: is_active ? "Admin deactivated" : "Admin activated",
        })
        fetchAdmins()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to toggle admin status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle admin status",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (admin: AdminUser) => {
    setEditingAdmin(admin)
    setFormData({
      username: admin.username,
      password: "",
      email: admin.email || "",
      role: admin.role,
    })
    setShowEditDialog(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Admin Management
          </h2>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage administrator accounts and permissions
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className={darkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""}>
            <DialogHeader>
              <DialogTitle className={darkMode ? "dark:text-white" : ""}>
                Create New Administrator
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                  Username
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="admin2"
                  className={darkMode ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  className={darkMode ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
                />
              </div>
              <div>
                <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                  Password
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder="Strong password"
                  className={darkMode ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Admin"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin List */}
      <Card className={darkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""}>
        <CardHeader>
          <CardTitle className={darkMode ? "dark:text-white" : ""}>
            Administrator Accounts
          </CardTitle>
          <CardDescription className={darkMode ? "dark:text-gray-400" : ""}>
            {admins.length} admin account{admins.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    darkMode
                      ? "border-gray-700 hover:bg-gray-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      admin.is_active ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {admin.is_active ? (
                        <Shield className="h-5 w-5 text-green-600" />
                      ) : (
                        <Shield className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold ${darkMode ? "text-white" : ""}`}>
                          {admin.username}
                        </h3>
                        <Badge variant={admin.is_active ? "default" : "secondary"}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{admin.role}</Badge>
                      </div>
                      {admin.email && (
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {admin.email}
                        </p>
                      )}
                      <div className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Created: {new Date(admin.created_at).toLocaleString()}
                        {admin.last_login && (
                          <> • Last login: {new Date(admin.last_login).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(admin.id, admin.is_active)}
                      title={admin.is_active ? "Deactivate" : "Activate"}
                    >
                      {admin.is_active ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(admin)}
                      title="Edit admin"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                      title="Delete admin"
                      disabled={admins.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={darkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""}>
          <DialogHeader>
            <DialogTitle className={darkMode ? "dark:text-white" : ""}>
              Edit Administrator
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateAdmin} className="space-y-4">
            <div>
              <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                Username
              </label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className={darkMode ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={darkMode ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
              />
            </div>
            <div>
              <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : ""}`}>
                New Password (leave empty to keep current)
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
                className={darkMode ? "dark:bg-gray-700 dark:border-gray-600 dark:text-white" : ""}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingAdmin(null)
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Warning */}
      {admins.length === 1 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                  Last Administrator Account
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  This is the last admin account. You cannot delete it to prevent losing admin access.
                  Create a new admin account before deleting this one.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
