const fs = require('fs');
const path = require('path');

// Key translations for Persian (Farsi)
const persianTranslations = {
  "welcome": "به جنگل نکتوا خوش آمدید",
  "subtitle": "نکتوا به معنی 'جغد' است - خانه‌ای برای هنرمندان و فراگیران.",
  "welcome_message": "به جنگل من خوش آمدید! من نکتوا هستم، راهنمای شما برای کشف الگوهای پنهان در کلمات‌تان.",
  "explore_forest_title": "جنگل را کاوش کنید",
  "explore_forest_desc": "الگوهای پنهان در آهنگ‌ها و اشعار مورد علاقه‌تان را از طریق مشاهده دقیق کشف کنید.",
  "learn_create_title": "یادبگیرید و خلق کنید",
  "learn_create_desc": "طرح‌های پیچیده قافیه را درک کنید و شاهکارهای شاعرانه خود را خلق کنید.",
  "share_connect_title": "به اشتراک بگذارید و ارتباط برقرار کنید",
  "share_connect_desc": "مشاهدات و سفرهای غزلی خود در جنگل را با جامعه به اشتراک بگذارید.",
  "observatory_title": "رصدخانه",
  "observatory_subtitle": "الگوهای آوایی و قافیه در متن را مشاهده کنید. هر جلسه مشاهده بر اساس طول متن از توکن استفاده می‌کند.",
  "enter_forest": "وارد جنگل شوید (پروفایل خود را ایجاد کنید)",
  "view_profile": "مشاهده پروفایل",
  "artist": "هنرمند",
  "owl": "جغد",
  "tester": "آزمایش‌کننده",
  "begin_observation": "شروع مشاهده",
  "observing": "در حال مشاهده الگوها...",
  "patterns_found": "الگوهای کشف شده",
  "error": "خطا",
  "nav": {
    "observatory": "رصدخانه",
    "forest": "جنگل", 
    "community": "جامعه",
    "learn": "یادگیری",
    "profile": "پروفایل",
    "sign_in": "ورود",
    "sign_out": "خروج"
  },
  "footer": {
    "copyright": "© {{year}} جنگل نکتوا",
    "about": "درباره",
    "contact": "تماس",
    "privacy": "حریم خصوصی",
    "terms": "شرایط",
    "rights": "تمام حقوق محفوظ است"
  }
};

// Key translations for Urdu
const urduTranslations = {
  "welcome": "نکتوا فاریسٹ میں خوش آمدید",
  "subtitle": "نکتوا کا مطلب 'الّو' ہے - فنکاروں اور سیکھنے والوں کا گھر۔",
  "welcome_message": "میرے جنگل میں خوش آمدید! میں نکتوا ہوں، آپ کے الفاظ میں چھپے ہوئے پیٹرن دریافت کرنے کا رہنما۔",
  "explore_forest_title": "جنگل کی تلاش کریں",
  "explore_forest_desc": "اپنے پسندیدہ گانوں اور نظموں میں چھپے ہوئے پیٹرن کو محتاط مشاہدے کے ذریعے دریافت کریں۔",
  "learn_create_title": "سیکھیں اور تخلیق کریں",
  "learn_create_desc": "پیچیدہ قافیہ کی اسکیمیں سمجھیں اور اپنے شاعرانہ شاہکار تخلیق کریں۔",
  "share_connect_title": "شیئر کریں اور جڑیں",
  "share_connect_desc": "اپنے مشاہدات اور شاعرانہ سفر کو جنگل میں کمیونٹی کے ساتھ شیئر کریں۔",
  "observatory_title": "رصد گاہ",
  "observatory_subtitle": "متن میں صوتی پیٹرن اور قافیے کا مشاہدہ کریں۔ ہر مشاہدہ سیشن متن کی لمبائی کی بنیاد پر ٹوکن استعمال کرتا ہے۔",
  "enter_forest": "جنگل میں داخل ہوں (اپنا پروفائل بنائیں)",
  "view_profile": "پروفائل دیکھیں",
  "artist": "فنکار",
  "owl": "الّو",
  "tester": "ٹیسٹر",
  "begin_observation": "مشاہدہ شروع کریں",
  "observing": "پیٹرن کا مشاہدہ کر رہے ہیں...",
  "patterns_found": "پیٹرن دریافت ہوئے",
  "error": "خرابی",
  "nav": {
    "observatory": "رصد گاہ",
    "forest": "جنگل",
    "community": "کمیونٹی", 
    "learn": "سیکھیں",
    "profile": "پروفائل",
    "sign_in": "لاگ ان",
    "sign_out": "لاگ آؤٹ"
  },
  "footer": {
    "copyright": "© {{year}} نکتوا فاریسٹ",
    "about": "تعارف",
    "contact": "رابطہ",
    "privacy": "پرائیویسی",
    "terms": "شرائط",
    "rights": "تمام حقوق محفوظ ہیں"
  }
};

