# 🌍 Noctua Forest Internationalization Guide

## Overview

Noctua Forest is a fully internationalized application supporting **25 languages**, including **4 RTL (Right-to-Left) languages** with comprehensive cultural adaptations.

## 🗣️ Supported Languages

### Complete Languages
- **English (en)** - Source language with full content ✅
- **Persian/Farsi (fa)** - Complete UI translations, cultural examples ✅ 🔄
- **Urdu (ur)** - Complete UI translations, cultural examples ✅ 🔄

### RTL Languages (4 total)
- **Arabic (ar)** 🔄 - 8% UI, 81% Lessons
- **Hebrew (he)** 🔄 - 8% UI, Missing Lessons  
- **Persian (fa)** 🔄 - 35% UI, 15% Lessons ✅
- **Urdu (ur)** 🔄 - 36% UI, 15% Lessons ✅

### European Languages
- **Spanish (es)** - 21% UI, 80% Lessons
- **French (fr)** - 9% UI, Missing Lessons
- **German (de)** - 9% UI, 81% Lessons
- **Italian (it)** - 9% UI, Missing Lessons
- **Portuguese (pt)** - 9% UI, Missing Lessons
- **Dutch (nl)** - 8% UI, Missing Lessons
- **Polish (pl)** - 8% UI, Missing Lessons
- **Swedish (sv)** - 8% UI, Missing Lessons
- **Ukrainian (uk)** - 8% UI, Missing Lessons
- **Russian (ru)** - 8% UI, Missing Lessons
- **Greek (el)** - 8% UI, Missing Lessons

### Asian Languages
- **Chinese (zh)** 🎨 - 9% UI, 81% Lessons
- **Japanese (ja)** 🎨 - 9% UI, 81% Lessons
- **Korean (ko)** - 9% UI, Missing Lessons
- **Hindi (hi)** 🎨 - 8% UI, Missing Lessons
- **Thai (th)** 🎨 - 8% UI, Missing Lessons
- **Vietnamese (vi)** - 9% UI, Missing Lessons

### Southeast Asian Languages
- **Indonesian (id)** - 9% UI, Missing Lessons
- **Malay (ms)** - 8% UI, Missing Lessons
- **Filipino (fil)** - 9% UI, Missing Lessons

### Middle Eastern/Turkic
- **Turkish (tr)** - 9% UI, Missing Lessons

**Legend:**
- ✅ = Complete/High Quality
- 🔄 = RTL Language  
- 🎨 = Cultural Review Recommended

## 🏗️ Architecture

### I18n Configuration
- **Framework**: react-i18next with i18next
- **File Structure**: `/src/locales/{language}/translation.json` and `lessons.json`
- **Namespaces**: `translation` (UI) and `lessons` (educational content)
- **Fallback**: English (en)

### RTL Support
```typescript
// Automatic RTL detection and configuration
const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
export const isRTL = (language: string): boolean => {
  const baseLanguage = language.split('-')[0].toLowerCase();
  return rtlLanguages.includes(baseLanguage);
};
```

### Key Features
- **Automatic Language Detection** from browser/localStorage
- **Dynamic Direction Switching** (LTR ⟷ RTL)
- **Cultural Context Preservation** 
- **Astronomical Theme Consistency** across all languages
- **Pattern-Specific Examples** for each language's phonetic characteristics

## 🎯 Persian & Urdu Achievements

### Persian (فارسی) Implementation
```json
{
  "welcome": "به جنگل نکتوا خوش آمدید",
  "observatory_title": "رصدخانه",
  "cultural_context": {
    "persian_poetry": "شعر فارسی",
    "classical_forms": "اشکال کلاسیک",
    "ghazal": "غزل",
    "masnavi": "مثنوی"
  }
}
```

**Cultural Features:**
- **Classical Poetry References** - Ghazal, Masnavi, Rubai patterns
- **Proper RTL Typography** with Persian script
- **Culturally Relevant Examples** using Persian poetic traditions
- **Astronomical Metaphors** adapted to Persian literature

### Urdu (اردو) Implementation  
```json
{
  "welcome": "نکتوا فاریسٹ میں خوش آمدید",
  "observatory_title": "رصد گاہ", 
  "cultural_context": {
    "urdu_poetry": "اردو شاعری",
    "ghazal": "غزل",
    "nazm": "نظم",
    "qawwali": "قوالی"
  }
}
```

**Cultural Features:**
- **Classical Forms** - Ghazal, Nazm, Qasida, Qawwali
- **Proper RTL Typography** with Urdu script
- **Sub-Continental Context** reflecting Urdu's cultural richness
- **Pattern Examples** using traditional Urdu poetic forms

## 🛠️ Technical Implementation

