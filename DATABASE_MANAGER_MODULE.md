# Database Manager Pro - Admin Module Specification

## 🎯 Overview

**Purpose:** Comprehensive database management panel for administrators to perform advanced operations on email data, user accounts, and system maintenance.

**Target Users:** System administrators, Database administrators, Support team

**Databases Supported:** 
- SQLite (Current)
- PostgreSQL (Future)

**Access Level:** Admin only (role='admin')

---

## 📐 Architecture

### Directory Structure
```
app/admin/database/
├── layout.tsx                    # Database Manager layout with sidebar
├── page.tsx                      # Dashboard overview
├── search/
│   └── page.tsx                 # Advanced email search
├── bulk-operations/
│   ├── page.tsx                 # Bulk operation interface
│   └── components/
│       ├── delete-panel.tsx     # Mass delete operations
│       ├── update-panel.tsx     # Mass update operations
│       └── preview-modal.tsx    # Preview before execution
├── analytics/
│   ├── page.tsx                 # Database analytics dashboard
│   └── components/
│       ├── storage-chart.tsx    # Storage usage visualization
│       ├── email-trends.tsx     # Email volume trends
│       └── performance-metrics.tsx
├── maintenance/
│   ├── page.tsx                 # Database maintenance tools
│   └── components/
│       ├── vacuum-tool.tsx      # Vacuum/optimize database
│       ├── index-manager.tsx    # Index rebuild & analysis
│       └── integrity-check.tsx  # Database integrity verification
├── backup/
│   ├── page.tsx                 # Backup & restore interface
│   └── components/
│       ├── backup-panel.tsx     # Create backups
│       ├── restore-panel.tsx    # Restore from backups
│       └── schedule-manager.tsx # Backup schedules
├── content-manager/
│   ├── page.tsx                 # Email content management
│   └── components/
│       ├── batch-editor.tsx     # Batch edit email content
│       └── attachment-manager.tsx
├── spam-manager/
│   ├── page.tsx                 # Spam analysis & management
│   └── components/
│       ├── spam-analyzer.tsx    # Analyze spam patterns
│       └── filter-builder.tsx   # Create spam filters
├── accounts/
│   ├── page.tsx                 # User account management
│   └── components/
│       ├── account-search.tsx   # Search users
│       └── bulk-account-ops.tsx # Bulk user operations
├── query-builder/
│   ├── page.tsx                 # Visual SQL builder
│   └── components/
│       ├── query-editor.tsx     # Visual query interface
│       └── saved-queries.tsx    # Save & load queries
└── monitor/
    ├── page.tsx                 # Real-time system monitor
    └── components/
        ├── live-dashboard.tsx   # Real-time metrics
        └── alert-manager.tsx    # Alert configuration
```

### Component Library
```typescript
// Reusable components
components/database/
├── data-table.tsx              # Advanced data table with filters
├── sql-viewer.tsx              # Syntax-highlighted SQL viewer
├── execution-log.tsx           # Operation execution log
├── confirmation-dialog.tsx     # Dangerous operation confirmation
└── export-button.tsx           # Export data (CSV, JSON, SQL)
```

---

## 🔍 Feature 1: Advanced Email Search

### Search Interface

```typescript
interface EmailSearchFilter {
  // Basic filters
  from?: string                   // Email address or pattern
  to?: string                     // Email address or pattern
  subject?: string                // Text search in subject
  body?: string                   // Text search in body
  
  // Advanced filters
  hasAttachment?: boolean
  attachmentType?: string[]       // ['pdf', 'jpg', 'doc']
  attachmentName?: string         // Attachment filename pattern
  
  // Status filters
  starred?: boolean
  isRead?: boolean
  isSpam?: boolean
  
  // Date filters
  dateFrom?: Date
  dateTo?: Date
  createdBefore?: Date
  createdAfter?: Date
  
  // Size filters
  sizeMin?: number                // bytes
  sizeMax?: number                // bytes
  
  // Score filters
  spamScoreMin?: number
  spamScoreMax?: number
  
  // Pattern matching
  messageId?: string
  headers?: Record<string, string>
  
  // Boolean operators
  operator?: 'AND' | 'OR'
  
  // Result options
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'size' | 'from' | 'subject'
  sortOrder?: 'ASC' | 'DESC'
}
```

