const fs = require('fs');
const path = require('path');

console.log('🚀 Noctua Forest Asset Optimization Script');
console.log('==========================================\n');

// Helper function to safely delete directory
function safeDeleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Deleted: ${dirPath}`);
      return true;
    } catch (error) {
      console.log(`❌ Failed to delete ${dirPath}: ${error.message}`);
      return false;
    }
  } else {
    console.log(`ℹ️  Not found: ${dirPath}`);
    return false;
  }
}

// Helper function to get directory size
function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  let totalSize = 0;
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    calculateSize(dirPath);
    return totalSize;
  } catch (error) {
    return 0;
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 1. CLEAN GENERATED/CACHE DIRECTORIES
console.log('🧹 CLEANING GENERATED DIRECTORIES');
console.log('==================================');

const generatedDirs = [
  { path: 'AppImages', description: 'App icon generation cache' },
  { path: '.firebase', description: 'Firebase CLI cache' },
  { path: 'dist', description: 'Build output directory' },
  { path: 'build', description: 'Alternative build directory' },
  { path: 'node_modules/.cache', description: 'Node modules cache' },
  { path: '.cache', description: 'General cache directory' },
  { path: '.parcel-cache', description: 'Parcel bundler cache' }
];

let totalSaved = 0;

generatedDirs.forEach(dir => {
  const size = getDirectorySize(dir.path);
  console.log(`\n📁 ${dir.path} - ${dir.description}`);
  console.log(`   Size: ${formatBytes(size)}`);
  
  if (size > 0) {
    if (safeDeleteDirectory(dir.path)) {
      totalSaved += size;
    }
  }
});

console.log(`\n💾 Total space freed: ${formatBytes(totalSaved)}`);

// 2. OPTIMIZE PACKAGE.JSON DEPENDENCIES
console.log('\n📦 DEPENDENCY OPTIMIZATION SUGGESTIONS');
console.log('======================================');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Check for potentially unused Emotion dependencies
const hasEmotionImports = fs.existsSync('src') && 
  fs.readdirSync('src', { recursive: true })
    .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
    .some(file => {
      try {
        const content = fs.readFileSync(path.join('src', file), 'utf8');
        return content.includes('@emotion/react') || content.includes('@emotion/styled');
      } catch {
        return false;
      }
    });

console.log('\n🎨 Emotion Dependencies:');
if (packageJson.dependencies['@emotion/react'] || packageJson.dependencies['@emotion/styled']) {
  if (!hasEmotionImports) {
    console.log('❌ @emotion/react and @emotion/styled appear unused');
    console.log('   Material-UI v5 includes emotion internally');
    console.log('   Consider removing these dependencies');
    console.log('   Potential savings: ~200KB bundle size');
    
    console.log('\n   To remove:');
    console.log('   npm uninstall @emotion/react @emotion/styled');
  } else {
    console.log('✅ Emotion dependencies are being used');
  }
} else {
  console.log('✅ No emotion dependencies found');
}

// 3. ANALYZE LARGE DEPENDENCIES
console.log('\n📊 LARGE DEPENDENCY ANALYSIS');
console.log('============================');

const largeDependencies = [
  { name: 'stripe', purpose: 'Payment processing', size: '~500KB', canLazyLoad: true },
  { name: '@google-cloud/translate', purpose: 'Translation scripts', size: '~2MB', canMoveToDevDeps: true },
  { name: 'framer-motion', purpose: 'Animations', size: '~300KB', canLazyLoad: false },
  { name: 'firebase', purpose: 'Backend services', size: '~1MB', canLazyLoad: false }
];

largeDependencies.forEach(dep => {
  const isInstalled = packageJson.dependencies[dep.name] || packageJson.devDependencies[dep.name];
  if (isInstalled) {
    console.log(`\n📦 ${dep.name} (${dep.size})`);
    console.log(`   Purpose: ${dep.purpose}`);
    console.log(`   Installed: ✅`);
    
    if (dep.canLazyLoad) {
      console.log(`   💡 Consider lazy loading when needed`);
    }
    if (dep.canMoveToDevDeps) {
      console.log(`   💡 Consider moving to devDependencies if only used in scripts`);
    }
  }
});

// 4. VITE BUILD OPTIMIZATION SUGGESTIONS
console.log('\n⚡ VITE BUILD OPTIMIZATION');
console.log('==========================');

const viteConfigExists = fs.existsSync('vite.config.ts');
if (viteConfigExists) {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  
  console.log('✅ vite.config.ts found');
  
  // Check for optimization settings
  const hasChunkSizeWarningLimit = viteConfig.includes('chunkSizeWarningLimit');
  const hasManualChunks = viteConfig.includes('manualChunks');
  
  if (!hasChunkSizeWarningLimit) {
    console.log('💡 Consider adding chunkSizeWarningLimit to build config');
  }
  
  if (!hasManualChunks) {
    console.log('💡 Consider manual chunk splitting for better caching');
  }
  
  console.log('\n   Suggested vite.config.ts additions:');
  console.log('   ```typescript');
  console.log('   build: {');
  console.log('     chunkSizeWarningLimit: 1000,');
  console.log('     rollupOptions: {');
  console.log('       output: {');
  console.log('         manualChunks: {');
  console.log('           vendor: ["react", "react-dom"],');
  console.log('           mui: ["@mui/material", "@mui/icons-material"],');
  console.log('           firebase: ["firebase/app", "firebase/auth", "firebase/firestore"]');
  console.log('         }');
  console.log('       }');
  console.log('     }');
  console.log('   }');
  console.log('   ```');
}

