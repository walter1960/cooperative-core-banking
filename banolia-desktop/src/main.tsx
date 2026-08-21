import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

// Purge any legacy hardcoded names or obsolete subtitles from localStorage
try {
  const storedName = localStorage.getItem('coop_institution_name');
  if (!storedName || storedName.includes('COPECTAT')) {
    localStorage.setItem('coop_institution_name', 'COOPEC');
  }

  const storedSub = localStorage.getItem('coop_institution_sub');
  if (!storedSub || storedSub.includes('ASECNA') || storedSub.includes('COPECTAT') || storedSub.includes('Système Intégré') || storedSub.includes('SFD')) {
    localStorage.setItem('coop_institution_sub', "Coopérative d'Épargne et de Crédit");
  }
} catch (e) {
  console.error("Storage sanitization error:", e);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
