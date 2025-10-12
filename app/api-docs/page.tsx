"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Code, 
  Copy, 
  Check, 
  Shield, 
  Zap, 
  Lock, 
  Unlock,
  Mail,
  Plus,
  List,
  Eye,
  Trash2,
  Star,
  User,
  Crown,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    generate: true,
    list: false,
    read: false,
    delete: false,
    star: false,
  })
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check localStorage and system preference for dark mode
    const isDark = localStorage.getItem("darkMode") === "true" || 
                   (!localStorage.getItem("darkMode") && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem("darkMode", String(newMode))
    if (newMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style jsx global>{`
        /* Enhanced borders for better visibility in light mode */
        button[class*="outline"],
        [class*="badge"][class*="outline"] {
          border-width: 1.5px !important;
          border-color: rgb(209 213 219) !important;
        }
        .dark button[class*="outline"],
        .dark [class*="badge"][class*="outline"] {
          border-color: rgb(75 85 99) !important;
        }
        
        /* Tab triggers */
        [role="tablist"] button[data-state="inactive"] {
          border: 1.5px solid rgb(209 213 219);
          background-color: rgb(249 250 251);
        }
        .dark [role="tablist"] button[data-state="inactive"] {
          border-color: rgb(75 85 99);
          background-color: rgb(31 41 55);
        }
        
        /* Hover states */
        button[class*="outline"]:hover {
          background-color: rgb(243 244 246);
        }
        .dark button[class*="outline"]:hover {
          background-color: rgb(31 41 55);
        }
      `}</style>
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">API Documentation</h1>
                <p className="text-sm text-muted-foreground">RESTful API for temporary email service</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="border-gray-300 dark:border-gray-600"
              >
                {darkMode ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </>
                )}
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Back to App
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started with our API in minutes. No registration required for basic usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Unlock className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">Anonymous Mode</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use API without authentication. Perfect for testing and public access.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Authenticated</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Login to claim emails, sync across devices, and manage multiple addresses.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">Admin Access</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Full control over all emails, users, and system configuration.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Base URL</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm">
                  {baseUrl}/api
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${baseUrl}/api`, "base-url")}
                  className="border-gray-300 dark:border-gray-600"
                >
                  {copiedId === "base-url" ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Authentication Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="anonymous" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="anonymous">
                  <Unlock className="h-4 w-4 mr-2" />
                  Anonymous
                </TabsTrigger>
                <TabsTrigger value="session">
                  <Lock className="h-4 w-4 mr-2" />
                  Session
                </TabsTrigger>
                <TabsTrigger value="bearer">
                  <Shield className="h-4 w-4 mr-2" />
                  Bearer
                </TabsTrigger>
                <TabsTrigger value="basic">
                  <User className="h-4 w-4 mr-2" />
                  Basic
                </TabsTrigger>
              </TabsList>

              <TabsContent value="anonymous" className="space-y-4">
                <Alert>
                  <Unlock className="h-4 w-4" />
                  <AlertDescription>
                    No authentication required. Perfect for testing and public access.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <h4 className="font-semibold">Usage</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`# No headers required
curl ${baseUrl}/api/email/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"customEmail":"test123"}'`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground mt-2">
                    ⚠️ Limitations: Cannot access emails owned by registered users. Emails are public to all anonymous users.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="session" className="space-y-4">
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Session-based authentication using httpOnly cookies (recommended for web apps).
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Login to get session</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`curl ${baseUrl}/api/admin/auth \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"username":"user","password":"password"}' \\
  -c cookies.txt`}</code>
                  </pre>
                  <h4 className="font-semibold mt-4">2. Use session in requests</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`curl ${baseUrl}/api/email/list?email=myemail@domain.com \\
  -b cookies.txt`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="bearer" className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Token-based authentication (recommended for API integrations).
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Get Bearer Token</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`curl ${baseUrl}/api/admin/auth \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"username":"user","password":"password"}'

# Response:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}`}</code>
                  </pre>
                  <h4 className="font-semibold mt-4">2. Use Bearer Token</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`curl ${baseUrl}/api/email/list?email=myemail@domain.com \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="basic" className="space-y-4">
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    HTTP Basic Authentication (legacy support).
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <h4 className="font-semibold">Usage</h4>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <code className="text-sm">{`curl ${baseUrl}/api/email/list?email=myemail@domain.com \\
  -u username:password