### UI Components

```tsx
// app/admin/database/search/page.tsx
export default function DatabaseSearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Advanced Email Search"
        description="Search emails with powerful filters and patterns"
      />
      
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="From address (wildcards: *)" />
            <Input placeholder="To address (wildcards: *)" />
            <Input placeholder="Subject contains..." />
            <Input placeholder="Body contains..." />
          </div>
          
          {/* Advanced Filters (Collapsible) */}
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Filters</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <DatePicker label="From Date" />
                    <DatePicker label="To Date" />
                  </div>
                  
                  {/* Attachment Filters */}
                  <div className="flex items-center gap-4">
                    <Checkbox label="Has Attachments" />
                    <Select placeholder="Attachment Type">
                      <option>PDF</option>
                      <option>Image (jpg, png)</option>
                      <option>Document (doc, docx)</option>
                    </Select>
                  </div>
                  
                  {/* Size Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" placeholder="Min size (KB)" />
                    <Input type="number" placeholder="Max size (KB)" />
                  </div>
                  
                  {/* Status Filters */}
                  <div className="flex gap-4">
                    <Checkbox label="Starred Only" />
                    <Checkbox label="Unread Only" />
                    <Checkbox label="Include Spam" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Search Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button onClick={saveQuery}>
                Save Query
              </Button>
              <Button onClick={executeSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {results.length} emails matching your criteria
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportJSON}>
                Export JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={emailColumns}
            data={results}
            pagination
            selection
            onSelectionChange={setSelectedEmails}
          />
        </CardContent>
      </Card>
      
      {/* Bulk Actions on Selection */}
      {selectedEmails.length > 0 && (
        <Card className="border-blue-500">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {selectedEmails.length} emails selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={bulkMarkRead}>
                  Mark as Read
                </Button>
                <Button variant="outline" onClick={bulkStar}>
                  Star All
                </Button>
                <Button variant="destructive" onClick={bulkDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### API Endpoints

```typescript
// app/api/admin/database/search/route.ts
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  
  const filter: EmailSearchFilter = await request.json()
  
  // Build dynamic SQL query
  const query = buildSearchQuery(filter)
  const results = await db.query(query)
  
  // Log search for audit
  await auditLog.create({
    user: auth.user.id,
    action: 'DATABASE_SEARCH',
    filter: filter,
    resultCount: results.length
  })
  
  return NextResponse.json({
    success: true,
    results,
    count: results.length,
    query: query.sql // Show generated SQL
  })
}

