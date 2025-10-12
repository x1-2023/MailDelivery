"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  Ban, 
  Clock, 
  Mail,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Power,
  PowerOff
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface SpamFilter {
  id: number
  name: string
  filter_type: "subject" | "sender" | "both"
  subject_pattern?: string
  sender_pattern?: string
  action: "block" | "auto_delete"
  auto_delete_minutes?: number
  enabled: number
  created_at: string
  updated_at: string
}

interface SpamStats {
  total_blocked: number
  total_auto_deleted: number
  pending_deletion: number
}

export default function SpamFiltersManager({ darkMode }: { darkMode: boolean }) {
  const [filters, setFilters] = useState<SpamFilter[]>([])
  const [stats, setStats] = useState<SpamStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFilter, setEditingFilter] = useState<SpamFilter | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    filter_type: "subject" as "subject" | "sender" | "both",
    subject_pattern: "",
    sender_pattern: "",
    action: "block" as "block" | "auto_delete",
    auto_delete_minutes: "10",
  })

  useEffect(() => {
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      const response = await fetch("/api/admin/spam-filters", {
        credentials: "include",
      })
      const data = await response.json()
      
      if (data.success) {
        setFilters(data.filters)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching spam filters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch spam filters",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingFilter ? "/api/admin/spam-filters" : "/api/admin/spam-filters"
      const method = editingFilter ? "PUT" : "POST"

      const body = editingFilter
        ? { id: editingFilter.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })
        setDialogOpen(false)
        resetForm()
        fetchFilters()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save filter",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this filter?")) return

    try {
      const response = await fetch(`/api/admin/spam-filters?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Filter deleted successfully",
        })
        fetchFilters()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete filter",
        variant: "destructive",
      })
    }
  }

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      const response = await fetch("/api/admin/spam-filters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, enabled }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })
        fetchFilters()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle filter",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      filter_type: "subject",
      subject_pattern: "",
      sender_pattern: "",
      action: "block",
      auto_delete_minutes: "10",
    })
    setEditingFilter(null)
  }

  const openEditDialog = (filter: SpamFilter) => {
    setEditingFilter(filter)
    setFormData({
      name: filter.name,
      filter_type: filter.filter_type,
      subject_pattern: filter.subject_pattern || "",
      sender_pattern: filter.sender_pattern || "",
      action: filter.action,
      auto_delete_minutes: filter.auto_delete_minutes?.toString() || "10",
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Blocked (Never Saved)
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {stats.total_blocked}
                  </p>
                </div>
                <Ban className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Auto-Delete Queue
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {stats.total_auto_deleted}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Pending Deletion
                  </p>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {stats.pending_deletion}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters List */}
      <Card className={darkMode ? "bg-gray-800 border-gray-700" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Spam Filter Rules
              </CardTitle>
              <CardDescription>
                Block or auto-delete spam emails based on subject or sender
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </DialogTrigger>
              <DialogContent className={`max-w-2xl ${darkMode ? "bg-gray-800 text-white" : ""}`}>
                <DialogHeader>
                  <DialogTitle>
                    {editingFilter ? "Edit Spam Filter" : "Create New Spam Filter"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure rules to automatically handle spam emails
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Filter Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Block Marketing Emails"
                      required
                      className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                    />
                  </div>

                  <div>
                    <Label>Filter Type</Label>
                    <Select
                      value={formData.filter_type}
                      onValueChange={(value: any) => setFormData({ ...formData, filter_type: value })}
                    >
                      <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Subject Contains
                          </div>
                        </SelectItem>
                        <SelectItem value="sender">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Sender Email/Domain
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Both (AND condition)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.filter_type === "subject" || formData.filter_type === "both") && (
                    <div>
                      <Label>Subject Pattern</Label>
                      <Input
                        value={formData.subject_pattern}
                        onChange={(e) => setFormData({ ...formData, subject_pattern: e.target.value })}
                        placeholder="e.g., unsubscribe, promotion, ads"
                        required={formData.filter_type === "subject" || formData.filter_type === "both"}
                        className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Case-insensitive. Email will match if subject contains this text.
                      </p>
                    </div>
                  )}

                  {(formData.filter_type === "sender" || formData.filter_type === "both") && (
                    <div>
                      <Label>Sender Pattern</Label>
                      <Input
                        value={formData.sender_pattern}
                        onChange={(e) => setFormData({ ...formData, sender_pattern: e.target.value })}
                        placeholder="e.g., spam@example.com or @marketing.com"
                        required={formData.filter_type === "sender" || formData.filter_type === "both"}
                        className={darkMode ? "bg-gray-700 border-gray-600" : ""}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Full email or domain (with @). e.g., @ads.com matches all emails from ads.com
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Action</Label>
                    <Select
                      value={formData.action}
                      onValueChange={(value: any) => setFormData({ ...formData, action: value })}
                    >
                      <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">
                          <div className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-red-500" />
                            Block (Never save to database)
                          </div>
                        </SelectItem>
                        <SelectItem value="auto_delete">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            Auto-Delete After Time
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.action === "auto_delete" && (
                    <div>
                      <Label>Delete After (Minutes)</Label>
                      <Select
                        value={formData.auto_delete_minutes}
                        onValueChange={(value) => setFormData({ ...formData, auto_delete_minutes: value })}
                      >
                        <SelectTrigger className={darkMode ? "bg-gray-700 border-gray-600" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 minutes</SelectItem>
                          <SelectItem value="20">20 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Note:</strong> This does NOT affect the DELETE_OLDER_THAN_DAYS setting.
                      Spam filters work independently.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false)
                        resetForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : editingFilter ? "Update Filter" : "Create Filter"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No spam filters configured yet</p>
              <p className="text-sm">Click "Add Filter" to create your first rule</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filters.map((filter) => (
                <Card key={filter.id} className={darkMode ? "bg-gray-700 border-gray-600" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{filter.name}</h3>
                          {filter.enabled ? (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <PowerOff className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {filter.filter_type === "subject" && <FileText className="h-3 w-3 mr-1" />}
                            {filter.filter_type === "sender" && <User className="h-3 w-3 mr-1" />}
                            {filter.filter_type === "both" && <Mail className="h-3 w-3 mr-1" />}
                            {filter.filter_type}
                          </Badge>
                          <Badge variant={filter.action === "block" ? "destructive" : "secondary"}>
                            {filter.action === "block" ? (
                              <>
                                <Ban className="h-3 w-3 mr-1" />
                                Block
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Auto-delete ({filter.auto_delete_minutes}m)
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          {filter.subject_pattern && (
                            <div className={darkMode ? "text-gray-300" : "text-gray-600"}>
                              <strong>Subject:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{filter.subject_pattern}</code>
                            </div>
                          )}
                          {filter.sender_pattern && (
                            <div className={darkMode ? "text-gray-300" : "text-gray-600"}>
                              <strong>Sender:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{filter.sender_pattern}</code>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(filter.id, !filter.enabled)}
                          className={darkMode ? "border-gray-600" : ""}
                        >
                          {filter.enabled ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(filter)}
                          className={darkMode ? "border-gray-600" : ""}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(filter.id)}
                          className={`${darkMode ? "border-gray-600" : ""} text-red-600 hover:text-red-700`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
