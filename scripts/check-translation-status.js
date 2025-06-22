const fs = require('fs');
const path = require('path');
const { LANGUAGES, RTL_LANGUAGES, CULTURAL_LANGUAGES } = require('./translate-locales');

/**
 * Count total keys in nested object
 */
function countKeys(obj) {
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    count++;
    if (typeof value === 'object' && value !== null) {
      count += countKeys(value);
    }
  }
  return count;
}

/**
 * Check translation completeness for a specific file and language
 */
function checkTranslationStatus(sourceFile, targetLang) {
  try {
    const sourcePath = path.join(__dirname, '..', 'src', 'locales', 'en', sourceFile);
    const targetPath = path.join(__dirname, '..', 'src', 'locales', targetLang, sourceFile);
    
    if (!fs.existsSync(sourcePath)) {
      return { status: 'source_missing', error: 'Source file not found' };
    }
    
    if (!fs.existsSync(targetPath)) {
      return { status: 'missing', completeness: 0, sourceKeys: 0, targetKeys: 0 };
    }
    
    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    
    const sourceKeys = countKeys(sourceContent);
    const targetKeys = countKeys(targetContent);
    const completeness = Math.round((targetKeys / sourceKeys) * 100);
    
    let status = 'incomplete';
    if (completeness >= 95) status = 'complete';
    else if (completeness >= 75) status = 'mostly_complete';
    else if (completeness >= 50) status = 'partial';
    else if (completeness > 0) status = 'minimal';
    
    return {
      status,
      completeness,
      sourceKeys,
      targetKeys,
      lastModified: fs.statSync(targetPath).mtime
    };
    
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}

/**
 * Generate comprehensive translation status report
 */
function generateTranslationReport() {
  console.log('🌍 NOCTUA FOREST INTERNATIONALIZATION STATUS REPORT');
  console.log('='.repeat(80));
  console.log(`📅 Generated: ${new Date().toISOString()}`);
  console.log(`🗣️  Total Languages: ${Object.keys(LANGUAGES).length}`);
  console.log(`🔄 RTL Languages: ${RTL_LANGUAGES.length} (${RTL_LANGUAGES.join(', ')})`);
  console.log(`🎨 Cultural Languages: ${CULTURAL_LANGUAGES.length} (${CULTURAL_LANGUAGES.join(', ')})`);
  
  const files = ['translation.json', 'lessons.json'];
  const statusCounts = {
    complete: 0,
    mostly_complete: 0,
    partial: 0,
    minimal: 0,
    incomplete: 0,
    missing: 0,
    error: 0
  };
  
  const languageReports = {};
  
  console.log('\n📊 DETAILED STATUS BY LANGUAGE');
  console.log('='.repeat(80));
  
  for (const [langCode, langName] of Object.entries(LANGUAGES)) {
    const langReport = { translation: null, lessons: null };
    
    console.log(`\n${langCode.toUpperCase()} - ${langName}`);
    console.log('-'.repeat(40));
    
    if (RTL_LANGUAGES.includes(langCode)) {
      console.log('🔄 RTL Language');
    }
    if (CULTURAL_LANGUAGES.includes(langCode)) {
      console.log('🎨 Cultural Review Recommended');
    }
    
    for (const file of files) {
      const status = checkTranslationStatus(file, langCode);
      langReport[file.replace('.json', '')] = status;
      
      const fileType = file === 'translation.json' ? 'UI Text' : 'Lessons';
      
      if (status.status === 'missing') {
        console.log(`  ❌ ${fileType}: Missing (0%)`);
        statusCounts.missing++;
      } else if (status.status === 'error') {
        console.log(`  ⚠️  ${fileType}: Error - ${status.error}`);
        statusCounts.error++;
      } else {
        const icon = getStatusIcon(status.status);
        const lastMod = status.lastModified ? 
          ` (${status.lastModified.toLocaleDateString()})` : '';
        console.log(`  ${icon} ${fileType}: ${status.completeness}% (${status.targetKeys}/${status.sourceKeys} keys)${lastMod}`);
        statusCounts[status.status]++;
      }
    }
    
    languageReports[langCode] = langReport;
  }
  
  console.log('\n📈 SUMMARY STATISTICS');
  console.log('='.repeat(80));
  
  const totalFiles = Object.keys(LANGUAGES).length * files.length;
  
  console.log(`📁 Total Translation Files: ${totalFiles}`);
  console.log(`✅ Complete (95-100%): ${statusCounts.complete}`);
  console.log(`🔄 Mostly Complete (75-94%): ${statusCounts.mostly_complete}`);
  console.log(`📝 Partial (50-74%): ${statusCounts.partial}`);
  console.log(`⚡ Minimal (1-49%): ${statusCounts.minimal}`);
  console.log(`❌ Missing: ${statusCounts.missing}`);
  console.log(`⚠️  Errors: ${statusCounts.error}`);
  
  const completionRate = Math.round(((statusCounts.complete + statusCounts.mostly_complete) / totalFiles) * 100);
  console.log(`\n🎯 Overall Completion Rate: ${completionRate}%`);
  
  // Identify languages that need attention
  const needsAttention = [];
  const readyForReview = [];
  
  for (const [langCode, report] of Object.entries(languageReports)) {
    const translationStatus = report.translation?.status || 'missing';
    const lessonsStatus = report.lessons?.status || 'missing';
    
    if (translationStatus === 'missing' || lessonsStatus === 'missing' ||
        translationStatus === 'minimal' || lessonsStatus === 'minimal' ||
        translationStatus === 'partial' || lessonsStatus === 'partial') {
      needsAttention.push(langCode);
    } else if (CULTURAL_LANGUAGES.includes(langCode) && 
               (translationStatus === 'complete' || translationStatus === 'mostly_complete') &&
               (lessonsStatus === 'complete' || lessonsStatus === 'mostly_complete')) {
      readyForReview.push(langCode);
    }
  }
  
  console.log('\n🚨 PRIORITY ACTIONS');
  console.log('='.repeat(80));
  
  if (needsAttention.length > 0) {
    console.log(`\n📋 Languages Needing Translation Updates (${needsAttention.length}):`);
    for (const lang of needsAttention) {
      const report = languageReports[lang];
      const transComp = report.translation?.completeness || 0;
      const lessonsComp = report.lessons?.completeness || 0;
      console.log(`   ${lang} (${LANGUAGES[lang]}): UI ${transComp}%, Lessons ${lessonsComp}%`);
    }
    
    console.log('\n💡 Recommended Command:');
    console.log(`   node scripts/translate-locales.js ${needsAttention.join(',')}`);
  } else {
    console.log('\n🎉 All languages have adequate translations!');
  }
  
  if (readyForReview.length > 0) {
    console.log(`\n🎨 Languages Ready for Cultural Review (${readyForReview.length}):`);
    readyForReview.forEach(lang => console.log(`   ${lang} (${LANGUAGES[lang]})`));
  }
  
  console.log('\n🔧 USEFUL COMMANDS');
  console.log('='.repeat(80));
  console.log('Update incomplete translations:');
  console.log('   node scripts/translate-locales.js --incomplete');
  console.log('\nUpdate specific language:');
  console.log('   node scripts/translate-locales.js fa  # Persian only');
  console.log('   node scripts/translate-locales.js fa,ur  # Persian and Urdu');
  console.log('\nUpdate RTL languages:');
  console.log('   node scripts/translate-locales.js --rtl');
  console.log('\nForce update all languages:');
  console.log('   node scripts/translate-locales.js --force');
  console.log('\nCheck status again:');
  console.log('   node scripts/check-translation-status.js');
  
  return {
    summary: {
      totalLanguages: Object.keys(LANGUAGES).length,
      totalFiles,
      completionRate,
      statusCounts
    },
    needsAttention,
    readyForReview,
    languageReports
  };
}

/**
 * Get status icon for display
 */
function getStatusIcon(status) {
  const icons = {
    complete: '✅',
    mostly_complete: '🔄',
    partial: '📝',
    minimal: '⚡',
    incomplete: '❌',
    missing: '❌',
    error: '⚠️'
  };
  return icons[status] || '❓';
}

/**
 * Export function for use by other scripts
 */
function getLanguagesNeedingUpdate() {
  const needsUpdate = [];
  
  for (const langCode of Object.keys(LANGUAGES)) {
    const translationStatus = checkTranslationStatus('translation.json', langCode);
    const lessonsStatus = checkTranslationStatus('lessons.json', langCode);
    
    if (translationStatus.status === 'missing' || 
        translationStatus.completeness < 90 ||
        lessonsStatus.status === 'missing' || 
        lessonsStatus.completeness < 90) {
      needsUpdate.push(langCode);
    }
  }
  
  return needsUpdate;
}

// Run the report if called directly
if (require.main === module) {
  generateTranslationReport();
}

module.exports = {
  generateTranslationReport,
  checkTranslationStatus,
  getLanguagesNeedingUpdate,
  countKeys
}; 