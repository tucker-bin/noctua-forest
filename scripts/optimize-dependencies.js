#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing dependencies for optimization...\n');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Dependencies that can likely be removed based on our analysis
const potentiallyUnusedDeps = [
  '@mui/x-charts', // Not found in codebase
  'axios', // Replaced with fetch
  '@types/stripe', // Only used in backend
  'stripe', // Only used in backend
];

// Dependencies that should be moved to devDependencies
const shouldBeDevDeps = [
  '@types/react',
  '@types/react-dom', 
  '@types/react-router-dom',
  '@types/firebase',
];

console.log('📦 Current dependencies analysis:');
console.log(`Total dependencies: ${Object.keys(packageJson.dependencies).length}`);
console.log(`Total devDependencies: ${Object.keys(packageJson.devDependencies).length}`);

console.log('\n🗑️  Potentially unused dependencies:');
potentiallyUnusedDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`  - ${dep}`);
  }
});

console.log('\n🔧 Dependencies that should be devDependencies:');
shouldBeDevDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`  - ${dep}`);
  }
});

// Create optimized package.json
const optimizedPackageJson = { ...packageJson };

// Remove potentially unused dependencies
potentiallyUnusedDeps.forEach(dep => {
  if (optimizedPackageJson.dependencies[dep]) {
    delete optimizedPackageJson.dependencies[dep];
    console.log(`✅ Removed ${dep} from dependencies`);
  }
});

// Move type definitions to devDependencies
shouldBeDevDeps.forEach(dep => {
  if (optimizedPackageJson.dependencies[dep]) {
    optimizedPackageJson.devDependencies[dep] = optimizedPackageJson.dependencies[dep];
    delete optimizedPackageJson.dependencies[dep];
    console.log(`📦 Moved ${dep} to devDependencies`);
  }
});

// Write optimized package.json
fs.writeFileSync(
  packageJsonPath, 
  JSON.stringify(optimizedPackageJson, null, 2) + '\n'
);

console.log('\n✨ Package.json optimized!');
console.log(`New dependencies count: ${Object.keys(optimizedPackageJson.dependencies).length}`);
console.log(`New devDependencies count: ${Object.keys(optimizedPackageJson.devDependencies).length}`);

// Calculate estimated bundle size reduction
const removedDeps = potentiallyUnusedDeps.filter(dep => packageJson.dependencies[dep]);
const estimatedSavings = removedDeps.length * 50; // Rough estimate in KB

console.log(`\n📊 Estimated bundle size reduction: ~${estimatedSavings}KB`);

console.log('\n🚀 Next steps:');
console.log('1. Run `npm install` to update dependencies');
console.log('2. Run `npm run build` to test the optimized build');
console.log('3. Test the application to ensure nothing is broken');

console.log('\n✅ Dependency optimization complete!'); 