"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Mail, Code, Database, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function APIDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    })
  }

  const endpoints = [
    {
      id: "generate-email",
      method: "POST",
      path: "/api/email/generate",
      title: "Generate Email",
      description: "Create a new temporary email address",
      category: "Email Management",
      requestBody: {
        customEmail: "string (optional) - Custom email address or username",
      },
      response: {
        email: "string - Generated email address",
        domain: "string - Email domain",
        expiresAt: "string - Expiration timestamp",
      },
      example: `curl -X POST http://localhost:4000/api/email/generate \\
  -H "Content-Type: application/json" \\
  -d '{"customEmail": "myemail"}'`,
    },
    {
      id: "list-emails",
      method: "GET",
      path: "/api/email/list",
      title: "List Emails",
      description: "Get all emails for a specific address",
      category: "Email Management",
      parameters: {
        email: "string (required) - Email address to fetch emails for",
      },
      response: {
        emails: "array - List of email objects",
      },
      example: `curl -X GET "http://localhost:4000/api/email/list?email=test@domain.com"`,
    },
    {
      id: "delete-email",
      method: "DELETE",
      path: "/api/email/delete",
      title: "Delete Email",
      description: "Delete a specific email message",
      category: "Email Management",
      requestBody: {
        id: "string (required) - Email ID to delete",
      },
      response: {
        success: "boolean - Operation success status",
      },
      example: `curl -X DELETE http://localhost:4000/api/email/delete \\
  -H "Content-Type: application/json" \\
  -d '{"id": "email-id-here"}'`,
    },
    {
      id: "raw-email",
      method: "GET",
      path: "/api/raw/[email]/[id]",
      title: "Get Raw Email",
      description: "Returns the raw email content (can be up to 20MB)",
      category: "Email Content",
      parameters: {
        email: "string (required) - Email address",
        id: "string (required) - Email ID",
      },
      response: "Raw email content as text/plain",
      example: `curl -X GET "http://localhost:4000/api/raw/test@domain.com/email-id"`,
    },
    {
      id: "attachment",
      method: "GET",
      path: "/api/attachment/[email]/[attachment-id]",
      title: "Get Attachment",
      description: "Returns email attachment with correct mime type",
      category: "Email Content",
      parameters: {
        email: "string (required) - Email address",
        "attachment-id": "string (required) - Attachment ID",
      },
      response: "Binary attachment data with proper mime type",
      example: `curl -X GET "http://localhost:4000/api/attachment/test@domain.com/attachment-id" -o attachment.pdf`,
    },
    {
      id: "delete-specific",
      method: "DELETE",
      path: "/api/delete/[email]/[id]",
      title: "Delete Specific Email",
      description: "Deletes a specific email message and attachments",
      category: "Email Management",
      parameters: {
        email: "string (required) - Email address",
        id: "string (required) - Email ID",
      },
      response: {
        success: "boolean - Operation success",
        message: "string - Success message",
      },
      example: `curl -X DELETE "http://localhost:4000/api/delete/test@domain.com/email-id"`,
    },
    {
      id: "delete-account",
      method: "DELETE",
      path: "/api/deleteaccount/[email]",
      title: "Delete Account",
      description: "Deletes all messages and attachments for an email account",
      category: "Email Management",
      parameters: {
        email: "string (required) - Email address",
      },
      response: {
        success: "boolean - Operation success",
        message: "string - Success message",
        deletedCount: "number - Number of deleted emails",
      },
      example: `curl -X DELETE "http://localhost:4000/api/deleteaccount/test@domain.com"`,
    },
    {
      id: "json-emails",
      method: "GET",
      path: "/json/[email]",
      title: "Get Emails (JSON)",
      description: "Returns array of emails with attachment links and parsed body",
      category: "JSON API",
      parameters: {
        email: "string (required) - Email address",
      },
      response: "Array of email objects with attachments",
      example: `curl -X GET "http://localhost:4000/json/test@domain.com"`,
    },
    {
      id: "json-specific",
      method: "GET",
      path: "/json/[email]/[id]",
      title: "Get Specific Email (JSON)",
      description: "Returns specific email with raw and HTML body (can be huge)",
      category: "JSON API",
      parameters: {
        email: "string (required) - Email address",
        id: "string (required) - Email ID",
      },
      response: "Email object with raw content and attachments",
      example: `curl -X GET "http://localhost:4000/json/test@domain.com/email-id"`,
    },
    {
      id: "list-accounts",
      method: "GET",
      path: "/json/listaccounts",
      title: "List All Accounts",
      description: "Returns array of all email addresses that received emails",
      category: "JSON API",
      parameters: {
        SHOW_ACCOUNT_LIST: "string (required) - Set to 'true' to enable listing",
      },
      response: "Array of email addresses",
      example: `curl -X GET "http://localhost:4000/json/listaccounts?SHOW_ACCOUNT_LIST=true"`,
    },
  ]

  const categories = [...new Set(endpoints.map((e) => e.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MailDelivery API Documentation</h1>
              <p className="text-gray-600">Complete API reference for temporary email service</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="font-medium text-sm text-gray-700 mb-2">{category}</h3>
                        <div className="space-y-1">
                          {endpoints
                            .filter((e) => e.category === category)
                            .map((endpoint) => (
                              <button
                                key={endpoint.id}
                                onClick={() => setSelectedEndpoint(endpoint.id)}
                                className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 ${
                                  selectedEndpoint === endpoint.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <Badge
                                    variant={
                                      endpoint.method === "GET"
                                        ? "secondary"
                                        : endpoint.method === "POST"
                                          ? "default"
                                          : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {endpoint.method}
                                  </Badge>
                                  <span className="truncate">{endpoint.title}</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="docker">Docker</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>API Overview</span>
                    </CardTitle>
                    <CardDescription>
                      MailDelivery provides a RESTful API for managing temporary email addresses and messages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Base URL</h3>
                      <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:4000</code>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Authentication</h3>
                      <p className="text-gray-600">
                        No authentication required. All endpoints are publicly accessible.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Response Format</h3>
                      <p className="text-gray-600">All responses are in JSON format unless specified otherwise.</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Rate Limiting</h3>
                      <p className="text-gray-600">
                        No rate limiting is currently enforced, but please use the API responsibly.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Data Models</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Email Object</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                          {`{
  "id": "string",
  "from": "string",
  "to": "string", 
  "subject": "string",
  "body": "string",
  "html": "string",
  "timestamp": "string",
  "read": "boolean",
  "starred": "boolean",
  "attachments": [
    {
      "id": "string",
      "filename": "string",
      "mimeType": "string",
      "size": "number",
      "url": "string"
    }
  ]
}`}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-medium">Temporary Email Object</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                          {`{
  "email": "string",
  "domain": "string",
  "expiresAt": "string"
}`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-6">
                {selectedEndpoint ? (
                  (() => {
                    const endpoint = endpoints.find((e) => e.id === selectedEndpoint)
                    if (!endpoint) return null

                    return (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  endpoint.method === "GET"
                                    ? "secondary"
                                    : endpoint.method === "POST"
                                      ? "default"
                                      : "destructive"
                                }
                              >
                                {endpoint.method}
                              </Badge>
                              <span>{endpoint.title}</span>
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(endpoint.example)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </div>
                          <CardDescription>{endpoint.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Endpoint</h4>
                            <code className="bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                          </div>

                          {endpoint.parameters && (
                            <div>
                              <h4 className="font-medium mb-2">Parameters</h4>
                              <div className="space-y-2">
                                {Object.entries(endpoint.parameters).map(([key, value]) => (
                                  <div key={key} className="flex">
                                    <code className="bg-blue-100 px-2 py-1 rounded mr-2 text-sm">{key}</code>
                                    <span className="text-sm text-gray-600">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {endpoint.requestBody && (
                            <div>
                              <h4 className="font-medium mb-2">Request Body</h4>
                              <div className="space-y-2">
                                {Object.entries(endpoint.requestBody).map(([key, value]) => (
                                  <div key={key} className="flex">
                                    <code className="bg-green-100 px-2 py-1 rounded mr-2 text-sm">{key}</code>
                                    <span className="text-sm text-gray-600">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="font-medium mb-2">Response</h4>
                            {typeof endpoint.response === "string" ? (
                              <p className="text-sm text-gray-600">{endpoint.response}</p>
                            ) : (
                              <div className="space-y-2">
                                {Object.entries(endpoint.response).map(([key, value]) => (
                                  <div key={key} className="flex">
                                    <code className="bg-yellow-100 px-2 py-1 rounded mr-2 text-sm">{key}</code>
                                    <span className="text-sm text-gray-600">{value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Example</h4>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                              {endpoint.example}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })()
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Select an endpoint</h3>
                      <p className="text-gray-600">Choose an endpoint from the sidebar to view its documentation</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="examples" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Common Usage Examples</CardTitle>
                    <CardDescription>Real-world examples of using the MailDelivery API</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">1. Create and Monitor Email</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {`# Create a new temporary email
curl -X POST http://localhost:4000/api/email/generate \\
  -H "Content-Type: application/json" \\
  -d '{}'

# Response: {"email":"abc123@domain.com","domain":"domain.com","expiresAt":"..."}

# Check for new emails every 10 seconds
while true; do
  curl -s "http://localhost:4000/api/email/list?email=abc123@domain.com" | jq .
  sleep 10
done`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">2. Download Email with Attachments</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {`# Get email list
EMAILS=$(curl -s "http://localhost:4000/json/test@domain.com")

# Extract email ID and attachment IDs
EMAIL_ID=$(echo $EMAILS | jq -r '.[0].id')
ATTACHMENT_ID=$(echo $EMAILS | jq -r '.[0].attachments[0].id')

# Download raw email
curl "http://localhost:4000/api/raw/test@domain.com/$EMAIL_ID" -o email.eml

# Download attachment
curl "http://localhost:4000/api/attachment/test@domain.com/$ATTACHMENT_ID" -o attachment.pdf`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">3. Cleanup Old Emails</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {`# Delete specific email
curl -X DELETE "http://localhost:4000/api/delete/test@domain.com/email-id"

# Delete entire email account
curl -X DELETE "http://localhost:4000/api/deleteaccount/test@domain.com"`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">4. JavaScript/Node.js Example</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {`// Create temporary email
const response = await fetch('http://localhost:4000/api/email/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ customEmail: 'mytest' })
});
const { email } = await response.json();

// Poll for emails
const checkEmails = async () => {
  const response = await fetch(\`http://localhost:4000/api/email/list?email=\${email}\`);
  const { emails } = await response.json();
  return emails;
};

// Check every 5 seconds
setInterval(async () => {
  const emails = await checkEmails();
  console.log(\`Received \${emails.length} emails\`);
}, 5000);`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="docker" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Docker Configuration</span>
                    </CardTitle>
                    <CardDescription>How to run MailDelivery with Docker</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Docker Run Command</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {`docker run -d \\
  --restart=unless-stopped \\
  --name privatetrashmail \\
  -e "DOMAINS=yourdomain.com,anotherdomain.com" \\
  -e "DATEFORMAT='D.M.YYYY HH:mm'" \\
  -e "ADMIN_PASSWORD=your_secure_password_here" \\
  -e "DISCARD_UNKNOWN=false" \\
  -e "DELETE_OLDER_THAN_DAYS=1" \\
  -p 4000:80 \\
  -p 25:25 \\
  -v /path/to/data:/var/www/opentrashmail/data \\
  maildelivery:latest`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Environment Variables</h4>
                      <div className="space-y-2">
                        <div className="flex">
                          <code className="bg-blue-100 px-2 py-1 rounded mr-2 text-sm">DOMAINS</code>
                          <span className="text-sm text-gray-600">
                            Comma-separated list of domains to accept emails for
                          </span>
                        </div>
                        <div className="flex">
                          <code className="bg-blue-100 px-2 py-1 rounded mr-2 text-sm">ADMIN_PASSWORD</code>
                          <span className="text-sm text-gray-600">Password for admin panel access</span>
                        </div>
                        <div className="flex">
                          <code className="bg-blue-100 px-2 py-1 rounded mr-2 text-sm">DELETE_OLDER_THAN_DAYS</code>
                          <span className="text-sm text-gray-600">Days to keep emails before auto-deletion</span>
                        </div>
                        <div className="flex">
                          <code className="bg-blue-100 px-2 py-1 rounded mr-2 text-sm">DISCARD_UNKNOWN</code>
                          <span className="text-sm text-gray-600">Whether to discard emails to unknown domains</span>
                        </div>
                        <div className="flex">
                          <code className="bg-blue-100 px-2 py-1 rounded mr-2 text-sm">DATEFORMAT</code>
                          <span className="text-sm text-gray-600">Date format for display</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Docker Compose</h4>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                        {`version: '3.8'

services:
  maildelivery:
    build: .
    container_name: privatemaildelivery
    restart: unless-stopped
    ports:
      - "4000:80"
      - "25:25"
    environment:
      - DOMAINS=yourdomain.com
      - ADMIN_PASSWORD=your_secure_password_here
      - DELETE_OLDER_THAN_DAYS=1
      - DISCARD_UNKNOWN=false
    volumes:
      - ./data:/var/www/opentrashmail/data`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Port Configuration</h4>
                      <div className="space-y-2">
                        <div className="flex">
                          <code className="bg-green-100 px-2 py-1 rounded mr-2 text-sm">80</code>
                          <span className="text-sm text-gray-600">Web interface and API</span>
                        </div>
                        <div className="flex">
                          <code className="bg-green-100 px-2 py-1 rounded mr-2 text-sm">25</code>
                          <span className="text-sm text-gray-600">SMTP server for receiving emails</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
