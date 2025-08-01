#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to replace console.log with logger.log
function replaceConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace console.log with logger.log
  if (content.includes('console.log')) {
    content = content.replace(/console\.log\(/g, 'logger.log(');
    modified = true;
  }

  // Replace console.error with logger.error
  if (content.includes('console.error')) {
    content = content.replace(/console\.error\(/g, 'logger.error(');
    modified = true;
  }

  // Replace console.warn with logger.warn
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    modified = true;
  }

  // Replace console.info with logger.info
  if (content.includes('console.info')) {
    content = content.replace(/console\.info\(/g, 'logger.info(');
    modified = true;
  }

  // Replace console.debug with logger.debug
  if (content.includes('console.debug')) {
    content = content.replace(/console\.debug\(/g, 'logger.debug(');
    modified = true;
  }

  // Add logger import if needed
  if (modified && !content.includes("import { logger }")) {
    // Find the last import statement
    const importRegex = /import.*from.*['"];?\n/g;
    const imports = content.match(importRegex);
    
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const loggerImport = "import { logger } from '@/lib/utils'\n";
      
      // Insert logger import after the last import
      content = content.replace(lastImport, lastImport + loggerImport);
    } else {
      // If no imports found, add at the top
      content = "import { logger } from '@/lib/utils'\n\n" + content;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

// Find all TypeScript/JavaScript files
const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**']
});

console.log(`Found ${files.length} files to process...`);

files.forEach(file => {
  try {
    replaceConsoleLogs(file);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('🎉 Console log replacement complete!');
console.log('📝 Remember to test your application after these changes.'); 