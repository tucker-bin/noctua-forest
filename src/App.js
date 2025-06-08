import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AuthPage from './components/AuthPage'; // Assuming you'll create this
import AnalysisPage from './components/AnalysisPage'; // Assuming you'll create this
import { AuthProvider } from './context/AuthContext'; // Assuming you'll create this
import { UsageProvider } from './context/UsageContext'; // Assuming you'll create this

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (you'll do this in your AuthContext or a separate firebase.js file)
// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/firestore';
// firebase.initializeApp(firebaseConfig);


function App() {
  return (
    <Router>
      <AuthProvider>
        <UsageProvider>
          <div className="App">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<AnalysisPage />} />
              {/* Add other routes here */}
            </Routes>
          </div>
        </UsageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;