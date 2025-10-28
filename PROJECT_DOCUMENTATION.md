# Compound - Marketing Agency Dashboard

## Complete Project Documentation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Why We Built This](#why-we-built-this)
3. [What It Does](#what-it-does)
4. [How It Helps](#how-it-helps)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Complete Feature List](#complete-feature-list)
7. [Page & Route Map](#page--route-map)
8. [Workflows](#workflows)
9. [Integrations](#integrations)
10. [Technical Stack](#technical-stack)
11. [Security Features](#security-features)

---

## 🎯 Overview

**Compound** is a comprehensive **Social Media Marketing Management Dashboard** designed for marketing agencies to manage their clients' Twitter/X content approval workflows, analytics tracking, and performance monitoring.

### Core Value Proposition

A unified platform where marketing agencies can:
- Manage multiple client accounts from one dashboard
- Streamline content approval workflows
- Track and analyze Twitter/X performance metrics
- Export/import data via Excel for offline editing
- Provide clients with self-service approval interfaces

---

## 💡 Why We Built This

### The Problem

Marketing agencies managing social media for multiple clients face several challenges:

1. **Scattered Tools**: Content creation, approval, scheduling, and analytics spread across multiple platforms
2. **Manual Approvals**: Email threads and messaging apps for content approval create bottlenecks
3. **Data Silos**: Twitter analytics downloaded manually, shared via spreadsheets, no historical tracking
4. **Client Visibility**: Clients lack real-time access to content and performance data
5. **Workflow Inefficiency**: No centralized system to track post status through approval pipeline
6. **Reporting Overhead**: Manual report generation for each client consumes hours weekly

### The Solution

Compound centralizes the entire content approval and analytics workflow:

- **Single Platform**: All clients, posts, and analytics in one place
- **Automated Workflow**: Posts move through approval stages with clear status tracking
- **Self-Service Client Portal**: Clients log in, review posts, approve/reject instantly
- **Centralized Analytics**: Upload Twitter CSV data once, view historical trends forever
- **Excel Integration**: Export posts, update offline, import changes back
- **Time Savings**: Reduce reporting and approval time by 70%+

---

## 🚀 What It Does

### Primary Functions

#### 1. **Client Management**
- Create and manage multiple client profiles
- Link CLIENT users to their respective client profiles
- Track all client activity and metrics
- Deactivate/activate client accounts

#### 2. **Content Approval Workflow**
- Agency creates posts with Typefully links
- Posts automatically sent to clients for approval
- Clients approve, reject, or request changes
- Status tracking: PENDING → APPROVED → SCHEDULED → PUBLISHED
- Feedback loop preserved at every stage

#### 3. **Analytics Management**
- Import Twitter analytics via CSV upload
- Historical data storage with date-range filtering
- Visualize metrics: Impressions, Engagements, Followers, CTR
- Period-over-period comparison (current vs previous period)
- Export analytics to Excel for presentations

#### 4. **Excel Integration**
- Export all posts to Excel workbook
- Edit status and feedback offline
- Import updated Excel to sync with database
- Bi-directional data flow

#### 5. **Writer Workflow** (NEW)
- Mark approved posts as PUBLISHED with tweet URL
- Track external feedback via timestamped notes
- Mark SUGGEST_CHANGES posts as updated after fixes
- Agency/admin buttons for post lifecycle management

#### 6. **Database Backup System** (NEW)
- 4-layer backup strategy (Railway, Local, Google Drive, Admin UI)
- On-demand and scheduled backups
- One-click restore from admin panel
- 30-day retention with auto-cleanup

---

## 🎁 How It Helps

### For Marketing Agencies

**Time Savings:**
- Reduce client approval time from hours to minutes
- Eliminate email chains for content approvals
- Automate analytics report generation
- Bulk edit posts via Excel import

**Better Organization:**
- All clients' data in one centralized dashboard
- Clear visibility into approval pipeline
- Track post history and feedback
- Upload tracking with data lineage

**Scalability:**
- Manage 10+ clients without increasing overhead
- Consistent workflow across all clients
- Role-based access ensures data isolation

**Data-Driven Insights:**
- Compare performance across clients
- Identify top-performing content types
- Track engagement rate trends
- Export custom reports instantly

### For Clients

**Transparency:**
- Real-time access to content pipeline
- See exactly what will be posted and when
- Review historical analytics anytime

**Control:**
- Approve or reject posts with feedback
- Request specific changes
- Track post status from creation to publication

**Convenience:**
- No need for email approvals
- Self-service dashboard 24/7
- Simple, intuitive interface

### For Admins

**System Oversight:**
- Monitor all agencies and clients
- Access cross-platform analytics
- Manage users and permissions
- Database backup and restore capabilities

---

## 👥 User Roles & Permissions

### 1. AGENCY Role

**Access Level:** Full administrative control over managed clients

**Capabilities:**
- ✅ Create, edit, delete client accounts
- ✅ Upload CSV analytics for any client
- ✅ Create posts for any client
- ✅ View all posts across all clients
- ✅ Update post statuses and feedback
- ✅ Export/import Excel reports
- ✅ View analytics for all clients
- ✅ Generate client-specific reports
- ✅ Link CLIENT users to client profiles
- ✅ Mark posts as published with tweet URLs
- ✅ Add timestamped notes to posts

**Key Pages:**
- `/dashboard` - Agency dashboard
- `/dashboard/clients` - Client management
- `/dashboard/posts` - Post management
- `/dashboard/upload` - Analytics upload
- `/dashboard/analytics` - Analytics viewing
- `/dashboard/excel` - Excel operations
- `/dashboard/import-posts` - Bulk import

### 2. CLIENT Role

**Access Level:** View own data, approve posts

**Capabilities:**
- ✅ View own posts only
- ✅ Approve posts
- ✅ Reject posts with feedback
- ✅ Suggest changes to posts
- ✅ View own analytics data
- ❌ Cannot create posts
- ❌ Cannot upload analytics
- ❌ Cannot see other clients' data
- ❌ Cannot export data

**Key Pages:**
- `/client` - Client dashboard
- `/client/posts` - Post review & approval
- `/client/analytics` - View own analytics

### 3. ADMIN Role

**Access Level:** God-mode across entire platform

**Capabilities:**
- ✅ All AGENCY capabilities
- ✅ View all agencies and their clients
- ✅ System-wide analytics
- ✅ User management (create, edit, delete users)
- ✅ Deactivate/activate client accounts
- ✅ Database management
- ✅ Database backup & restore
- ✅ Upload history across all agencies
- ✅ Cross-platform reporting
- ✅ Access to admin utilities

**Key Pages:**
- `/admin` - Admin dashboard
- `/admin/analytics` - System analytics
- `/admin/users` - User management
- `/admin/clients` - All clients view
- `/admin/posts` - All posts view
- `/admin/uploads` - Upload history
- `/admin/backups` - Backup management
- `/admin/database` - Database tools

**Security:**
- Admins bypass agency ownership checks
- Can perform actions on any client's data
- Access to sensitive system operations
- Blocked clients cannot log in

---

## 📦 Complete Feature List

### 🏢 CLIENT MANAGEMENT

**Create Clients** (`/dashboard/clients`, `/admin/clients`)
- Add client name, email, Twitter handle
- Optional timezone configuration (for scheduling)
- Option to auto-create CLIENT user account
- Manual password generation for client accounts

**Edit Clients**
- Update client information
- Change Twitter handle
- Modify timezone settings
- Update contact details

**Delete Clients**
- Cascading delete (removes all posts, analytics, uploads)
- Confirmation dialog to prevent accidents
- Data integrity maintained

**Client-User Linking**
- Link existing CLIENT users to client profiles
- Auto-link utility matches by email
- Required for CLIENT role dashboard access
- Manual link API for complex scenarios

**Client Deactivation** (Admin only)
- Set client.active = false
- Blocks client login via auth layer
- Preserves data for reactivation

### 📊 ANALYTICS MANAGEMENT

**Upload Twitter Analytics** (`/dashboard/upload`)
- CSV file upload via drag-and-drop
- Select target client
- Automatic parsing with validation
- Supports Twitter's native CSV export format
- Columns: Date, Impressions, Engagements, Likes, Retweets, Replies, etc.
- Upload tracking with filename and timestamp
- Deduplication (replaces existing data for same date range)

**View Analytics** (`/dashboard/analytics`, `/client/analytics`, `/admin/analytics`)
- Date range filters: 7 days, 30 days, 90 days, All time
- Chart types: Line, Bar, Area charts
- Key metrics cards:
  - Total Impressions
  - Total Engagements
  - Average Engagement Rate
  - Profile Clicks, URL Clicks, Follows
- Engagement distribution pie chart (Likes, Retweets, Replies)
- Toggle between number and percentage views

**Period Comparison**
- Compare current period vs previous identical period
- Automatic growth % calculation for:
  - Impressions growth
  - Engagements growth
  - Engagement rate change
  - Followers growth
- Trend indicators (↑ up, ↓ down, → neutral)

**Export Analytics**
- Download as Excel (.xlsx) file
- Includes all metrics and calculations
- Ready for client presentations

### 📝 POST MANAGEMENT

**Create Posts** (`/dashboard/posts`)
- Post content text area
- Typefully URL (required - links to draft/schedule)
- Optional scheduled date/time picker
- Client selection dropdown
- Timezone-aware scheduling
- Posts default to PENDING status

**View Posts** (`/dashboard/posts`, `/client/posts`, `/admin/posts`)
- List view with all post details
- Status badges (color-coded)
- Filter by client (agency/admin)
- Filter by status (Pending, Approved, Rejected, etc.)
- Scheduled date display in client's timezone
- Typefully link (opens in new tab)

**Edit Posts** (Agency/Admin only)
- Update content
- Change Typefully URL
- Modify scheduled date/time
- Cannot change client assignment

**Delete Posts** (Agency/Admin only)
- Confirmation dialog
- Permanent deletion
- No cascade effects

**Approve/Reject Posts** (Client/Admin)
- Approve button → Status: APPROVED
- Reject button → Status: REJECTED + required feedback
- Suggest Changes → Status: SUGGEST_CHANGES + required feedback
- Feedback preserved across status changes

**Writer Workflow Actions** (Agency/Admin)
- **Mark as Published**: APPROVED → PUBLISHED + optional tweet URL
- **Changes Done**: SUGGEST_CHANGES → PENDING (after client feedback addressed)
- **Add Note**: Add timestamped notes from external feedback (Telegram, email, etc.)

**Bulk Import** (`/dashboard/import-posts`)
- Import from Google Sheets CSV export
- Columns: Date, Topic Outline, Format, Typefully Draft Link, Time, etc.
- Automatic post creation for selected client
- Error handling with detailed messages

### 📁 EXCEL INTEGRATION

**Export Posts** (`/dashboard/excel`)
- Download all posts as Excel workbook
- Columns: Client Name, Content, Typefully URL, Scheduled Date, Status, Feedback, Timestamps
- Ready for offline editing

**Import Updated Excel** (`/dashboard/excel`)
- Upload modified Excel file
- Updates post status and feedback
- Row-by-row validation
- Status validation (PENDING, APPROVED, REJECTED, SCHEDULED, PUBLISHED)
- Error reporting for invalid rows
- Skips invalid rows, processes valid ones

**Client-Specific Export** (`/dashboard/excel`)
- Generate Excel report for single client
- Filtered to client's posts only
- Same columns as full export

### 🏠 DASHBOARDS

**Agency Dashboard** (`/dashboard`)
- Total Clients count (clickable)
- Total Posts count (clickable)
- Pending Approvals count (clickable)
- Data Uploads count (clickable)
- Quick action buttons:
  - Add New Client
  - Create Post
  - Upload Analytics
  - View Reports
- Recent activity feed

**Client Dashboard** (`/client`)
- Total Posts count (clickable)
- Pending Approvals count (clickable)
- Analytics Records count (clickable)
- Quick actions:
  - Review Posts
  - View Analytics
- Workflow instructions

**Admin Dashboard** (`/admin`)
- System-wide statistics:
  - Total Users (all roles)
  - Total Agencies
  - Total Clients
  - Total Posts
  - Scheduled Posts (from current date forward)
  - Upload Count
- Quick actions:
  - User Management
  - View All Clients
  - System Analytics
  - Database Management
  - Backup System
- Recent activity across platform

### 👤 USER MANAGEMENT (Admin only)

**View Users** (`/admin/users`)
- List all users (AGENCY, CLIENT, ADMIN)
- Display: Name, Email, Role, Created Date
- Filter by role
- Search by email

**Create Users** (`/admin/users`)
- Create new users of any role
- Set initial password
- Email validation
- Automatic bcrypt hashing

**Edit Users** (`/admin/users`)
- Update name, email
- Change role
- Reset password

**Delete Users** (`/admin/users`)
- Confirmation dialog
- Cascading considerations for AGENCY users
- Cannot delete if user has active clients

### 💾 BACKUP SYSTEM (Admin only)

**Create Backups** (`/admin/backups`)
- On-demand backup creation
- Downloads full database dump from Railway
- Saves to local `backups/` directory
- Automatic upload to Google Drive (if configured)
- Timestamped filenames
- Size display (MB)

**View Backups** (`/admin/backups`)
- List all available backups
- Sort by date (newest first)
- Display: Filename, Size, Created Date
- Total backups count
- Latest backup timestamp
- 30-day retention indicator

**Restore Backups** (`/admin/backups`)
- Select backup from list
- Click "Restore" button
- Confirmation step (warns about data replacement)
- "Confirm Restore" button
- Progress indicator
- Success/error notifications
- ⚠️ **Warning**: Replaces ALL current data

**Automatic Cleanup**
- Keeps last 30 backups locally
- Keeps last 30 backups on Google Drive
- Oldest deleted automatically
- No manual intervention needed

**Scheduled Backups** (via setup)
- Weekly automated backups
- Windows: Task Scheduler
- Linux/Mac: Cron jobs
- Configurable frequency

### 📋 UPLOAD HISTORY (Admin only)

**View Upload History** (`/admin/uploads`)
- List all CSV uploads across all agencies
- Display: Filename, Client, Uploader, Upload Date, Records Count
- Sort by date
- Filter by client
- Search by filename

**Upload Details**
- Original filename preserved
- Processed flag
- Upload timestamp
- Link to uploader (user)
- Link to client
- Count of analytics records created

### 🗄️ DATABASE TOOLS (Admin only)

**Database Management** (`/admin/database`)
- View table record counts
- Connection status
- Database health checks
- Migration status
- Prisma schema viewer

---

## 🗺️ Page & Route Map

### Public Routes
```
/ → Landing/Login redirect
/login → Login page (role-based redirect)
/register → Registration (AGENCY/CLIENT/ADMIN)
```

### Agency Routes (`/dashboard/*`)
```
/dashboard → Agency dashboard
/dashboard/clients → Client CRUD
/dashboard/posts → Post management
/dashboard/upload → Analytics CSV upload
/dashboard/analytics → Analytics viewing & comparison
/dashboard/excel → Excel export/import
/dashboard/import-posts → Bulk post import
```

### Client Routes (`/client/*`)
```
/client → Client dashboard
/client/posts → Review & approve posts
/client/analytics → View own analytics
```

### Admin Routes (`/admin/*`)
```
/admin → Admin dashboard
/admin/analytics → System-wide analytics
/admin/users → User management
/admin/clients → All clients view
/admin/posts → All posts view
/admin/uploads → Upload history
/admin/backups → Backup management
/admin/database → Database tools
```

### API Routes (`/api/*`)

**Authentication:**
```
POST /api/auth/register
GET/POST /api/auth/[...nextauth]
```

**Clients:**
```
GET /api/clients → List clients
POST /api/clients → Create client
PUT /api/clients/[id] → Update client
DELETE /api/clients/[id] → Delete client
POST /api/clients/link-user → Link CLIENT user
```

**Posts:**
```
GET /api/posts → List posts (filtered by role)
POST /api/posts → Create post
PUT /api/posts/[id] → Update post
DELETE /api/posts/[id] → Delete post
POST /api/posts/import → Bulk import
PUT /api/posts/[id]/mark-published → Mark APPROVED → PUBLISHED
PUT /api/posts/[id]/mark-updated → Mark SUGGEST_CHANGES → PENDING
PUT /api/posts/[id]/add-writer-note → Add timestamped note
```

**Analytics:**
```
GET /api/analytics/[clientId] → Get analytics
GET /api/analytics/[clientId]/comparison → Period comparison
```

**Uploads:**
```
POST /api/upload → Upload Twitter CSV
```

**Excel:**
```
GET /api/excel/export → Export all posts
POST /api/excel/import → Import updated posts
GET /api/excel/client/[clientId] → Client-specific export
```

**Dashboard Stats:**
```
GET /api/dashboard/stats → Agency stats
GET /api/client/stats → Client stats
```

**Admin:**
```
POST /api/admin/fix-client-links → Auto-link users
GET /api/admin/backups → List backups
POST /api/admin/backups → Create backup
POST /api/admin/backups/restore → Restore backup
```

---

## 🔄 Workflows

### Post Approval Workflow

```
┌─────────────────────────────────────────────────┐
│  AGENCY creates post with Typefully link       │
│  Status: PENDING                                 │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  CLIENT reviews post in dashboard               │
└────────────┬────────────────────────────────────┘
             │
      ┌──────┼──────┐
      ↓      ↓      ↓
   APPROVE  SUGGEST REJECT
             CHANGES
      │      │      │
      ↓      ↓      ↓
   Status:  Status: Status:
   APPROVED SUGGEST REJECTED
            _CHANGES
      │      │      │
      │      │      │
      │      └──────┤
      │             ↓
      │    AGENCY fixes based on feedback
      │    Marks as "Changes Done"
      │    Status: PENDING
      │             │
      │             │
      └─────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  AGENCY schedules in Typefully                  │
│  Status: SCHEDULED (optional)                    │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  Post published on Twitter/X                     │
│  AGENCY marks as Published (with tweet URL)     │
│  Status: PUBLISHED                               │
└─────────────────────────────────────────────────┘
```

### Analytics Upload Workflow

```
┌─────────────────────────────────────────────────┐
│  1. Download Twitter analytics CSV              │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  2. AGENCY logs into dashboard                  │
│     Navigates to Upload Analytics                │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  3. Select target client from dropdown          │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  4. Drag & drop CSV file                        │
│     OR click to browse                           │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  5. System parses CSV                           │
│     - Validates columns                          │
│     - Checks date formats                        │
│     - Removes duplicates for date range          │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  6. Data stored in database                     │
│     - Upload record created                      │
│     - Analytics records created                  │
│     - Linked to client and uploader              │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  7. Success notification                        │
│     Navigate to Analytics to view data          │
└─────────────────────────────────────────────────┘
```

### Excel Import/Export Workflow

```
┌─────────────────────────────────────────────────┐
│  1. AGENCY exports posts to Excel               │
│     GET /api/excel/export                        │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  2. Excel file downloaded                       │
│     Contains: Client, Content, URL, Status, etc. │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  3. AGENCY edits offline                        │
│     - Updates Status column                      │
│     - Adds/modifies Feedback                     │
│     - Saves changes                              │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  4. Upload modified Excel file                  │
│     POST /api/excel/import                       │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  5. System validates each row                   │
│     - Checks Status values                       │
│     - Validates post IDs exist                   │
└────────────┬────────────────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
   VALID         INVALID
   ROWS          ROWS
      │             │
      ↓             ↓
   Update       Skip & Log
   Database     Error
      │             │
      └──────┬──────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  6. Summary report displayed                    │
│     - X rows updated successfully                │
│     - Y rows skipped (with reasons)              │
└─────────────────────────────────────────────────┘
```

### Backup & Restore Workflow

```
┌─────────────────────────────────────────────────┐
│  BACKUP CREATION                                 │
├─────────────────────────────────────────────────┤
│  1. ADMIN clicks "Create Backup"                │
│     OR weekly cron job executes                  │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  2. System runs pg_dump on Railway DB           │
│     Downloads full database SQL                  │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  3. Saves to backups/backup-{timestamp}.sql     │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  4. Uploads to Google Drive (if configured)     │
│     Folder: "Database Backups"                   │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  5. Cleanup old backups                         │
│     Keeps last 30 local, last 30 on Drive        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  RESTORE PROCESS                                 │
├─────────────────────────────────────────────────┤
│  1. ADMIN navigates to /admin/backups           │
│     Views list of available backups              │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  2. Selects backup to restore                   │
│     Clicks "Restore" button                      │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  3. Warning displayed:                          │
│     "This will replace ALL current data"         │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  4. ADMIN clicks "Confirm Restore"              │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  5. System runs psql with backup SQL            │
│     Replaces all tables and data                 │
└────────────┬────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────┐
│  6. Success notification                        │
│     "Database restored successfully"             │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Integrations

### External Services

#### **Typefully**
- **Purpose**: Tweet scheduling and publishing
- **Integration**: Manual (posts contain `typefullyUrl` field)
- **Workflow**:
  1. Agency creates draft in Typefully
  2. Copies Typefully URL
  3. Creates post in Compound with that URL
  4. After client approval, schedules via Typefully
  5. Marks post as PUBLISHED in Compound (with tweet URL)

#### **Twitter/X Analytics**
- **Purpose**: Performance data import
- **Integration**: CSV file upload
- **Format**: Twitter's native analytics export
- **Columns Mapped**:
  - Date, Impressions, Engagements
  - Likes, Retweets, Replies
  - Profile Clicks, URL Clicks, Follows
  - Media Views, Media Engagements
  - Hashtag Clicks, Detail Expands, etc.

#### **Google Drive** (NEW)
- **Purpose**: Cloud backup storage
- **Integration**: OAuth 2.0 via googleapis
- **Workflow**:
  1. Setup: Create Google Cloud project, enable Drive API
  2. Download OAuth credentials
  3. First run: Authorize app via browser
  4. Auto-upload: Each backup uploads to Drive folder
  5. Auto-cleanup: Keeps last 30 backups

#### **Railway**
- **Purpose**: Database hosting (PostgreSQL)
- **Integration**: Direct connection via DATABASE_URL
- **Features**:
  - Automatic backups (platform feature)
  - Point-in-time recovery
  - Backup download via pg_dump

### File Format Support

#### **CSV**
- **Library**: PapaParse
- **Use Cases**:
  - Twitter analytics import
  - Google Sheets post import
- **Date Formats**: MM/DD/YYYY, DD/MM/YYYY, ISO 8601
- **Validation**: Column mapping, data type checks

#### **Excel (.xlsx, .xls)**
- **Library**: XLSX
- **Use Cases**:
  - Post export for offline editing
  - Post import with updates
  - Client-specific reports
  - Analytics export
- **Features**:
  - Bi-directional sync
  - Row-by-row validation
  - Error reporting

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**:
  - Headless UI (modals, dropdowns)
  - Heroicons (icons)
- **Charts**: Recharts (Line, Bar, Area, Pie charts)
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **Date Picker**: React DatePicker
- **Animation**: Framer Motion

### Backend
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Credentials provider)
- **Password Hashing**: bcryptjs
- **Session**: JWT-based

### Data Processing
- **CSV Parsing**: PapaParse
- **Excel Processing**: XLSX library
- **Date Handling**: date-fns

### Cloud & Services
- **Hosting**: Vercel/Railway
- **Database**: Railway PostgreSQL
- **Backups**: Google Drive API
- **Version Control**: Git/GitHub

### Development Tools
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: npm
- **Node Version**: >= 18.17.0

---

## 🔒 Security Features

### Authentication & Authorization
- **Password Security**: bcryptjs with salt rounds
- **Session Management**: JWT-based sessions (NextAuth.js)
- **Role-Based Access Control**: All API routes check user.role
- **Route Protection**: Middleware redirects unauthorized access

### Data Isolation
- **Client Filtering**: CLIENT users only see own client data
- **Agency Ownership**: Agencies only access their clients
- **Admin Override**: Admins bypass ownership checks (with audit logs)

### Input Validation
- **Email Validation**: Regex pattern checks
- **Status Validation**: Enum constraints (PENDING, APPROVED, etc.)
- **File Type Checking**: CSV/Excel MIME type validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries

### Database Security
- **Cascading Deletes**: Prevents orphaned records
- **Foreign Key Constraints**: Referential integrity
- **Unique Constraints**: Email uniqueness enforced
- **Index Optimization**: Fast query performance

### Backup Security
- **Credentials Excluded**: `.gitignore` for sensitive files
- **Environment Variables**: DATABASE_URL not hardcoded
- **Google OAuth**: Secure authorization flow
- **Token Storage**: `.google-drive-token.json` excluded from Git

### Client Deactivation
- **Active Flag**: `client.active` boolean
- **Login Blocking**: Auth layer checks active status
- **Data Preservation**: Inactive clients' data retained
- **Reactivation**: Toggle active flag to restore access

---

## 📊 Key Metrics & Analytics

### Post Metrics
- Total Posts Created
- Posts by Status (PENDING, APPROVED, etc.)
- Posts by Client
- Posts with Scheduled Dates
- Average Approval Time (future feature)

### Analytics Metrics
- **Impressions**: Total views
- **Engagements**: Total interactions
- **Engagement Rate**: Engagements / Impressions × 100
- **Click-Through Rate**: URL Clicks / Impressions × 100
- **Likes, Retweets, Replies**: Individual engagement types
- **Profile Clicks**: Profile visits from tweets
- **Follows**: New followers from tweets
- **Media Views**: Video/image views
- **Media Engagements**: Media interactions

### System Metrics (Admin)
- Total Users (by role)
- Total Agencies
- Total Clients
- Active Clients vs Inactive
- Total Posts (all time)
- Scheduled Posts (upcoming)
- Total Uploads
- Total Backups
- Latest Backup Timestamp

---

## 🎯 Use Cases

### Use Case 1: Onboarding New Client

**Actor**: Agency User

**Steps**:
1. Navigate to `/dashboard/clients`
2. Click "Add New Client"
3. Fill in client details:
   - Name: "Acme Corp"
   - Email: "social@acme.com"
   - Twitter Handle: "@AcmeCorp"
   - Timezone: "PST"
4. Check "Create client account" to auto-generate CLIENT user
5. Submit form
6. Copy generated password
7. Send credentials to client
8. Upload initial Twitter analytics CSV
9. Create first batch of posts for approval

**Result**: Client can log in, see posts, and start approving.

### Use Case 2: Weekly Analytics Reporting

**Actor**: Agency User

**Steps**:
1. Navigate to `/dashboard/analytics`
2. Select client: "Acme Corp"
3. Select date range: "30 days"
4. Enable period comparison
5. Review metrics:
   - Impressions: 150,000 (↑ 25% vs last month)
   - Engagements: 5,200 (↑ 18%)
   - Engagement Rate: 3.47% (↓ 0.3%)
6. Click "Export to Excel"
7. Open Excel file
8. Add commentary and insights
9. Send report to client

**Result**: Client receives professional analytics report.

### Use Case 3: Client Approves Posts

**Actor**: Client User

**Steps**:
1. Log in to `/client`
2. See "3 Pending Approvals"
3. Navigate to `/client/posts`
4. Review first post:
   - Content looks good
   - Click "Approve"
5. Review second post:
   - Typo noticed
   - Click "Suggest Changes"
   - Enter feedback: "Please fix 'recieve' to 'receive'"
6. Review third post:
   - Off-brand messaging
   - Click "Reject"
   - Enter reason: "Tone doesn't match our brand guidelines"

**Result**: Agency sees 1 approved, 1 needs revision, 1 rejected.

### Use Case 4: Bulk Status Update via Excel

**Actor**: Agency User

**Steps**:
1. Navigate to `/dashboard/excel`
2. Click "Export All Posts"
3. Open downloaded Excel file
4. Find all APPROVED posts from last week
5. Change Status column to "SCHEDULED"
6. Add tweet URLs in notes
7. Save Excel file
8. Return to `/dashboard/excel`
9. Click "Import Updated Excel"
10. Upload modified file
11. Review summary: "15 posts updated successfully"

**Result**: All posts marked as SCHEDULED without manual clicking.

### Use Case 5: Database Disaster Recovery

**Actor**: Admin User

**Steps**:
1. Accidental bulk delete occurs
2. Navigate to `/admin/backups`
3. See backups list
4. Select yesterday's backup (before deletion)
5. Click "Restore"
6. Read warning: "This will replace ALL data"
7. Click "Confirm Restore"
8. Wait for restoration (30 seconds)
9. Success notification appears
10. Verify data is restored
11. Notify team to refresh

**Result**: All data recovered from 24 hours ago.

---

## 📈 Future Enhancement Ideas

### Potential Features

1. **Real-Time Notifications**
   - Push notifications when client approves/rejects
   - Email notifications for pending approvals
   - Slack/Discord webhook integrations

2. **Advanced Analytics**
   - Sentiment analysis on post performance
   - Best time to post recommendations
   - Competitor benchmarking

3. **AI Integration**
   - Auto-generate post content suggestions
   - Content quality scoring
   - Hashtag recommendations

4. **Calendar View**
   - Visual post scheduling calendar
   - Drag-and-drop rescheduling
   - Month/week/day views

5. **Collaboration Tools**
   - Internal comments on posts
   - Approval workflow with multiple reviewers
   - Version history for post edits

6. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Quick approval interface

7. **API Access**
   - REST API for third-party integrations
   - Webhooks for status changes
   - OAuth for external apps

8. **Multi-Platform Support**
   - LinkedIn analytics and posting
   - Instagram integration
   - Facebook page management

9. **Custom Reports**
   - Report templates
   - Automated scheduled reports
   - White-label PDF exports

10. **Team Management**
    - Multiple users per agency
    - Permission levels (Admin, Editor, Viewer)
    - Activity logs

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0
- PostgreSQL database (Railway recommended)
- Google Drive account (for backups, optional)

### Installation

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd compound-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/database"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. **Seed admin user** (optional):
   ```bash
   npm run seed-admin
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Access dashboard**:
   Open http://localhost:3000

### Production Deployment

1. **Deploy to Vercel**:
   ```bash
   vercel deploy --prod
   ```

2. **Set environment variables** in Vercel dashboard

3. **Connect Railway database**

4. **Run migrations** (automatic via build command)

5. **Set up Google Drive backups** (follow BACKUP_SETUP.md)

6. **Configure weekly backup cron** (server-side)

---

## 📝 License

Proprietary - Compound Marketing Agency Dashboard

---

## 👨‍💻 Support & Contact

For questions, issues, or feature requests, contact the development team.

---

**Last Updated**: 2025-10-21

**Version**: 1.0.0

**Status**: Production Ready ✅
