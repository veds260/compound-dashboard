const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('💡 Set it to your Railway database URL:');
  console.error('   Windows: set DATABASE_URL=postgresql://user:pass@host:port/database');
  console.error('   Linux/Mac: export DATABASE_URL=postgresql://user:pass@host:port/database');
  process.exit(1);
}

// Mask password in URL for display
const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');

/**
 * List all available backups
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📂 No backups directory found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first

  return files;
}

/**
 * Restore database from backup file
 */
async function restoreDatabase(backupPath) {
  return new Promise((resolve, reject) => {
    console.log('\n⚠️  WARNING: This will replace ALL data in the database!');
    console.log(`🎯 Target database: ${maskedUrl}`);
    console.log(`📁 Backup file: ${path.basename(backupPath)}`);
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Type "CONFIRM" to proceed with restoration: ', (answer) => {
      rl.close();

      if (answer.trim() !== 'CONFIRM') {
        console.log('❌ Restoration cancelled');
        process.exit(0);
      }

      console.log('\n🔄 Starting database restoration...');

      // Use psql to restore the backup
      // First drop all existing tables, then restore
      const command = `psql "${DATABASE_URL}" < "${backupPath}"`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Restoration failed:', error.message);
          reject(error);
          return;
        }

        if (stderr) {
          // psql outputs some info to stderr even on success
          console.log('📝 Restoration log:');
          console.log(stderr.substring(0, 500)); // Show first 500 chars
        }

        console.log('\n✅ Database restored successfully!');
        console.log('💡 Tip: Restart your application to ensure connection pool is refreshed');
        resolve();
      });
    });
  });
}

/**
 * Interactive restore menu
 */
async function interactiveRestore() {
  console.log('🔄 Database Restoration Tool\n');

  const backups = listBackups();

  if (backups.length === 0) {
    console.log('❌ No backup files found in', BACKUP_DIR);
    process.exit(1);
  }

  console.log('Available backups:\n');
  backups.forEach((backup, index) => {
    const dateStr = backup.date.toLocaleString();
    console.log(`  ${index + 1}. ${backup.name}`);
    console.log(`     Date: ${dateStr}`);
    console.log(`     Size: ${backup.size}\n`);
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Select backup number to restore (or 0 to cancel): ', async (answer) => {
    rl.close();

    const selection = parseInt(answer.trim());

    if (selection === 0 || isNaN(selection)) {
      console.log('❌ Restoration cancelled');
      process.exit(0);
    }

    if (selection < 1 || selection > backups.length) {
      console.log('❌ Invalid selection');
      process.exit(1);
    }

    const selectedBackup = backups[selection - 1];
    await restoreDatabase(selectedBackup.path);
  });
}

// If run directly with a file argument
if (require.main === module) {
  const fileArg = process.argv[2];

  if (fileArg) {
    // Restore from specific file
    const backupPath = path.isAbsolute(fileArg) ? fileArg : path.join(BACKUP_DIR, fileArg);

    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup file not found: ${backupPath}`);
      process.exit(1);
    }

    restoreDatabase(backupPath)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    // Interactive mode
    interactiveRestore()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  }
}

module.exports = { restoreDatabase, listBackups };
