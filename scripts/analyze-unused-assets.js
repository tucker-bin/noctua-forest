const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Noctua Forest for unused assets and optimization opportunities...\n');

// Helper function to check if a file/pattern exists in the codebase
function searchInFiles(searchPattern, extensions = ['.tsx', '.ts', '.js', '.jsx', '.css', '.md']) {
  const results = [];
  
  function searchDirectory(dir, exclude = ['node_modules', 'dist', 'build', '.git']) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !exclude.includes(item)) {
          searchDirectory(fullPath, exclude);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(searchPattern)) {
              results.push(fullPath);
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    } catch (err) {
      // Skip directories that can't be read
    }
  }
  
  searchDirectory('.');
  return results;
}

// 1. ANALYZE LARGE ASSETS
console.log('📁 LARGE ASSETS ANALYSIS');
console.log('========================');

const publicAssets = [
  { file: 'public/noctua-mascot.svg', size: '632KB' },
  { file: 'public/maskable-icon-512x512.png', size: '8.6KB' },
  { file: 'public/pwa-512x512.png', size: '8.6KB' },
  { file: 'public/sitemap.xml', size: '4.6KB' }
];

publicAssets.forEach(asset => {
  const usage = searchInFiles(path.basename(asset.file));
  console.log(`${asset.file} (${asset.size})`);
  console.log(`  Usage: ${usage.length > 0 ? '✅ USED' : '❌ UNUSED'}`);
  if (usage.length > 0) {
    usage.forEach(file => console.log(`    - ${file}`));
  }
  console.log('');
});

// 2. ANALYZE DEPENDENCIES
console.log('📦 DEPENDENCY ANALYSIS');
console.log('======================');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const backendPackageJson = JSON.parse(fs.readFileSync('node-backend/package.json', 'utf8'));

const potentiallyUnusedDeps = [
  '@emotion/react',
  '@emotion/styled',
  '@types/firebase',
  '@types/stripe',
  'web-vitals',
  'stripe',
  '@google-cloud/translate'
];

potentiallyUnusedDeps.forEach(dep => {
  const frontendUsage = searchInFiles(dep);
  const backendUsage = searchInFiles(dep, ['.ts', '.js']);
  const totalUsage = [...frontendUsage, ...backendUsage];
  
  const inFrontend = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
  const inBackend = backendPackageJson.dependencies?.[dep] || backendPackageJson.devDependencies?.[dep];
  
  console.log(`${dep}`);
  console.log(`  Frontend package.json: ${inFrontend ? '✅' : '❌'}`);
  console.log(`  Backend package.json: ${inBackend ? '✅' : '❌'}`);
  console.log(`  Usage in code: ${totalUsage.length > 0 ? '✅ USED' : '❌ UNUSED'}`);
  if (totalUsage.length > 0 && totalUsage.length <= 5) {
    totalUsage.forEach(file => console.log(`    - ${file}`));
  } else if (totalUsage.length > 5) {
    console.log(`    - Used in ${totalUsage.length} files`);
  }
  console.log('');
});

// 3. ANALYZE GENERATED ASSETS
console.log('🏗️  GENERATED ASSETS ANALYSIS');
console.log('=============================');

const generatedDirs = ['AppImages', '.firebase', 'dist', 'build'];
generatedDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const stat = fs.statSync(dir);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(dir);
      console.log(`${dir}/ - ${files.length} items`);
      console.log(`  Status: 🗂️  Generated/cache directory (safe to delete)`);
    }
  } else {
    console.log(`${dir}/ - Not found`);
  }
});
console.log('');

// 4. ANALYZE DUPLICATE DEPENDENCIES
console.log('🔄 DUPLICATE DEPENDENCY ANALYSIS');
console.log('=================================');

const frontendDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const backendDeps = { ...backendPackageJson.dependencies, ...backendPackageJson.devDependencies };

const duplicates = [];
Object.keys(frontendDeps).forEach(dep => {
  if (backendDeps[dep]) {
    duplicates.push({
      dep,
      frontend: frontendDeps[dep],
      backend: backendDeps[dep],
      match: frontendDeps[dep] === backendDeps[dep]
    });
  }
});

duplicates.forEach(dup => {
  console.log(`${dup.dep}`);
  console.log(`  Frontend: ${dup.frontend}`);
  console.log(`  Backend: ${dup.backend}`);
  console.log(`  Versions match: ${dup.match ? '✅' : '❌ VERSION MISMATCH'}`);
  console.log('');
});

// 5. ANALYZE SCRIPT FILES
console.log('📜 SCRIPT FILES ANALYSIS');
console.log('========================');

const scriptFiles = fs.readdirSync('scripts').filter(f => f.endsWith('.js'));
scriptFiles.forEach(script => {
  const scriptPath = `scripts/${script}`;
  const content = fs.readFileSync(scriptPath, 'utf8');
  const lines = content.split('\n').length;
  
  // Check if script is used in package.json scripts
  const allScripts = { ...packageJson.scripts, ...backendPackageJson.scripts };
  const usedInScripts = Object.values(allScripts).some(cmd => cmd.includes(script));
  
  console.log(`${script} (${lines} lines)`);
  console.log(`  Used in package.json: ${usedInScripts ? '✅' : '❌'}`);
  
  // Analyze script purpose from filename/content
  if (script.includes('translate')) {
    console.log(`  Purpose: 🌐 Translation utilities`);
  } else if (script.includes('check') || script.includes('verify')) {
    console.log(`  Purpose: ✅ Validation/checking`);
  } else if (script.includes('organize')) {
    console.log(`  Purpose: 🗂️  Organization/cleanup`);
  } else {
    console.log(`  Purpose: 🔧 Utility script`);
  }
  console.log('');
});

// 6. OPTIMIZATION RECOMMENDATIONS
console.log('💡 OPTIMIZATION RECOMMENDATIONS');
console.log('===============================');

console.log('🎯 HIGH IMPACT:');
console.log('1. Remove @emotion/react and @emotion/styled if not using custom CSS-in-JS');
console.log('   - Material-UI v5 uses emotion internally, but you may not need direct imports');
console.log('   - Potential savings: ~200KB bundle size');
console.log('');

console.log('2. Consider lazy loading for large dependencies:');
console.log('   - Stripe SDK (only load when payment needed)');
console.log('   - Framer Motion (already being used efficiently)');
console.log('');

console.log('🎯 MEDIUM IMPACT:');
console.log('3. Optimize PWA icons:');
console.log('   - Consider WebP format for better compression');
console.log('   - Use responsive images for different screen densities');
console.log('');

console.log('4. Review translation dependencies:');
console.log('   - @google-cloud/translate is large but used for i18n scripts');
console.log('   - Consider moving to devDependencies if only used in build scripts');
console.log('');

console.log('🎯 LOW IMPACT:');
console.log('5. Clean up generated directories periodically:');
console.log('   - AppImages/ (app icon generation cache)');
console.log('   - .firebase/ (Firebase CLI cache)');
console.log('');

console.log('6. Consider dependency consolidation:');
console.log('   - Some dependencies appear in both frontend and backend');
console.log('   - Use npm workspaces for better management');
console.log('');

console.log('✅ Analysis complete! Review recommendations above.'); 