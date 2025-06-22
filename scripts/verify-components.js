const fs = require('fs');
const path = require('path');

// List of essential components that must exist in src
const essentialComponents = [
  'Observatory.tsx',
  'Layout.tsx',
  'OnboardingModal.tsx',
  'NoctuaMascot.tsx',
  'LanguageSwitcher.tsx'
];

// Directories to check
const componentDirs = [
  'src/components',
  'src/components/Observatory',
  'src/components/celestial',
  'src/components/layout',
  'src/components/auth',
  'src/components/dashboard',
  'src/components/modals',
  'src/components/features'
];

function verifyComponents() {
  console.log('Verifying component structure...\n');
  
  // Check if all directories exist
  console.log('Checking directories:');
  componentDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`${exists ? '✓' : '✗'} ${dir}`);
    if (!exists) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  Created directory: ${dir}`);
    }
  });

  // Check essential components
  console.log('\nChecking essential components:');
  const missingComponents = [];
  essentialComponents.forEach(component => {
    const componentPath = path.join('src/components', component);
    const exists = fs.existsSync(componentPath);
    console.log(`${exists ? '✓' : '✗'} ${component}`);
    if (!exists) {
      missingComponents.push(component);
    }
  });

  if (missingComponents.length > 0) {
    console.error('\nWarning: The following essential components are missing:');
    missingComponents.forEach(component => console.error(`  - ${component}`));
    console.error('\nPlease ensure these components are properly moved from backup before deleting the backup directory.');
    process.exit(1);
  }

  console.log('\nAll essential components are present. It is safe to delete the backup directory.');
}

verifyComponents(); 