// 5. PWA OPTIMIZATION
console.log('\n📱 PWA OPTIMIZATION');
console.log('===================');

const publicDir = 'public';
if (fs.existsSync(publicDir)) {
  const pwaIcons = fs.readdirSync(publicDir).filter(file => 
    file.includes('pwa-') || file.includes('maskable-') || file.includes('icon')
  );
  
  console.log(`Found ${pwaIcons.length} PWA icon files:`);
  pwaIcons.forEach(icon => {
    const iconPath = path.join(publicDir, icon);
    const size = fs.statSync(iconPath).size;
    console.log(`  ${icon} - ${formatBytes(size)}`);
  });
  
  console.log('\n💡 PWA Icon Optimization Tips:');
  console.log('   - Consider WebP format for better compression');
  console.log('   - Ensure icons are properly sized (avoid upscaling)');
  console.log('   - Use maskable icons for better Android integration');
}

// 6. FINAL RECOMMENDATIONS
console.log('\n🎯 FINAL OPTIMIZATION RECOMMENDATIONS');
console.log('=====================================');

console.log('\n🏆 HIGH PRIORITY:');
console.log('1. Run this script periodically to clean cache directories');
console.log('2. Review and remove unused dependencies');
console.log('3. Implement code splitting in vite.config.ts');

console.log('\n🥈 MEDIUM PRIORITY:');
console.log('4. Optimize PWA icons (WebP format)');
console.log('5. Consider lazy loading for payment/stripe components');
console.log('6. Move build-only dependencies to devDependencies');

console.log('\n🥉 LOW PRIORITY:');
console.log('7. Set up automated dependency auditing');
console.log('8. Consider npm workspaces for monorepo management');
console.log('9. Implement bundle analyzer for regular size monitoring');

console.log('\n✅ Optimization analysis complete!');
console.log(`💾 Freed ${formatBytes(totalSaved)} of disk space`);

// Create a summary report
const report = {
  timestamp: new Date().toISOString(),
  spaceSaved: totalSaved,
  spaceSavedFormatted: formatBytes(totalSaved),
  directoriesCleared: generatedDirs.filter(dir => fs.existsSync(dir.path)).length,
  recommendations: {
    highPriority: 3,
    mediumPriority: 3,
    lowPriority: 3
  }
};

fs.writeFileSync('optimization-report.json', JSON.stringify(report, null, 2));
console.log('\n📊 Detailed report saved to: optimization-report.json'); 