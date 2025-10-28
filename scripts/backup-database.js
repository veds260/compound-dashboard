const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { uploadToDrive, cleanupOldDriveBackups } = require('./upload-to-drive');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 30; // Keep last 30 days (1 month) of backups
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('💡 Set it to your Railway database URL:');
  console.error('   Windows: set DATABASE_URL=postgresql://user:pass@host:port/database');
  console.error('   Linux/Mac: export DATABASE_URL=postgresql://user:pass@host:port/database');
  process.exit(1);
}

// Log which database is being backed up (mask password for security)
const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');
console.log(`🎯 Target database: ${maskedUrl}`);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
}

// Generate timestamp for backup filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `backup-${timestamp}.sql`;
const backupPath = path.join(BACKUP_DIR, backupFilename);

console.log('🔄 Starting database backup...');
console.log(`📝 Backup file: ${backupFilename}`);

// Execute pg_dump
const command = `pg_dump "${DATABASE_URL}" > "${backupPath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }

  if (stderr && !stderr.includes('pg_dump: warning:')) {
    console.error('⚠️  Warnings during backup:', stderr);
  }

  // Check if backup file was created
  if (fs.existsSync(backupPath)) {
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Backup completed successfully!`);
    console.log(`📦 Backup size: ${fileSizeMB} MB`);
    console.log(`📍 Location: ${backupPath}`);

    // Cleanup old backups
    cleanupOldBackups();

    // Upload to Google Drive if credentials are available
    uploadToGoogleDrive(backupPath);
  } else {
    console.error('❌ Backup file was not created');
    process.exit(1);
  }
});

function cleanupOldBackups() {
  console.log('\n🧹 Cleaning up old backups...');

  // Get all backup files
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by newest first

  // Keep only MAX_BACKUPS most recent files
  if (files.length > MAX_BACKUPS) {
    const filesToDelete = files.slice(MAX_BACKUPS);
    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted old backup: ${file.name}`);
    });
    console.log(`✅ Kept ${MAX_BACKUPS} most recent backups`);
  } else {
    console.log(`✅ Total backups: ${files.length} (under limit of ${MAX_BACKUPS})`);
  }
}

async function uploadToGoogleDrive(filePath) {
  const credentialsPath = path.join(__dirname, '../google-drive-credentials.json');

  if (!fs.existsSync(credentialsPath)) {
    console.log('\n⚠️  Google Drive credentials not found, skipping cloud upload');
    console.log('💡 To enable Google Drive backups, add google-drive-credentials.json');
    return;
  }

  try {
    console.log('\n☁️  Uploading to Google Drive...');
    await uploadToDrive(filePath);
    await cleanupOldDriveBackups();
  } catch (error) {
    console.error('⚠️  Google Drive upload failed:', error.message);
    console.log('💾 Local backup is still available at:', filePath);
  }
}
