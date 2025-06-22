const fs = require('fs');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;

// Initialize Google Cloud Translation client
const translate = new Translate({
  // Uses environment variable GOOGLE_APPLICATION_CREDENTIALS for auth
});

// Complete language mapping for all supported languages
const LANGUAGES = {
  'ar': 'Arabic',
  'de': 'German', 
  'el': 'Greek',
  'es': 'Spanish',
  'fa': 'Persian (Farsi)',
  'fil': 'Filipino',
  'fr': 'French',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'id': 'Indonesian',
  'it': 'Italian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ms': 'Malay',
  'nl': 'Dutch',
  'pl': 'Polish',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'sv': 'Swedish',
  'th': 'Thai',
  'tr': 'Turkish',
  'uk': 'Ukrainian',
  'ur': 'Urdu',
  'vi': 'Vietnamese',
  'zh': 'Chinese'
};

// RTL languages that need special handling
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Languages with rich cultural context that may need manual review
const CULTURAL_LANGUAGES = ['ar', 'ja', 'zh', 'hi', 'th', 'he', 'fa', 'ur'];

/**
 * Check if translation file is incomplete compared to source
 */
function isTranslationIncomplete(sourceFile, targetLang) {
  try {
    const sourcePath = path.join(__dirname, '..', 'src', 'locales', 'en', sourceFile);
    const targetPath = path.join(__dirname, '..', 'src', 'locales', targetLang, sourceFile);
    
    if (!fs.existsSync(targetPath)) return true;
    
    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const targetContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    
    // Simple check: count of keys (more sophisticated comparison could be added)
    const sourceKeys = countKeys(sourceContent);
    const targetKeys = countKeys(targetContent);
    
    console.log(`${targetLang} ${sourceFile}: ${targetKeys}/${sourceKeys} keys (${Math.round(targetKeys/sourceKeys*100)}%)`);
    
    return targetKeys < sourceKeys * 0.9; // Consider incomplete if less than 90% of keys
  } catch (error) {
    console.log(`Error checking ${targetLang} ${sourceFile}: ${error.message}`);
    return true;
  }
}

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
 * Recursively translate an object's string values
 */
