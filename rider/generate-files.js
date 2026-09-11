#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Okra Rides - File Generator Script\n');

// Check if document file is provided
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Usage: node generate-files.js <document-file>');
  console.error('   Example: node generate-files.js document.txt');
  process.exit(1);
}

const documentPath = args[0];
if (!fs.existsSync(documentPath)) {
  console.error(`❌ File not found: ${documentPath}`);
  process.exit(1);
}

console.log(`📄 Reading document: ${documentPath}\n`);
const documentContent = fs.readFileSync(documentPath, 'utf-8');

// Function to create directory if it doesn't exist
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (dirname && dirname !== '.' && !fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
    console.log(`  📁 Created directory: ${dirname}`);
  }
}

// Function to write file
function writeFile(filePath, content) {
  try {
    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Created: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Error creating ${filePath}:`, error.message);
    return false;
  }
}

// Function to detect if a line is a file path marker
function detectFilePath(line) {
  const trimmed = line.trim();
  
  // Pattern 1: // path/to/file.ext (with optional space)
  if (trimmed.startsWith('//') && !trimmed.startsWith('///')) {
    const possiblePath = trimmed.substring(2).trim(); // .trim() handles the space
    // Check if it looks like a file path (contains . for extension)
    if (possiblePath.includes('.') && !possiblePath.includes(' ')) {
      return possiblePath;
    }
  }
  
  // Pattern 2: # path/to/file.ext OR #.filename (with optional space)
  if (trimmed.startsWith('#') && !trimmed.startsWith('##')) {
    const possiblePath = trimmed.substring(1).trim(); // .trim() handles the space
    // Check for file extensions or starts with .
    if ((possiblePath.includes('.') || possiblePath.startsWith('.')) && 
        !possiblePath.includes(' ') &&
        possiblePath.split('.').length <= 4) { // Not a markdown header
      return possiblePath;
    }
  }
  
  // Pattern 3: /* path/to/file.ext */ (with optional spaces)
  if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
    const possiblePath = trimmed.substring(2, trimmed.length - 2).trim();
    if (possiblePath.includes('.') && !possiblePath.includes(' ')) {
      return possiblePath;
    }
  }
  
  return null;
}

// Main parsing function
function parseAndCreateFiles() {
  const lines = documentContent.split('\n');
  const files = new Map(); // Use Map to handle duplicates
  let currentFile = null;
  let currentContent = [];
  let fileStartLine = 0;
  
  console.log('🔍 Scanning document for files...\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line is a file path marker
    const detectedPath = detectFilePath(line);
    
    if (detectedPath) {
      // Save previous file if exists
      if (currentFile && currentContent.length > 0) {
        // Join content preserving original formatting
        const content = currentContent.join('\n');
        
        // Only save if there's actual content (not just whitespace)
        if (content.trim().length > 0) {
          // Remove 'rider/' prefix if present
          const cleanPath = currentFile.replace(/^rider\//, '');
          
          if (!files.has(cleanPath)) {
            files.set(cleanPath, content);
            console.log(`  📌 Found: ${cleanPath} (lines ${fileStartLine}-${i})`);
          } else {
            console.log(`  ⚠️  Duplicate: ${cleanPath} (skipping)`);
          }
        }
      }

      // Start new file
      currentFile = detectedPath;
      currentContent = [];
      fileStartLine = i + 1;
    } else if (currentFile) {
      // Add content to current file AS-IS (preserve all formatting)
      currentContent.push(line);
    }
  }

  // Save last file
  if (currentFile && currentContent.length > 0) {
    const content = currentContent.join('\n');
    if (content.trim().length > 0) {
      const cleanPath = currentFile.replace(/^rider\//, '');
      if (!files.has(cleanPath)) {
        files.set(cleanPath, content);
        console.log(`  📌 Found: ${cleanPath} (lines ${fileStartLine}-${lines.length})`);
      }
    }
  }

  // Create all files
  console.log(`\n📝 Creating ${files.size} files...\n`);
  
  if (files.size === 0) {
    console.log('⚠️  No files detected! Check the document format.');
    console.log('\n🔍 Debugging: First 20 lines of document:');
    const preview = lines.slice(0, 20);
    preview.forEach((line, idx) => {
      console.log(`${idx + 1}: ${line.substring(0, 80)}`);
    });
    
    // Save everything to unknown.txt for inspection
    writeFile('unknown.txt', documentContent);
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;

  for (const [filePath, content] of files) {
    if (writeFile(filePath, content)) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ GENERATION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`✅ Files created: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(50));
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npm install');
  console.log('   2. Copy .env.example to .env.local and fill in your API keys');
  console.log('   3. Run: npm run dev');
  console.log('   4. Open: http://localhost:3000\n');
}

// Run the parser
try {
  parseAndCreateFiles();
} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
}