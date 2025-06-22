const fs = require('fs');
const path = require('path');

// Simple file finder function (without glob dependency)
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist') && !item.includes('build')) {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function needsLoggerImport(content) {
  return content.includes('console.') && 
         !content.includes('from \'../utils/logger\'') &&
         !content.includes('from \'../../utils/logger\'') &&
         !content.includes('from \'../../../utils/logger\'');
}

function getRelativeImportPath(filePath) {
  const parts = filePath.split(path.sep);
  const srcIndex = parts.findIndex(part => part === 'src');
  
  if (srcIndex === -1) return '../utils/logger';
  
  const depth = parts.length - srcIndex - 2; // Subtract 2 for 'src' and filename
  return '../'.repeat(depth) + 'utils/logger';
}

function addLoggerImport(content, filePath) {
  const isBackend = filePath.includes('node-backend');
  const relativePath = getRelativeImportPath(filePath);
  const importStatement = isBackend 
    ? `import { logger } from '${relativePath}';`
    : `import { log } from '${relativePath}';`;
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    } else if (lines[i].trim() === '' || lines[i].trim().startsWith('//')) {
      continue;
    } else {
      break;
    }
  }
  
  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, importStatement);
  } else {
    lines.unshift(importStatement, '');
  }
  
  return lines.join('\n');
}

function replaceConsoleStatements(content, filePath) {
  const isBackend = filePath.includes('node-backend');
  const logPrefix = isBackend ? 'logger' : 'log';
  
  let modified = content;
  
  // Replace console.error with proper error logging
  modified = modified.replace(
    /console\.error\s*\(\s*'([^']+)'\s*,\s*([^)]+)\s*\)/g,
    `${logPrefix}.error('$1', { error: $2 instanceof Error ? $2.message : String($2) }, $2 instanceof Error ? $2 : undefined)`
  );
  
  // Replace console.error with template literals
  modified = modified.replace(
    /console\.error\s*\(\s*`([^`]+)`\s*,\s*([^)]+)\s*\)/g,
    `${logPrefix}.error('$1', { error: $2 instanceof Error ? $2.message : String($2) }, $2 instanceof Error ? $2 : undefined)`
  );
  
  // Replace simple console.error
  modified = modified.replace(
    /console\.error\s*\(\s*'([^']+)'\s*\)/g,
    `${logPrefix}.error('$1')`
  );
  
  modified = modified.replace(
    /console\.error\s*\(\s*"([^"]+)"\s*\)/g,
    `${logPrefix}.error('$1')`
  );
  
  // Replace console.log with contextual logging
  modified = modified.replace(
    /console\.log\s*\(\s*'([^']+)'\s*,\s*([^)]+)\s*\)/g,
    `${logPrefix}.info('$1', { data: $2 })`
  );
  
  // Replace simple console.log
  modified = modified.replace(
    /console\.log\s*\(\s*'([^']+)'\s*\)/g,
    `${logPrefix}.info('$1')`
  );
  
  modified = modified.replace(
    /console\.log\s*\(\s*"([^"]+)"\s*\)/g,
    `${logPrefix}.info('$1')`
  );
  
  // Replace console.warn
  modified = modified.replace(
    /console\.warn\s*\(\s*'([^']+)'\s*\)/g,
    `${logPrefix}.warn('$1')`
  );
  
  return modified;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't have console statements
    if (!content.includes('console.')) {
      return { processed: false, reason: 'No console statements found' };
    }
    
    let modified = content;
    
    // Add logger import if needed
    if (needsLoggerImport(content)) {
      modified = addLoggerImport(modified, filePath);
    }
    
    // Replace console statements
    modified = replaceConsoleStatements(modified, filePath);
    
    // Only write if content changed
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf8');
      return { processed: true, changes: 'Console statements replaced with proper logging' };
    }
    
    return { processed: false, reason: 'No changes needed' };
  } catch (error) {
    return { processed: false, reason: `Error: ${error.message}` };
  }
}

function main() {
  console.log('🔍 Finding TypeScript files...');
  
  const srcFiles = findTsFiles('./src');
  const backendFiles = fs.existsSync('./node-backend/src') ? findTsFiles('./node-backend/src') : [];
  const allFiles = [...srcFiles, ...backendFiles];
  
  console.log(`📁 Found ${allFiles.length} TypeScript files`);
  
  let processedCount = 0;
  let errorCount = 0;
  const results = [];
  
  allFiles.forEach(filePath => {
    const result = processFile(filePath);
    results.push({ file: filePath, ...result });
    
    if (result.processed) {
      processedCount++;
      console.log(`✅ ${filePath}: ${result.changes}`);
    } else if (result.reason.startsWith('Error:')) {
      errorCount++;
      console.log(`❌ ${filePath}: ${result.reason}`);
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`✅ Files processed: ${processedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⏭️  Skipped: ${allFiles.length - processedCount - errorCount}`);
  
  console.log('\n🎉 Console logging replacement complete!');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, replaceConsoleStatements }; 