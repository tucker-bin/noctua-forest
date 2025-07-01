const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running comprehensive TypeScript fixes...');

// Ensure proper TypeScript versions
const rootPackageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const backendPackageJson = JSON.parse(fs.readFileSync('node-backend/package.json', 'utf8'));

// Update TypeScript versions to match
const targetTsVersion = '5.4.5';
rootPackageJson.devDependencies.typescript = targetTsVersion;
backendPackageJson.devDependencies.typescript = targetTsVersion;

fs.writeFileSync('package.json', JSON.stringify(rootPackageJson, null, 2));
fs.writeFileSync('node-backend/package.json', JSON.stringify(backendPackageJson, null, 2));

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });
execSync('cd node-backend && npm install', { stdio: 'inherit' });

// Clean TypeScript cache
console.log('Cleaning TypeScript cache...');
execSync('npx tsc --build --clean', { stdio: 'inherit' });
execSync('cd node-backend && npx tsc --build --clean', { stdio: 'inherit' });

// Run TypeScript checks
console.log('Running TypeScript checks...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  execSync('cd node-backend && npm run build', { stdio: 'inherit' });
  console.log('✅ TypeScript checks passed!');
} catch (error) {
  console.error('❌ TypeScript checks failed!');
  process.exit(1);
} 