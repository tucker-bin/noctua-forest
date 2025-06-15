# <img src="https://placehold.co/40x40" alt="My Rhyme App Logo" style="vertical-align:middle; margin-right:8px;"/> My Rhyme App

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/tucker-bin/my-ryhme-app/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made with React](https://img.shields.io/badge/Made%20with-React-blue?logo=react)](https://react.dev/)

---

> **A modern, international-friendly web app for rhyme and lyric analysis, powered by AI and Firebase.**

---

## 📑 Table of Contents
- [Features](#features)
- [Screenshots](#screenshots)
- [Setup](#setup)
- [Usage Notes](#usage-notes)
- [Admin Instructions](#admin-instructions)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Rhyme Analysis API](#rhyme-analysis-api)
- [Localization & Accessibility](#localization-accessibility)

---

## 🚀 Features
- 🎨 **Infographic-style rhyme and lyric analysis**
- 📱 **Mobile-first, responsive UI**
- 🔐 **Google sign-in and email/password authentication**
- 🪙 **Token-based usage system**
- 🛠️ **Admin tools:** view users, reset tokens, view feedback
- 📄 **Comprehensive Terms of Service and Privacy Policy**
- 💬 **Feedback and newsletter features**
- 🌍 **Modern, accessible, and international design**

---

## 🖼️ Screenshots
![image](https://github.com/user-attachments/assets/02859c7f-2ae5-4f0b-93e1-bcc0c140aacd)


---

## ⚡ Setup
1. **Clone the repo and install dependencies:**
   ```sh
   npm install
   ```
2. **Set up your Firebase project and update** `src/firebase.ts` **with your config.**
3. **Enable Google sign-in in Firebase Auth if desired.**
4. **Start the dev server:**
   ```sh
   npm run dev
   ```

---

## 📚 Usage Notes
- **Copyright & Fair Use:**
  - Do not use copyrighted material unless you have the legal right or your use qualifies as fair use.
  - This tool is for educational, personal, and non-commercial analysis only.
- Users must agree to the [Terms of Service](src/components/TermsOfService.tsx) and [Privacy Policy](src/components/PrivacyPolicy.tsx) during sign-up.

**Note:** All components that use `useUsage` must be rendered within a `UsageProvider`. This is required for the app to function correctly.

---

## 👑 Admin Instructions
- Admin tools are available to users with the `admin` flag in Firestore or the email `tucker.apply@gmail.com`.
- Admins can view all users, reset token balances, and view feedback submissions from the Account page.

---

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 📬 Contact
For questions or support, contact: [tucker.note@gmail.com](mailto:tucker.note@gmail.com)

---

## 🛠️ Rhyme Analysis API

### Endpoint
`POST /api/analyze`

### Request Body
```json
{
  "text": "string (required)",
  "rhyme_scheme": "phonetic_architecture" // or other supported schemes
}
```

### Response (Success)
```json
[
  {
    "phonetic_link_id": "sound_group_01",
    "pattern_description": "Shared /oʊd/ sound in stressed syllable.",
    "segments": [
      {
        "text": "load",
        "parent_word_text": "reloaded",
        "globalStartIndex": 5,
        "globalEndIndex": 9,
        "startIndexInParentWord": 2,
        "endIndexInParentWord": 6
      }
    ]
  }
]
```

### Response (Error)
```json
{
  "error": "Validation error",
  "message": "Text too long: maximum 10000 characters"
}
```

- **400:** Validation error (bad input)
- **429:** Rate limit exceeded
- **500+:** Server error

---

## Deployment

Last deployment triggered: 2025-06-10 17:40

Cloud Build trigger test: 2025-06-10 17:45

---

## 🌐 Localization & Accessibility
- 15+ languages supported, with automatic browser language detection and a manual LanguageSwitcher in the footer.
- Full right-to-left (RTL) support for languages like Arabic and Hebrew.
- Locale-aware date and number formatting throughout the UI.
- Tooltips and feedback prompts on key actions, all translatable.
- All new UI strings must be added to every language file. See `src/components/README_i18n.md` for workflow.

---