function buildSearchQuery(filter: EmailSearchFilter) {
  let sql = 'SELECT * FROM emails WHERE 1=1'
  const params: any[] = []
  
  // Pattern matching with wildcards
  if (filter.from) {
    sql += ` AND from_address LIKE ?`
    params.push(filter.from.replace('*', '%'))
  }
  
  if (filter.to) {
    sql += ` AND to_address LIKE ?`
    params.push(filter.to.replace('*', '%'))
  }
  
  // Full-text search
  if (filter.subject) {
    sql += ` AND subject LIKE ?`
    params.push(`%${filter.subject}%`)
  }
  
  if (filter.body) {
    // For PostgreSQL: use to_tsvector
    // For SQLite: use LIKE or FTS5
    sql += ` AND body LIKE ?`
    params.push(`%${filter.body}%`)
  }
  
  // Date range
  if (filter.dateFrom) {
    sql += ` AND created_at >= ?`
    params.push(filter.dateFrom)
  }
  
  if (filter.dateTo) {
    sql += ` AND created_at <= ?`
    params.push(filter.dateTo)
  }
  
  // Boolean filters
  if (filter.starred !== undefined) {
    sql += ` AND starred = ?`
    params.push(filter.starred ? 1 : 0)
  }
  
  if (filter.isRead !== undefined) {
    sql += ` AND is_read = ?`
    params.push(filter.isRead ? 1 : 0)
  }
  
  // Size range
  if (filter.sizeMin) {
    sql += ` AND size >= ?`
    params.push(filter.sizeMin)
  }
  
  if (filter.sizeMax) {
    sql += ` AND size <= ?`
    params.push(filter.sizeMax)
  }
  
  // Attachments
  if (filter.hasAttachment) {
    sql += ` AND id IN (SELECT email_id FROM attachments)`
  }
  
  // Sorting
  sql += ` ORDER BY ${filter.sortBy || 'created_at'} ${filter.sortOrder || 'DESC'}`
  
  // Pagination
  sql += ` LIMIT ${filter.limit || 100} OFFSET ${filter.offset || 0}`
  
  return { sql, params }
}
```

---

## ⚡ Feature 2: Bulk Operations

### Delete Operations

```tsx
// app/admin/database/bulk-operations/page.tsx
export default function BulkOperationsPage() {
  const [operation, setOperation] = useState<'delete' | 'update'>('delete')
  const [preview, setPreview] = useState<any[]>([])
  const [executing, setExecuting] = useState(false)
  
  return (
    <div className="space-y-6">
      <PageHeader title="Bulk Operations" />
      
      <Tabs value={operation} onValueChange={setOperation}>
        <TabsList>
          <TabsTrigger value="delete">Delete Operations</TabsTrigger>
          <TabsTrigger value="update">Update Operations</TabsTrigger>
        </TabsList>
        
        {/* Delete Tab */}
        <TabsContent value="delete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Delete Emails</CardTitle>
              <CardDescription>
                Delete multiple emails based on criteria. Preview before execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delete by Pattern */}
              <div className="space-y-2">
                <Label>Delete by Email Pattern</Label>
                <div className="flex gap-2">
                  <Input placeholder="*@spam.com" />
                  <Button onClick={previewDelete}>Preview</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use * as wildcard. Example: *@domain.com, spam*, *@*.ru
                </p>
              </div>
              
              {/* Delete by Keyword */}
              <div className="space-y-2">
                <Label>Delete by Keyword in Subject/Body</Label>
                <Input placeholder="viagra, casino, lottery" />
                <p className="text-xs text-muted-foreground">
                  Comma-separated keywords. Case-insensitive.
                </p>
              </div>
              
              {/* Delete by Date */}
              <div className="space-y-2">
                <Label>Delete by Age</Label>
                <Select>
                  <option>Older than 90 days</option>
                  <option>Older than 180 days</option>
                  <option>Older than 1 year</option>
                  <option>Custom date range</option>
                </Select>
              </div>
              
              {/* Delete by Size */}
              <div className="space-y-2">
                <Label>Delete Large Emails</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Larger than</span>
                  <Input type="number" className="w-24" defaultValue="10" />
                  <span className="text-sm">MB</span>
                </div>
              </div>
              
              {/* Safety Options */}
              <div className="space-y-2">
                <Label>Safety Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="keep-starred" defaultChecked />
                    <label htmlFor="keep-starred">
                      Keep starred emails (recommended)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="keep-unread" />
                    <label htmlFor="keep-unread">
                      Keep unread emails
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Preview Results */}
          {preview.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600">
                  ⚠️ Preview: {preview.length} emails will be deleted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable 
                  columns={previewColumns}
                  data={preview.slice(0, 10)}
                  pagination={false}
                />
                {preview.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 10 of {preview.length} emails
                  </p>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setPreview([])}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={executeDelete}
                    disabled={executing}
                  >
                    {executing ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Update Tab */}
        <TabsContent value="update" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Update Emails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Field</Label>
                <Select>
                  <option>Mark as Read</option>
                  <option>Mark as Unread</option>
                  <option>Star</option>
                  <option>Unstar</option>
                  <option>Mark as Spam</option>
                  <option>Not Spam</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Filter (which emails to update)</Label>
                <Textarea 
                  placeholder="Leave empty to update all, or specify filters..."
                  rows={3}
                />
              </div>
              
              <Button onClick={executeUpdate}>
                Preview Update
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Execution Log */}
      <Card>
        <CardHeader>
          <CardTitle>Operation History</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionLog operations={recentOperations} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### API Implementation