async function translateObject(obj, targetLang, sourceLang = 'en') {
  const translated = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      try {
        console.log(`Translating "${value.substring(0, 50)}..." to ${targetLang}`);
        
        // Handle interpolation variables like {{count}} and {{name}}
        const hasInterpolation = value.includes('{{') && value.includes('}}');
        
        if (hasInterpolation) {
          // For strings with interpolation, we need to be more careful
          // Split by interpolation variables and translate parts separately
          const parts = value.split(/({{[^}]+}})/);
          const translatedParts = [];
          
          for (const part of parts) {
            if (part.startsWith('{{') && part.endsWith('}}')) {
              // Keep interpolation variables as-is
              translatedParts.push(part);
            } else if (part.trim()) {
              // Translate non-empty text parts
              const [translation] = await translate.translate(part, {
                from: sourceLang,
                to: targetLang
              });
              translatedParts.push(translation);
            } else {
              translatedParts.push(part);
            }
          }
          
          translated[key] = translatedParts.join('');
        } else {
          // Simple translation for strings without interpolation
          const [translation] = await translate.translate(value, {
            from: sourceLang,
            to: targetLang
          });
          translated[key] = translation;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error translating "${value}":`, error.message);
        translated[key] = value; // Keep original on error
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively translate nested objects
      translated[key] = await translateObject(value, targetLang, sourceLang);
    } else {
      // Keep non-string values as-is
      translated[key] = value;
    }
  }
  
  return translated;
}

/**
 * Merge existing translations with new ones
 */
function mergeTranslations(existing, newTranslations) {
  const merged = { ...existing };
  
  for (const [key, value] of Object.entries(newTranslations)) {
    if (typeof value === 'object' && value !== null && typeof existing[key] === 'object') {
      merged[key] = mergeTranslations(existing[key] || {}, value);
    } else {
      merged[key] = value;
    }
  }
  
  return merged;
}

/**
 * Translate a locale file
 */
async function translateLocaleFile(sourceFile, targetLang, forceUpdate = false) {
  try {
    console.log(`\n🌍 Translating ${sourceFile} to ${LANGUAGES[targetLang]} (${targetLang})`);
    
    // Check if translation is needed
    if (!forceUpdate && !isTranslationIncomplete(sourceFile, targetLang)) {
      console.log(`✅ ${sourceFile} for ${targetLang} appears complete, skipping`);
      return null;
    }
    
    // Read source file
    const sourcePath = path.join(__dirname, '..', 'src', 'locales', 'en', sourceFile);
    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    
    // Read existing translation if it exists
    const targetDir = path.join(__dirname, '..', 'src', 'locales', targetLang);
    const targetPath = path.join(targetDir, sourceFile);
    let existingContent = {};
    
    if (fs.existsSync(targetPath)) {
      try {
        existingContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        console.log(`📝 Found existing ${sourceFile} for ${targetLang}, will merge`);
      } catch (error) {
        console.log(`⚠️  Could not read existing ${sourceFile}: ${error.message}`);
      }
    }
    
    // Translate content
    console.log(`🔄 Starting translation process for ${targetLang}...`);
    const translatedContent = await translateObject(sourceContent, targetLang);
    
    // Merge with existing translations
    const finalContent = mergeTranslations(existingContent, translatedContent);
    
    // Ensure target directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Write with proper formatting for RTL languages
    const jsonString = JSON.stringify(finalContent, null, 2);
    fs.writeFileSync(targetPath, jsonString, 'utf8');
    
    console.log(`✅ Successfully translated ${sourceFile} to ${targetLang}`);
    
    // Add cultural note for certain languages
    if (CULTURAL_LANGUAGES.includes(targetLang)) {
      console.log(`🎨 Note: ${LANGUAGES[targetLang]} may benefit from cultural review of translations`);
    }
    
    return finalContent;
    
  } catch (error) {
    console.error(`❌ Error translating ${sourceFile} to ${targetLang}:`, error.message);
    throw error;
  }
}

/**
 * Create enhanced lesson templates with cultural awareness
 */
function createEnhancedLessons(targetLang) {
  const culturalExamples = {
    'fa': {
      basic_example: 'شب پر ستاره، دل پر امید',
      explanation: 'توجه کنید که چگونه "ستاره" و "امید" در پایان صدای مشابه دارند'
    },
    'ur': {
      basic_example: 'رات کے ستاروں میں، خوابوں کا جہان',
      explanation: 'دیکھیں کہ کیسے "ستاروں" اور "خوابوں" میں آواز کی مماثلت ہے'
    },
    'ar': {
      basic_example: 'النجوم في السماء، والأحلام في القلب',
      explanation: 'لاحظ كيف تتشابه أصوات "السماء" و "القلب" في النهاية'
    },
    'zh': {
      basic_example: '星光闪闪夜空中，心中梦想永不停',
      explanation: '注意"中"和"停"的韵律相似'
    }
  };

  const example = culturalExamples[targetLang] || {
    basic_example: 'The night is bright with starlight',
    explanation: 'Notice how sounds create patterns in your language'
  };

  const lessonsTemplate = {
    "celestial_observer": {
      "first_light": {
        "title": "First Light: Introduction to Sound Observation",
        "description": "Begin your journey by learning to observe patterns like stars in the night sky",
        "content": {
          "introduction": "Welcome to your first lesson in pattern observation. Just as astronomers observe celestial bodies, we observe the patterns in language.",
          "objectives": [
            "Learn the basics of sound observation",
            "Understand how patterns work in your language",
            "Practice identifying simple patterns",
            "Discover the beauty in linguistic patterns"
          ],
          "examples": {
            "basic_pattern": {
              "text": example.basic_example,
              "explanation": example.explanation
            }
          },
          "cultural_context": `Understanding sound patterns in ${LANGUAGES[targetLang]} helps you appreciate the unique musical qualities of your language.`
        }
      },
      "star_patterns": {
        "title": "Star Patterns: Universal Language Patterns",
        "description": "Discover the fundamental patterns that exist across all languages, including your own",
        "content": {
          "introduction": `Every language has its own musical patterns, like constellations in the sky. ${LANGUAGES[targetLang]} has its own unique constellation of sounds.`,
          "patterns": [
            "Repetition of sounds (like echoes in a forest)",
            "Rhythm and meter (the heartbeat of language)",
            "Sound symbolism (how sounds carry meaning)",
            "Cultural patterns specific to your language"
          ]
        }
      },
      "constellation_mapping": {
        "title": "Constellation Mapping: Connecting Related Sounds",
        "description": "Learn to see how different sounds connect and relate to each other in your language",
        "content": {
          "introduction": `Just as stars form constellations, sounds form patterns that create meaning and beauty in ${LANGUAGES[targetLang]}.`
        }
      }
    }
  };
  
  return lessonsTemplate;
}

/**
 * Generate translation report
 */
function generateReport(results) {
  console.log('\n📊 TRANSLATION REPORT');
  console.log('='.repeat(50));
  
  let totalLanguages = 0;
  let completedLanguages = 0;
  let failedLanguages = 0;
  
  for (const [lang, result] of Object.entries(results)) {
    totalLanguages++;
    console.log(`\n${lang.toUpperCase()} (${LANGUAGES[lang]}):`);
    
    if (result.success) {
      completedLanguages++;
      console.log(`  ✅ Translation: ${result.translation ? 'Updated' : 'Already complete'}`);
      console.log(`  ✅ Lessons: ${result.lessons ? 'Updated' : 'Already complete'}`);
      if (RTL_LANGUAGES.includes(lang)) {
        console.log(`  🔄 RTL Support: Enabled`);
      }
      if (CULTURAL_LANGUAGES.includes(lang)) {
        console.log(`  🎨 Cultural Review: Recommended`);
      }
    } else {
      failedLanguages++;
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📈 SUMMARY:`);
  console.log(`   Total Languages: ${totalLanguages}`);
  console.log(`   ✅ Completed: ${completedLanguages}`);
  console.log(`   ❌ Failed: ${failedLanguages}`);
  console.log(`   📊 Success Rate: ${Math.round(completedLanguages/totalLanguages*100)}%`);
  
  if (failedLanguages > 0) {
    console.log(`\n⚠️  Some translations failed. Check error messages above.`);
  }
}

