# Database Backup Strategy - Railway Pro + Manual Scripts

This document explains our backup strategy using Railway Pro's automatic backups plus optional manual scripts for extra safety.

---

## 🎯 Backup Strategy

### Primary: Railway Pro Automatic Backups ✅

**Railway Pro includes automatic database backups**. This is your main backup system.

**Features:**
- ✅ **Daily automatic backups** (no setup needed)
- ✅ **Point-in-time recovery** (restore to any moment in time)
- ✅ **One-click restore** from Railway dashboard
- ✅ **7-30 day retention** (depends on plan tier)
- ✅ **Managed by Railway** (zero maintenance)
- ✅ **Fast restore** (integrated into platform)
- ✅ **No extra storage costs**

**How to Access:**
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project → Database service
3. Click **Backups** tab
4. See list of automatic backups
5. Click **Restore** on any backup to recover

**Cost:**
- Included with Railway Pro plan (~$20-50/month)

---

### Secondary: Manual Local Backups (Optional)

**For extra safety**, we've included backup scripts you can run manually from your local machine.

**Use Cases:**
- ✅ Before major deployments
- ✅ Before database migrations
- ✅ Before bulk data operations
- ✅ Pre-production safety snapshots
- ✅ Downloading database for local development
- ✅ Platform migration (if you ever leave Railway)

**What It Does:**
- Downloads full database dump from Railway to your local machine
- Saves as timestamped SQL file in `backups/` folder
- Can restore from any backup file

---

## 🚀 Using Manual Backup Scripts

### Prerequisites

**On Your Local Machine:**
- Node.js installed
- PostgreSQL client tools (pg_dump, psql) installed
- Access to Railway DATABASE_URL

### Installing PostgreSQL Tools

**Windows:**
1. Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Run installer (choose "Command Line Tools" component)
3. Add to PATH: `C:\Program Files\PostgreSQL\XX\bin`

**Mac:**
```bash
brew install postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-client
```

### Getting Railway DATABASE_URL

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project → Database service
3. Click **Connect** tab
4. Copy the **PostgreSQL Connection URL**
   - Format: `postgresql://user:password@host.railway.app:port/database`

---

## 📥 Creating a Manual Backup

### Step 1: Set DATABASE_URL

**Windows (Command Prompt):**
```cmd
set DATABASE_URL=postgresql://user:password@host.railway.app:port/database
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://user:password@host.railway.app:port/database"
```

**Mac/Linux:**
```bash
export DATABASE_URL="postgresql://user:password@host.railway.app:port/database"
```

### Step 2: Navigate to Project

```bash
cd "C:\Users\veds2\Desktop\New folder (3)"
```

### Step 3: Run Backup

```bash
npm run backup
```

**Output:**
```
🎯 Target database: postgresql://user:****@host.railway.app:port/database
🔄 Starting database backup...
📝 Backup file: backup-2025-10-23T14-30-00-000Z.sql
✅ Backup completed successfully!
📦 Backup size: 15.43 MB
📍 Location: C:\Users\veds2\Desktop\New folder (3)\backups\backup-2025-10-23T14-30-00-000Z.sql

🧹 Cleaning up old backups...
✅ Total backups: 5 (under limit of 30)
```

**Backup Location:**
```
your-project/
├── backups/
│   ├── backup-2025-10-23T14-30-00-000Z.sql
│   ├── backup-2025-10-22T14-30-00-000Z.sql
│   └── ... (keeps last 30)
```

---

## 📤 Restoring from Manual Backup

### Interactive Mode (Recommended)

```bash
npm run restore
```

**You'll see:**
```
🔄 Database Restoration Tool

Available backups:

  1. backup-2025-10-23T14-30-00-000Z.sql
     Date: Oct 23, 2025 2:30 PM
     Size: 15.43 MB

  2. backup-2025-10-22T14-30-00-000Z.sql
     Date: Oct 22, 2025 2:30 PM
     Size: 15.21 MB

Select backup number to restore (or 0 to cancel): 1

⚠️  WARNING: This will replace ALL data in the database!
🎯 Target database: postgresql://user:****@host.railway.app:port/database
📁 Backup file: backup-2025-10-23T14-30-00-000Z.sql

Type "CONFIRM" to proceed with restoration: CONFIRM

🔄 Starting database restoration...
✅ Database restored successfully!
💡 Tip: Restart your application to ensure connection pool is refreshed
```

### Direct Mode (Specific File)

```bash
npm run restore backup-2025-10-23T14-30-00-000Z.sql
```

---

## 📋 When to Use Manual Backups

### ✅ Before Major Deployments

```bash
# 1. Create backup
set DATABASE_URL=your_railway_url
npm run backup

# 2. Deploy
git add .
git commit -m "Deploy new feature"
git push

# 3. If something goes wrong, restore
npm run restore
```

