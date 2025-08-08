# Noctua Forest 🦉

> An AI-powered platform for deep linguistic and poetic analysis.

Noctua Forest is a sophisticated tool designed for writers, poets, and linguists to analyze text for patterns, rhyme schemes, meter, and other literary devices. It uses AI to provide deep insights into the structure and sound of language.

## ✨ Core Features

- **Observatory**: A powerful tool for general text analysis, identifying patterns like alliteration, assonance, and more.
- **Scriptorium**: Specialized analysis for song lyrics, including rhyme schemes and emotional tone.
- **FlowFinder**: A gamified experience to help users improve their understanding of rhyme and rhythm.
- **User Progression**: An experience-based system with levels and achievements to encourage learning.
- **Token Economy**: A usage-based system for accessing analysis features.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database & Auth**: Firebase / Firestore
- **AI**: Anthropic for text generation and analysis

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Firebase Account and a new project
- Anthropic API Key

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd noctua-forest
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    ```bash
    cd node-backend
    npm install
    cd ..
    ```

4.  **Set up environment variables:**

    Create a `.env` file in the `node-backend` directory with the following:
    ```
    ANTHROPIC_API_KEY=your_anthropic_key
    FRONTEND_URL=http://localhost:5173
    PORT=3001
    ```

    Create a `.env.local` file in the root directory for the frontend:
    ```
    VITE_FIREBASE_API_KEY=your_firebase_key
    VITE_FIREBASE_AUTH_DOMAIN=your_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    ```

5.  **Run the development servers:**

    - **Terminal 1 (Backend):**
      ```bash
      cd node-backend
      npm run dev
      ```

    - **Terminal 2 (Frontend):**
      ```bash
      npm run dev
      ```

The application should now be running at `http://localhost:5173`. 