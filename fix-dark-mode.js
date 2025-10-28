const fs = require('fs');
const path = require('path');

// Define replacements for dark mode text
const replacements = [
  // Headings and titles
  { from: 'text-gray-900"', to: 'text-gray-900 dark:text-gray-100"' },
  { from: "text-gray-900'", to: "text-gray-900 dark:text-gray-100'" },
  { from: 'text-gray-900 ', to: 'text-gray-900 dark:text-gray-100 ' },

  // Labels and medium text
  { from: 'text-gray-700"', to: 'text-gray-700 dark:text-gray-300"' },
  { from: "text-gray-700'", to: "text-gray-700 dark:text-gray-300'" },
  { from: 'text-gray-700 ', to: 'text-gray-700 dark:text-gray-300 ' },

  // Descriptions and secondary text
  { from: 'text-gray-600"', to: 'text-gray-600 dark:text-gray-400"' },
  { from: "text-gray-600'", to: "text-gray-600 dark:text-gray-400'" },
  { from: 'text-gray-600 ', to: 'text-gray-600 dark:text-gray-400 ' },

  // Muted text
  { from: 'text-gray-500"', to: 'text-gray-500 dark:text-gray-400"' },
  { from: "text-gray-500'", to: "text-gray-500 dark:text-gray-400'" },
  { from: 'text-gray-500 ', to: 'text-gray-500 dark:text-gray-400 ' },

  // Very light text
  { from: 'text-gray-400"', to: 'text-gray-400 dark:text-gray-500"' },
  { from: "text-gray-400'", to: "text-gray-400 dark:text-gray-500'" },
  { from: 'text-gray-400 ', to: 'text-gray-400 dark:text-gray-500 ' },
];

// Files to process
const files = [
  'src/components/CSVUpload.tsx',
  'src/app/register/page.tsx',
  'src/app/page.tsx',
  'src/app/client/analytics/page.tsx',
  'src/components/PostsImport.tsx',
  'src/components/ClientManagement.tsx',
  'src/components/AnalyticsDashboard.tsx',
  'src/app/dashboard/analytics/page.tsx',
  'src/app/dashboard/import-posts/page.tsx',
  'src/app/dashboard/upload/page.tsx',
  'src/app/dashboard/excel/page.tsx',
  'src/components/ExcelOperations.tsx',
  'src/components/PostApprovalSystem.tsx',
  'src/components/AdminClientManagement.tsx',
  'src/app/login/page.tsx',
];

function processFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    // Only replace if dark: doesn't already exist
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);

    if (matches) {
      matches.forEach(match => {
        // Check if this occurrence already has dark: class
        const index = content.indexOf(match);
        const before = content.substring(Math.max(0, index - 50), index);
        if (!before.includes('dark:text-')) {
          content = content.replace(match, to);
          modified = true;
        }
      });
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  Skipped (no changes): ${filePath}`);
  }
}

console.log('🔧 Starting dark mode text fix...\n');

files.forEach(processFile);

console.log('\n✨ Dark mode fix complete!');