// Persian lessons content
const persianLessons = {
  "celestial_observer": {
    "first_light": {
      "title": "نخستین نور: آشنایی با مشاهده آوا",
      "description": "سفر خود را با یادگیری مشاهده الگوها مانند ستارگان در آسمان شب آغاز کنید",
      "content": {
        "introduction": "به اولین درس خود در مشاهده الگوها خوش آمدید. در شعر فارسی، آوا و ریتم اهمیت ویژه‌ای دارند.",
        "objectives": [
          "یادگیری مبانی مشاهده آوا",
          "درک نحوه عملکرد الگوها در زبان فارسی",
          "تمرین شناسایی الگوهای ساده"
        ],
        "examples": {
          "hafez_ghazal": {
            "text": "شب تاریک و من و پروانه و شمع و سخن",
            "explanation": "در این بیت از حافظ، قافیه و ردیف زیبایی خاصی می‌آفریند",
            "cultural_note": "حافظ شیرازی استاد غزل فارسی محسوب می‌شود"
          },
          "rumi_verse": {
            "text": "بشنو از نی چون حکایت می‌کند",
            "explanation": "آغاز مثنوی مولانا با موسیقی کلمات شروع می‌شود",
            "cultural_note": "مولانا جلال‌الدین رومی عارف و شاعر بزرگ فارسی"
          }
        }
      }
    }
  }
};

// Urdu lessons content
const urduLessons = {
  "celestial_observer": {
    "first_light": {
      "title": "پہلی روشنی: آواز کے مشاہدے کا تعارف",
      "description": "رات کے آسمان میں ستاروں کی طرح پیٹرن کا مشاہدہ سیکھ کر اپنا سفر شروع کریں",
      "content": {
        "introduction": "پیٹرن کے مشاہدے کے اپنے پہلے درس میں خوش آمدید۔ اردو شاعری میں آواز اور لے کی خاص اہمیت ہے۔",
        "objectives": [
          "آواز کے مشاہدے کی بنیادی باتیں سیکھیں",
          "سمجھیں کہ اردو زبان میں پیٹرن کیسے کام کرتے ہیں",
          "سادہ پیٹرن کی شناخت کی مشق کریں"
        ],
        "examples": {
          "ghalib_ghazal": {
            "text": "ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے",
            "explanation": "غالب کے اس شعر میں قافیہ اور ردیف کا خوبصورت استعمال",
            "cultural_note": "مرزا غالب اردو کے عظیم ترین شاعر ہیں"
          },
          "iqbal_verse": {
            "text": "خودی کو کر بلند اتنا کہ ہر تقدیر سے پہلے",
            "explanation": "اقبال کے شعر میں فلسفیانہ گہرائی اور موسیقی",
            "cultural_note": "علامہ اقبال شاعر مشرق کہلاتے ہیں"
          }
        }
      }
    }
  }
};

function createTranslationFiles() {
  console.log('🌍 Creating basic translation files...');
  
  // Create Persian translation file
  const faPath = path.join(__dirname, '..', 'src', 'locales', 'fa', 'translation.json');
  fs.writeFileSync(faPath, JSON.stringify(persianTranslations, null, 2), 'utf8');
  console.log('✅ Created Persian translation file');
  
  // Create Urdu translation file  
  const urPath = path.join(__dirname, '..', 'src', 'locales', 'ur', 'translation.json');
  fs.writeFileSync(urPath, JSON.stringify(urduTranslations, null, 2), 'utf8');
  console.log('✅ Created Urdu translation file');
  
  // Create Persian lessons file
  const faLessonsPath = path.join(__dirname, '..', 'src', 'locales', 'fa', 'lessons.json');
  fs.writeFileSync(faLessonsPath, JSON.stringify(persianLessons, null, 2), 'utf8');
  console.log('✅ Created Persian lessons file');
  
  // Create Urdu lessons file
  const urLessonsPath = path.join(__dirname, '..', 'src', 'locales', 'ur', 'lessons.json');
  fs.writeFileSync(urLessonsPath, JSON.stringify(urduLessons, null, 2), 'utf8');
  console.log('✅ Created Urdu lessons file');
  
  console.log('\n🎉 Basic translation files created successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the new languages in the application');
  console.log('2. Use the Google Translation API script for complete translations');
  console.log('3. Review and refine culturally specific content');
}

if (require.main === module) {
  createTranslationFiles();
}

module.exports = { createTranslationFiles }; 