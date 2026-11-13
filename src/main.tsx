import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register Progressive Web App Service Worker for offline caching & Android standalone installability
registerSW({
  immediate: true,
});

createRoot(document.getElementById('root')!).render(<App />);