### Translation Files Structure
```
src/locales/
├── en/
│   ├── translation.json (559 keys - 100%)
│   └── lessons.json (538 keys - 100%)
├── fa/
│   ├── translation.json (197 keys - 35%)
│   └── lessons.json (80 keys - 15%)
└── ur/
    ├── translation.json (199 keys - 36%)
    └── lessons.json (83 keys - 15%)
```

### RTL-Aware Styling Utilities
```typescript
export const rtlAware = {
  textAlign: (align: 'left' | 'right' | 'center') => { /* ... */ },
  marginLeft: (value: string | number) => { /* ... */ },
  marginRight: (value: string | number) => { /* ... */ }
};
```

### Language Switcher Component
```tsx
<select value={currentLang} onChange={handleChange}>
  {languages.map((lang) => (
    <option key={lang.code} value={lang.code}
      style={{ direction: lang.rtl ? 'rtl' : 'ltr' }}>
      {lang.label}
    </option>
  ))}
</select>
```

## 📊 Current Status

**Overall Completion: 10%** (5 of 50 files complete)

### Completed ✅
- English: Full implementation
- Persian: Comprehensive UI + Cultural lessons
- Urdu: Comprehensive UI + Cultural lessons

### High Priority 🚨
Languages with existing lesson content but incomplete UI:
- Arabic (ar): 8% UI, 81% Lessons
- Spanish (es): 21% UI, 80% Lessons  
- German (de): 9% UI, 81% Lessons
- Japanese (ja): 9% UI, 81% Lessons
- Chinese (zh): 9% UI, 81% Lessons

## 🔧 Tools & Scripts

### Translation Status Check
```bash
node scripts/check-translation-status.js
```

### Translation Updates
```bash
# Update Persian and Urdu
node scripts/translate-locales.js fa,ur

# Update RTL languages
node scripts/translate-locales.js --rtl

# Update incomplete translations
node scripts/translate-locales.js --incomplete

# Force update all
node scripts/translate-locales.js --force
```

### Google Cloud Translation Setup
For automated translation using Google Cloud Translation API:
```bash
# Install dependencies
npm install @google-cloud/translate

# Set up authentication
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
# OR
gcloud auth application-default login
```

## 🎨 Cultural Considerations

### Language-Specific Features

**Persian (fa)**:
- Classical poetry forms (Ghazal, Masnavi, Rubai)
- Right-to-left text flow
- Persian calendar references
- Classical Persian metaphors

**Urdu (ur)**: 
- Sub-continental poetic traditions
- Blend of Arabic, Persian, and local influences
- Ghazal and Nazm forms
- Qawwali musical traditions

**Arabic (ar)**:
- Classical Arabic poetry patterns
- Quranic/literary register
- Regional dialect considerations

**Cultural Review Recommended** 🎨:
Arabic, Japanese, Chinese, Hindi, Thai, Hebrew, Persian, Urdu

## 🚀 Future Roadmap

### Phase 1: Core RTL Support ✅
- [x] Persian comprehensive implementation
- [x] Urdu comprehensive implementation  
- [ ] Arabic UI completion
- [ ] Hebrew UI + Lessons

### Phase 2: High-Volume Languages
- [ ] Spanish UI completion
- [ ] French full implementation
- [ ] German UI completion
- [ ] Portuguese implementation

### Phase 3: Asian Languages
- [ ] Chinese UI completion
- [ ] Japanese UI completion  
- [ ] Korean full implementation
- [ ] Hindi full implementation

### Phase 4: Cultural Optimization
- [ ] Cultural review for all completed languages
- [ ] Region-specific variants
- [ ] Advanced typography features
- [ ] Audio pronunciation guides

## 📝 Translation Guidelines

### For New Languages
1. **Start with UI basics** - navigation, common actions
2. **Preserve astronomical theme** - maintain Noctua Forest's identity
3. **Cultural adaptation** - use relevant examples for the target culture
4. **Pattern examples** - provide language-specific phonetic examples
5. **RTL consideration** - ensure proper text direction if applicable

### Quality Standards
- **Accuracy**: Semantically correct translations
- **Cultural Relevance**: Examples should resonate with native speakers
- **Consistency**: Maintain terminology across all components
- **Completeness**: Aim for 90%+ key coverage

## 🤝 Contributing

### Adding a New Language
1. Create directories: `src/locales/{lang}/`
2. Add language to `src/i18n.ts` imports and resources
3. Update `LanguageSwitcher.tsx` with language option
4. Add to translation scripts in `scripts/translate-locales.js`
5. Create cultural examples in lesson content

### Improving Existing Translations
1. Run status check: `node scripts/check-translation-status.js`
2. Edit relevant JSON files in `src/locales/{lang}/`
3. Test with language switcher in development
4. Consider cultural context and astronomical theme

---

**🦉 Noctua Forest - Observing Patterns Across Cultures**

*Last Updated: June 20, 2025*
*Languages: 25 | RTL Support: 4 | Cultural Contexts: 8* 