```typescript
// app/api/admin/database/bulk-delete/route.ts
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  
  const { 
    filter, 
    keepStarred = true, 
    keepUnread = false,
    preview = false 
  } = await request.json()
  
  // Build delete query
  let sql = 'SELECT * FROM emails WHERE 1=1'
  
  if (filter.pattern) {
    sql += ` AND (from_address LIKE ? OR to_address LIKE ?)`
  }
  
  if (filter.keywords) {
    const keywords = filter.keywords.split(',').map(k => k.trim())
    const conditions = keywords.map(() => 
      '(subject LIKE ? OR body LIKE ?)'
    ).join(' OR ')
    sql += ` AND (${conditions})`
  }
  
  if (filter.olderThan) {
    sql += ` AND created_at < datetime('now', '-${filter.olderThan} days')`
  }
  
  if (filter.sizeGreaterThan) {
    sql += ` AND size > ${filter.sizeGreaterThan * 1024 * 1024}`
  }
  
  // Safety filters
  if (keepStarred) {
    sql += ` AND starred = 0`
  }
  
  if (keepUnread) {
    sql += ` AND is_read = 1`
  }
  
  // Preview mode: just count
  if (preview) {
    const results = await db.all(sql)
    return NextResponse.json({
      success: true,
      preview: results,
      count: results.length,
      sql: sql
    })
  }
  
  // Execute delete
  const deleteSQL = sql.replace('SELECT *', 'DELETE')
  const result = await db.run(deleteSQL)
  
  // Audit log
  await auditLog.create({
    user: auth.user.id,
    action: 'BULK_DELETE',
    filter: filter,
    affected: result.changes,
    timestamp: new Date()
  })
  
  return NextResponse.json({
    success: true,
    deleted: result.changes
  })
}
```

---

## 📊 Feature 3: Database Analytics

### Dashboard UI

