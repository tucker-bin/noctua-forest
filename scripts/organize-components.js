const fs = require('fs');
const path = require('path');

// Component organization map
const componentOrganization = {
  'layout': [
    'Layout.tsx',
    'LanguageSwitcher.tsx',
    'PrivacyPolicy.tsx',
    'TermsOfService.tsx'
  ],
  'Observatory': [
    'Observatory.tsx',
    'CacheManager.tsx',
    'StarGazing.tsx'
  ],
  'celestial': [
    'NoctuaMascot.tsx',
    'NoctuaNudges.tsx'
  ],
  'auth': [
    'SignUp.tsx',
    'ArtistProfile.tsx'
  ],
  'modals': [
    'OnboardingModal.tsx'
  ],
  'features': [
    'OnboardingJourney.tsx'
  ]
};

function moveFile(file, targetDir) {
  const sourcePath = path.join('src/components', file);
  const targetPath = path.join('src/components', targetDir, file);

  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️  Source file not found: ${sourcePath}`);
    return false;
  }

  try {
    // Ensure target directory exists
    if (!fs.existsSync(path.join('src/components', targetDir))) {
      fs.mkdirSync(path.join('src/components', targetDir), { recursive: true });
    }

    // Move the file
    fs.renameSync(sourcePath, targetPath);
    console.log(`✓ Moved ${file} to ${targetDir}/`);
    return true;
  } catch (error) {
    console.error(`❌ Error moving ${file}:`, error.message);
    return false;
  }
}

function organizeComponents() {
  console.log('Organizing components...\n');

  // Move files to their respective directories
  Object.entries(componentOrganization).forEach(([dir, files]) => {
    console.log(`\nMoving files to ${dir}/:`);
    files.forEach(file => moveFile(file, dir));
  });

  // Update imports in all TypeScript/JavaScript files
  console.log('\nOrganization complete! Please update imports in your files accordingly.');
  console.log('You may need to update import statements to reflect the new file locations.');
}

organizeComponents(); 