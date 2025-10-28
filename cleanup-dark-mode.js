const fs = require('fs');
const path = require('path');

const files = [
  'src/components/AnalyticsDashboard.tsx',
  'src/app/dashboard/analytics/page.tsx',
  'src/app/login/page.tsx',
  'src/app/dashboard/upload/page.tsx',
];

function cleanupFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove duplicate dark: classes using regex
  const duplicateDarkPattern = /(dark:text-gray-\d{3})\s+(\1\s*)+/g;

  content = content.replace(duplicateDarkPattern, '$1 ');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Cleaned: ${filePath}`);
}

console.log('🧹 Cleaning up duplicate dark mode classes...\n');

files.forEach(cleanupFile);

console.log('\n✨ Cleanup complete!');
