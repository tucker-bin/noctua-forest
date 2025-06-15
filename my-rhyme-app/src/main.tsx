import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Keep this commented unless Bootstrap JS features are needed
import './index.css';
import App from './App.tsx'; // Import WrappedApp (default export from App.tsx)
import './i18n';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error("Failed to find the root element. Your public/index.html file must have an element with id 'root'.");
}