### ✅ Before Database Migrations

```bash
# 1. Backup first
npm run backup

# 2. Run migration
npx prisma migrate deploy

# 3. If migration fails, restore
npm run restore
```

### ✅ Before Bulk Operations

```bash
# 1. Backup before bulk delete/update
npm run backup

# 2. Run bulk operation
# ... your risky operation ...

# 3. If mistake, restore immediately
npm run restore
```

### ✅ Downloading Production Data for Local Dev

```bash
# 1. Backup production DB
set DATABASE_URL=railway_production_url
npm run backup

# 2. Restore to local dev DB
set DATABASE_URL=postgresql://localhost:5432/mydb_dev
npm run restore

# Now you have production data locally for testing
```

---

## 🔄 Backup Retention

**Manual Backups:**
- Automatically keeps last **30 backups**
- Oldest deleted when you create 31st backup
- No manual cleanup needed

**Railway Pro Backups:**
- Retention depends on plan (7-30 days)
- Managed by Railway
- No action needed

---

## 🛡️ Best Practices

### 1. **Use Railway Pro as Primary**
- Let Railway handle daily backups automatically
- This is your safety net

### 2. **Use Manual Scripts for Extra Safety**
- Run before risky changes
- Pre-deployment backups
- One-time snapshots

### 3. **Test Restore Process**
- Periodically test that restore works
- Verify backup files aren't corrupted
- Practice on a test database first

### 4. **Secure Your Backups**
- Backup files contain ALL your data
- Store securely (local backups/ folder)
- Don't commit to Git (already in .gitignore)
- Don't share DATABASE_URL publicly

### 5. **Document Major Backups**
- Add note when creating important backups
- Example: "backup-before-v2-migration.sql"
- Helps identify which backup to restore

---

## 🔧 Troubleshooting

### "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools (see Prerequisites above)

### "DATABASE_URL not set"

**Solution:** Set the environment variable before running:
```bash
set DATABASE_URL=your_railway_url
npm run backup
```

### "Connection refused" or "Could not connect"

**Solutions:**
1. Check DATABASE_URL is correct (copy from Railway dashboard)
2. Ensure Railway database is running
3. Check your internet connection
4. Verify Railway project isn't paused

### Backup file is 0 bytes or very small

**Solutions:**
1. Check pg_dump command succeeded (see console output)
2. Ensure DATABASE_URL points to correct database
3. Database might be empty (check Railway dashboard)

### Restore fails with errors

**Solutions:**
1. Ensure target database is accessible
2. Check you have write permissions
3. Backup file might be corrupted (create fresh backup)
4. Make sure you're restoring to correct database

---

## 📊 Backup Comparison

| Feature | Railway Pro | Manual Scripts |
|---------|-------------|----------------|
| **Automatic** | ✅ Daily | ❌ Manual only |
| **Setup** | ✅ None needed | Requires local tools |
| **Restore Speed** | ✅ Very fast | Slower (download + upload) |
| **Retention** | 7-30 days | 30 backups (you control) |
| **Cost** | Included in Pro | Free (local storage) |
| **Platform Lock-in** | ✅ Railway only | ❌ Portable SQL files |
| **Maintenance** | ✅ None | Manual cleanup (auto) |
| **Best For** | Daily protection | Pre-deployment, migrations |

---

## 🎯 Recommended Workflow

### Daily Operations
- ✅ **Railway Pro handles this** - No action needed

### Before Deployments
```bash
npm run backup
# Deploy...
# If issues, restore from this backup
```

### Before Migrations
```bash
npm run backup
npx prisma migrate deploy
# If migration fails, restore
```

### Monthly Safety Snapshot
```bash
# Optional: Create monthly backup for long-term storage
npm run backup
# Rename file: backup-october-2025-monthly.sql
# Store in secure location
```

---

## 📞 Support

**Railway Backups:**
- [Railway Backup Docs](https://docs.railway.app/reference/databases#backups)
- Railway Dashboard → Support

**Manual Scripts:**
- Check console output for error messages
- Verify prerequisites installed
- Ensure DATABASE_URL is correct

---

## ✅ Quick Reference

### Create Backup
```bash
set DATABASE_URL=your_railway_url
npm run backup
```

### Restore Backup
```bash
set DATABASE_URL=your_railway_url
npm run restore
```

### View Backups
```bash
# Windows
dir backups

# Mac/Linux
ls -lh backups/
```

### Delete Old Backups
```bash
# Automatic - keeps last 30
# Or manual:
# Windows: del backups\backup-old-filename.sql
# Mac/Linux: rm backups/backup-old-filename.sql
```

---

**Bottom Line:** Railway Pro handles your daily backups automatically. Use manual scripts as an extra safety layer for important changes. 🚀
