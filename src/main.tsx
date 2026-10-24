import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Automatically register and update service worker for installed PWA support
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Update immediately so installed PWA loads latest app code and styles without needing reinstall
    updateSW(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Periodically check for updates every 30s
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30000);
    }
  },
});

createRoot(document.getElementById('root')!).render(<App />);