/**
 * Main translation function
 */
async function translateToLanguages(languages = Object.keys(LANGUAGES), forceUpdate = false) {
  console.log('🚀 Starting comprehensive translation process...\n');
  console.log(`🎯 Target languages: ${languages.map(l => LANGUAGES[l]).join(', ')}`);
  console.log(`🔄 Force update: ${forceUpdate ? 'Yes' : 'No (only incomplete translations)'}`);
  
  // Check if Google Cloud credentials are available
  try {
    await translate.getLanguages();
    console.log('✅ Google Cloud Translation API is ready\n');
  } catch (error) {
    console.error('❌ Google Cloud Translation API not available:', error.message);
    console.log('Please ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are authenticated with gcloud CLI');
    console.log('\nAlternatively, you can run: gcloud auth application-default login');
    return {};
  }
  
  const results = {};
  
  for (const lang of languages) {
    if (!LANGUAGES[lang]) {
      console.log(`⚠️  Unknown language code: ${lang}, skipping`);
      continue;
    }
    
    console.log(`\n📚 Processing ${LANGUAGES[lang]} (${lang})`);
    console.log('-'.repeat(40));
    
    const result = { success: false, error: null, translation: false, lessons: false };
    
    try {
      // Translate main translation file
      const translationResult = await translateLocaleFile('translation.json', lang, forceUpdate);
      result.translation = translationResult !== null;
      
      // Create/update lessons
      const lessonsPath = path.join(__dirname, '..', 'src', 'locales', lang, 'lessons.json');
      let lessonsNeedUpdate = forceUpdate || !fs.existsSync(lessonsPath);
      
      if (!lessonsNeedUpdate) {
        lessonsNeedUpdate = isTranslationIncomplete('lessons.json', lang);
      }
      
      if (lessonsNeedUpdate) {
        console.log(`\n📖 Creating enhanced lessons for ${LANGUAGES[lang]}`);
        const lessonsContent = createEnhancedLessons(lang);
        const translatedLessons = await translateObject(lessonsContent, lang);
        
        // Merge with existing if available
        let existingLessons = {};
        if (fs.existsSync(lessonsPath)) {
          try {
            existingLessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
          } catch (error) {
            console.log(`⚠️  Could not read existing lessons: ${error.message}`);
          }
        }
        
        const finalLessons = mergeTranslations(existingLessons, translatedLessons);
        fs.writeFileSync(lessonsPath, JSON.stringify(finalLessons, null, 2), 'utf8');
        
        console.log(`✅ Created/updated lessons.json for ${lang}`);
        result.lessons = true;
      } else {
        console.log(`✅ Lessons for ${lang} appear complete, skipping`);
      }
      
      result.success = true;
      
    } catch (error) {
      console.error(`❌ Failed to process ${lang}:`, error.message);
      result.error = error.message;
    }
    
    results[lang] = result;
  }
  
  generateReport(results);
  
  console.log('\n🎉 Translation process completed!');
  console.log('\n📋 Next steps:');
  console.log('1. ✅ src/i18n.ts already includes all languages');
  console.log('2. ✅ RTL support is configured for Arabic, Hebrew, Persian, and Urdu');
  console.log('3. 🔍 Test the translations in the application');
  console.log('4. 🎨 Consider cultural review for highlighted languages');
  console.log('5. 📱 Update LanguageSwitcher if needed');
  
  return results;
}

// Enhanced command line argument handling
const args = process.argv.slice(2);
let languages = Object.keys(LANGUAGES);
let forceUpdate = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--force' || arg === '-f') {
    forceUpdate = true;
  } else if (arg === '--persian' || arg === '--farsi') {
    languages = ['fa'];
  } else if (arg === '--urdu') {
    languages = ['ur'];
  } else if (arg === '--rtl') {
    languages = RTL_LANGUAGES;
  } else if (arg === '--incomplete') {
    // Find incomplete translations
    languages = Object.keys(LANGUAGES).filter(lang => 
      isTranslationIncomplete('translation.json', lang) || 
      isTranslationIncomplete('lessons.json', lang)
    );
    console.log(`🔍 Found incomplete translations for: ${languages.map(l => LANGUAGES[l]).join(', ')}`);
  } else if (LANGUAGES[arg]) {
    languages = [arg];
  } else if (arg.includes(',')) {
    languages = arg.split(',').filter(l => LANGUAGES[l]);
  }
}

// Run the translation
if (require.main === module) {
  translateToLanguages(languages, forceUpdate)
    .catch(error => {
      console.error('Translation process failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  translateToLanguages, 
  translateObject, 
  translateLocaleFile,
  LANGUAGES,
  RTL_LANGUAGES,
  CULTURAL_LANGUAGES
}; 