# Or with explicit header:
curl ${baseUrl}/api/email/list?email=myemail@domain.com \\
  -H "Authorization: Basic $(echo -n username:password | base64)"`}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>Complete reference for all available endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generate Email */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection("generate")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-600">POST</Badge>
                  <code className="font-mono text-sm">/api/email/generate</code>
                  <span className="text-sm text-muted-foreground">Generate temporary email</span>
                </div>
                {expandedSections.generate ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSections.generate && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline"><Unlock className="h-3 w-3 mr-1" />Anonymous</Badge>
                    <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Authenticated</Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      Create a new temporary email address. Can be random or custom. Anonymous users create public emails (orphan), authenticated users create private emails (auto-owned).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`{
  "customEmail": "myname@domain.com" // Optional: Custom email address
                                      // Or just username: "myname"
                                      // Leave empty for random
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`{
  "email": "abc123xyz@tempmail.local",
  "domain": "tempmail.local",
  "expiresAt": "2025-10-13T10:30:00.000Z"
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example (Anonymous)</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`# Random email
curl ${baseUrl}/api/email/generate \\
  -X POST \\
  -H "Content-Type: application/json"

# Custom email (public, any anonymous can view)
curl ${baseUrl}/api/email/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -d '{"customEmail":"mytest123"}'`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example (Authenticated)</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`# Custom email (private, only you can view)
curl ${baseUrl}/api/email/generate \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"customEmail":"myemail"}'`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Error Responses</h4>
                    <div className="space-y-2">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>409 Conflict:</strong> Email already owned by another user
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>400 Bad Request:</strong> Invalid domain or email format
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* List Emails */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection("list")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="font-mono text-sm">/api/email/list</code>
                  <span className="text-sm text-muted-foreground">List received emails</span>
                </div>
                {expandedSections.list ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSections.list && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline"><Unlock className="h-3 w-3 mr-1" />Anonymous</Badge>
                    <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Authenticated</Badge>
                    <Badge variant="outline"><Crown className="h-3 w-3 mr-1" />Admin</Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      Retrieve all emails received for a specific email address. Access control applies: anonymous can only view orphan emails, authenticated users can view own emails or auto-claim orphans, admin can view all.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Query Parameters</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`email (required): Email address to retrieve messages for`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`{
  "emails": [
    {
      "id": "msg_123",
      "from": "sender@example.com",
      "to": "myemail@tempmail.local",
      "subject": "Welcome!",
      "body": "Plain text body",
      "html": "<h1>HTML body</h1>",
      "timestamp": "2025-10-12T10:00:00.000Z",
      "read": false,
      "starred": false
    }
  ]
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`# Anonymous (orphan email only)
curl "${baseUrl}/api/email/list?email=test@tempmail.local"

# Authenticated (own or orphan)
curl "${baseUrl}/api/email/list?email=myemail@tempmail.local" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Error Responses</h4>
                    <div className="space-y-2">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>403 Forbidden:</strong> Email owned by another user
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>400 Bad Request:</strong> Missing email parameter
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Read Single Email */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection("read")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="font-mono text-sm">/api/json/[email]/[id]</code>
                  <span className="text-sm text-muted-foreground">Read single email</span>
                </div>
                {expandedSections.read ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSections.read && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline"><Unlock className="h-3 w-3 mr-1" />Anonymous</Badge>
                    <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Authenticated</Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      Get details of a specific email message by ID.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">URL Parameters</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`[email]: Email address (e.g., test@tempmail.local)
[id]: Message ID (e.g., msg_123)`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`curl "${baseUrl}/api/json/test@tempmail.local/msg_123"`}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Delete Email */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection("delete")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-600">DELETE</Badge>
                  <code className="font-mono text-sm">/api/delete/[email]/[id]</code>
                  <span className="text-sm text-muted-foreground">Delete email</span>
                </div>
                {expandedSections.delete ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSections.delete && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Authenticated</Badge>
                    <Badge variant="outline"><Crown className="h-3 w-3 mr-1" />Admin</Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      Delete a specific email message. Requires authentication.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`curl "${baseUrl}/api/delete/myemail@tempmail.local/msg_123" \\
  -X DELETE \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Error Responses</h4>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>401 Unauthorized:</strong> Authentication required
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
            </div>

            {/* Star Email */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection("star")}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-600">POST</Badge>
                  <code className="font-mono text-sm">/api/email/star</code>
                  <span className="text-sm text-muted-foreground">Star/unstar email</span>
                </div>
                {expandedSections.star ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
              
              {expandedSections.star && (
                <div className="p-4 border-t space-y-4">
                  <div className="flex gap-2">
                    <Badge variant="outline"><Lock className="h-3 w-3 mr-1" />Authenticated</Badge>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      Toggle star status of an email message.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`{
  "emailAddress": "myemail@tempmail.local",
  "emailId": "msg_123",
  "starred": true
}`}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example</h4>
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
                      <code className="text-sm">{`curl ${baseUrl}/api/email/star \\
  -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "emailAddress": "myemail@tempmail.local",
    "emailId": "msg_123",
    "starred": true
  }'`}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Access Control Matrix */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Access Control Matrix</CardTitle>
            <CardDescription>Who can access what based on email ownership</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Email Status</th>
                    <th className="text-center p-3">Anonymous</th>
                    <th className="text-center p-3">Owner</th>
                    <th className="text-center p-3">Other User</th>
                    <th className="text-center p-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Orphan</Badge>
                        <span className="text-muted-foreground">(user_id = NULL)</span>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-600">✓ View</Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-600">✓ View + Claim</Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-600">✓ View + Claim</Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-600">✓ Full Access</Badge>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Owned</Badge>
                        <span className="text-muted-foreground">(has user_id)</span>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="destructive">✗ Forbidden</Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-600">✓ Full Access</Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="destructive">✗ Forbidden</Badge>
                    </td>
                    <td className="text-center p-3">
                      <Badge className="bg-green-600">✓ Full Access</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> When an authenticated user accesses an orphan email for the first time, it automatically gets assigned to them (auto-claim).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Rate Limits & Best Practices */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm">Anonymous Users</span>
                <Badge>10 req/min</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm">Authenticated Users</span>
                <Badge>60 req/min</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm">Admin Users</span>
                <Badge>Unlimited</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Rate limits are per IP address. Contact admin for higher limits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Use Bearer tokens for API integrations</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Store tokens securely, never in client code</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Handle 403/401 errors gracefully</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Implement exponential backoff for retries</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Clean up old emails regularly</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support & Resources */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Support & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/docs/API_AUTH_DIFFERENCES.md" target="_blank">
                <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <Code className="h-8 w-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold mb-1">Auth Differences</h3>
                    <p className="text-sm text-muted-foreground">
                      Detailed comparison of auth methods
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/docs/ANONYMOUS_MODE.md" target="_blank">
                <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <Unlock className="h-8 w-8 text-green-600 mb-2" />
                    <h3 className="font-semibold mb-1">Anonymous Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete anonymous mode guide
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/docs/API_FLOW_DIAGRAM.md" target="_blank">
                <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <CardContent className="pt-6">
                    <List className="h-8 w-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold mb-1">Flow Diagrams</h3>
                    <p className="text-sm text-muted-foreground">
                      Visual API flow references
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Need help? Check our <Link href="/" className="underline">documentation</Link> or contact support.</p>
        </div>
      </footer>
    </div>
  )
}
