const fs = require('fs');
const path = require('path');

// Function to recursively get all TypeScript files
function getTypeScriptFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getTypeScriptFiles(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to check imports in a file
function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const imports = [];
  
  lines.forEach((line, index) => {
    if (line.includes('import') && line.includes('from')) {
      const match = line.match(/from\s+['"]([^'"]+)['"]/);
      if (match && match[1].startsWith('.')) {
        imports.push({
          line: index + 1,
          import: match[1],
          fullLine: line.trim()
        });
      }
    }
  });
  
  return imports;
}

function analyzeImports() {
  console.log('Analyzing imports in TypeScript files...\n');
  
  const srcPath = path.join(process.cwd(), 'src');
  const files = getTypeScriptFiles(srcPath);
  let needsUpdate = false;
  
  files.forEach(file => {
    const imports = checkImports(file);
    if (imports.length > 0) {
      console.log(`\nFile: ${file.replace(process.cwd(), '')}`);
      imports.forEach(imp => {
        console.log(`  Line ${imp.line}: ${imp.fullLine}`);
      });
      needsUpdate = true;
    }
  });
  
  if (!needsUpdate) {
    console.log('No relative imports found that need updating.');
  } else {
    console.log('\nPlease review these imports and update them according to the new file structure.');
  }
}

analyzeImports(); 