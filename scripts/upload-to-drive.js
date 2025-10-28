const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, '../.google-drive-token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../google-drive-credentials.json');
const DRIVE_FOLDER_NAME = 'Database Backups'; // Folder name in Google Drive

/**
 * Upload a file to Google Drive
 */
async function uploadToDrive(filePath) {
  try {
    // Load credentials
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      console.error('❌ Google Drive credentials not found!');
      console.error('📝 Please follow setup instructions:');
      console.error('   1. Go to https://console.cloud.google.com/');
      console.error('   2. Create a new project or select existing one');
      console.error('   3. Enable Google Drive API');
      console.error('   4. Create OAuth 2.0 credentials (Desktop app)');
      console.error('   5. Download credentials and save as google-drive-credentials.json');
      process.exit(1);
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const auth = await authorize(credentials);
    const drive = google.drive({ version: 'v3', auth });

    // Find or create backup folder
    const folderId = await findOrCreateFolder(drive, DRIVE_FOLDER_NAME);

    // Upload file
    const fileName = path.basename(filePath);
    const fileSize = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

    console.log(`☁️  Uploading to Google Drive: ${fileName} (${fileSize} MB)`);

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType: 'application/sql',
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, webViewLink'
    });

    console.log('✅ Upload successful!');
    console.log(`📁 File ID: ${response.data.id}`);
    console.log(`🔗 View: ${response.data.webViewLink}`);

    return response.data;
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  }
}

/**
 * Find or create a folder in Google Drive
 */
async function findOrCreateFolder(drive, folderName) {
  // Search for existing folder
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files.length > 0) {
    console.log(`📂 Using existing folder: ${folderName}`);
    return response.data.files[0].id;
  }

  // Create new folder
  console.log(`📂 Creating new folder: ${folderName}`);
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id'
  });

  return folder.data.id;
}

/**
 * Authorize with Google Drive API
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Get new token
  return getAccessToken(oAuth2Client);
}

/**
 * Get and store new access token
 */
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔐 Authorize this app by visiting this URL:');
  console.log(authUrl);
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('❌ Error retrieving access token', err);
          return reject(err);
        }
        oAuth2Client.setCredentials(token);

        // Store the token for later use
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('✅ Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * Delete old backups from Google Drive (keep last 30)
 */
async function cleanupOldDriveBackups() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const auth = await authorize(credentials);
    const drive = google.drive({ version: 'v3', auth });

    const folderId = await findOrCreateFolder(drive, DRIVE_FOLDER_NAME);

    // List all backup files
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc'
    });

    const files = response.data.files;

    if (files.length > 30) {
      console.log(`🧹 Cleaning up old Google Drive backups...`);
      const filesToDelete = files.slice(30);

      for (const file of filesToDelete) {
        await drive.files.delete({ fileId: file.id });
        console.log(`🗑️  Deleted from Drive: ${file.name}`);
      }

      console.log(`✅ Kept 30 most recent backups on Google Drive`);
    } else {
      console.log(`✅ Google Drive backups: ${files.length} (under limit of 30)`);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// If run directly (not imported)
if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌ Usage: node upload-to-drive.js <file-path>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  uploadToDrive(filePath)
    .then(() => cleanupOldDriveBackups())
    .then(() => {
      console.log('✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { uploadToDrive, cleanupOldDriveBackups };