```tsx
// app/admin/database/analytics/page.tsx
export default function DatabaseAnalyticsPage() {
  const { data: stats } = useQuery('db-stats', fetchDatabaseStats)
  
  return (
    <div className="space-y-6">
      <PageHeader title="Database Analytics" />
      
      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Emails
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmails}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.emailsToday} today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Storage Used
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.storageGB} GB</div>
            <Progress value={stats.storagePercent} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Accounts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAccounts} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Database Health
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.healthScore}/100
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.healthStatus}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Email Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Email Volume Trend</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTrendsChart data={stats.emailTrends} />
        </CardContent>
      </Card>
      
      {/* Storage Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Storage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StoragePieChart data={stats.storageBreakdown} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Sender Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <TopDomainsChart data={stats.topSenders} />
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Query Time</span>
              <span className="font-mono">{stats.avgQueryTime}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Index Hit Rate</span>
              <span className="font-mono">{stats.indexHitRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Hit Rate</span>
              <span className="font-mono">{stats.cacheHitRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Fragmentation</span>
              <span className="font-mono">{stats.fragmentation}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Slow Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Slow Queries (>500ms)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={slowQueryColumns}
            data={stats.slowQueries}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🛠️ Feature 4: Database Maintenance

```tsx
// app/admin/database/maintenance/page.tsx
export default function MaintenancePage() {
  const [running, setRunning] = useState<string | null>(null)
  
  return (
    <div className="space-y-6">
      <PageHeader title="Database Maintenance" />
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Maintenance Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => runMaintenance('vacuum')}
              disabled={running === 'vacuum'}
            >
              {running === 'vacuum' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running VACUUM...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  VACUUM Database
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => runMaintenance('analyze')}
              disabled={running === 'analyze'}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              ANALYZE Statistics
            </Button>
            
            <Button 
              onClick={() => runMaintenance('reindex')}
              disabled={running === 'reindex'}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              REINDEX All
            </Button>
            
            <Button 
              onClick={() => runMaintenance('integrity')}
              disabled={running === 'integrity'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Integrity Check
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              Maintenance operations may take several minutes. 
              Database will remain accessible but performance may be impacted.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Scheduled Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily VACUUM</p>
                <p className="text-sm text-muted-foreground">
                  Runs at 3:00 AM daily
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly REINDEX</p>
                <p className="text-sm text-muted-foreground">
                  Runs at 3:00 AM every Sunday
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Partition Cleanup</p>
                <p className="text-sm text-muted-foreground">
                  Runs at 2:00 AM on 1st of month
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={maintenanceColumns}
            data={maintenanceHistory}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 💾 Feature 5: Backup & Restore

```tsx
// app/admin/database/backup/page.tsx
export default function BackupPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Backup & Restore" />
      
      {/* Create Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Backup Type</Label>
            <RadioGroup defaultValue="full">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full Backup (all data)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incremental" id="incremental" />
                <Label htmlFor="incremental">Incremental (changes only)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schema" id="schema" />
                <Label htmlFor="schema">Schema Only</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label>Backup Name</Label>
            <Input 
              placeholder="mailsystem-backup-20241013"
              defaultValue={`mailsystem-backup-${new Date().toISOString().split('T')[0]}`}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="compress" defaultChecked />
            <Label htmlFor="compress">Compress backup (recommended)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="encrypt" />
            <Label htmlFor="encrypt">Encrypt backup (requires password)</Label>
          </div>
          
          <Button onClick={createBackup}>
            <Save className="mr-2 h-4 w-4" />
            Create Backup
          </Button>
        </CardContent>
      </Card>
      
      {/* Backup List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Available Backups</CardTitle>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload Backup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={backupColumns}
            data={backups}
            actions={(backup) => (
              <>
                <Button size="sm" onClick={() => downloadBackup(backup.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => restoreBackup(backup.id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteBackup(backup.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          />
        </CardContent>
      </Card>
      
      {/* Backup Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Backup</Label>
                <Select defaultValue="02:00">
                  <option>00:00</option>
                  <option>02:00</option>
                  <option>04:00</option>
                  <option>Disabled</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Retention (days)</Label>
                <Input type="number" defaultValue="7" />
              </div>
            </div>
            
            <Button>Save Schedule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎯 Starred Email Protection Implementation

### Database Query Update

```typescript
// lib/email-service.ts

/**
 * Delete old emails with starred protection
 */
export async function deleteOldEmails(retentionDays = 90) {
  const db = await getDb()
  
  const result = await db.run(`
    DELETE FROM emails 
    WHERE created_at < datetime('now', '-${retentionDays} days')
      AND starred = 0          -- ✅ Protect starred emails
      AND archived = 0         -- Keep archived emails
  `)
  
  console.log(`🗑️ Deleted ${result.changes} old emails (kept starred)`)
  
  return result.changes
}

/**
 * Get retention info for email
 */
export function getEmailRetentionInfo(email: Email) {
  const createdAt = new Date(email.created_at)
  const now = new Date()
  const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (email.starred) {
    return {
      willDelete: false,
      reason: 'Starred emails are never deleted',
      daysUntilDeletion: null
    }
  }
  
  if (email.archived) {
    const archiveRetention = 180
    return {
      willDelete: ageInDays >= archiveRetention,
      reason: 'Archived emails kept for 180 days',
      daysUntilDeletion: Math.max(0, archiveRetention - ageInDays)
    }
  }
  
  const normalRetention = 90
  return {
    willDelete: ageInDays >= normalRetention,
    reason: 'Normal emails kept for 90 days',
    daysUntilDeletion: Math.max(0, normalRetention - ageInDays)
  }
}
```

### Admin Panel UI

```tsx
// components/email-retention-badge.tsx
export function EmailRetentionBadge({ email }: { email: Email }) {
  const info = getEmailRetentionInfo(email)
  
  if (!info.willDelete) {
    return (
      <Badge variant="success">
        <Star className="mr-1 h-3 w-3" />
        {info.reason}
      </Badge>
    )
  }
  
  if (info.daysUntilDeletion && info.daysUntilDeletion > 7) {
    return (
      <Badge variant="secondary">
        Expires in {info.daysUntilDeletion} days
      </Badge>
    )
  }
  
  return (
    <Badge variant="destructive">
      ⚠️ Expires in {info.daysUntilDeletion} days
    </Badge>
  )
}
```

### Retention Settings Page

```tsx
// app/admin/database/settings/retention/page.tsx
export default function RetentionSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Retention Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="font-medium">Starred Emails</p>
                <p className="text-sm text-muted-foreground">
                  Important emails you want to keep
                </p>
              </div>
            </div>
            <Badge variant="success">Never Delete</Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Archive className="h-8 w-8" />
              <div>
                <p className="font-medium">Archived Emails</p>
                <p className="text-sm text-muted-foreground">
                  Emails moved to archive
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="180" className="w-20" />
              <span>days</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Mail className="h-8 w-8" />
              <div>
                <p className="font-medium">Normal Emails</p>
                <p className="text-sm text-muted-foreground">
                  Regular emails
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="90" className="w-20" />
              <span>days</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-medium">Spam Emails</p>
                <p className="text-sm text-muted-foreground">
                  Emails marked as spam
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="7" className="w-20" />
              <span>days</span>
            </div>
          </div>
        </div>
        
        <Button>Save Retention Rules</Button>
      </CardContent>
    </Card>
  )
}
```

---

## 📦 Implementation Priority & Timeline

### Phase 1: Core Features (Week 1-2)
- [ ] Advanced Search
- [ ] Bulk Delete Operations  
- [ ] Basic Analytics Dashboard
- [ ] Starred Email Protection

### Phase 2: Management Tools (Week 3-4)
- [ ] Database Maintenance
- [ ] Backup & Restore
- [ ] Bulk Update Operations
- [ ] Account Manager

### Phase 3: Advanced Features (Week 5-6)
- [ ] Query Builder
- [ ] Real-time Monitor
- [ ] Content Manager
- [ ] Spam Manager

### Phase 4: Polish & Optimization (Week 7-8)
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Documentation
- [ ] Testing

---

## 🔒 Security Considerations

```typescript
// Middleware for database operations
export async function requireDatabaseAccess(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth.error) return auth.error
  
  // Check specific permission
  if (!hasPermission(auth.user, 'DATABASE_MANAGEMENT')) {
    return NextResponse.json(
      { error: 'Insufficient permissions for database operations' },
      { status: 403 }
    )
  }
  
  return { user: auth.user }
}

// Audit log for sensitive operations
export async function logDatabaseOperation(
  user: User,
  operation: string,
  details: any,
  affected: number
) {
  await db.run(`
    INSERT INTO audit_log (
      user_id, username, operation, details, affected_rows, timestamp
    ) VALUES (?, ?, ?, ?, ?, datetime('now'))
  `, [user.id, user.username, operation, JSON.stringify(details), affected])
}
```

---

**Document Version:** 1.0  
**Last Updated:** October 13, 2025  
**Author:** System Architect  
**Status:** Ready for Implementation
