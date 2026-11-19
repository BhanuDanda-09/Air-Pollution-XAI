import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA service worker with update-available detection in production
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);

        // Check if there is already a worker waiting
        if (reg.waiting) {
          window.dispatchEvent(
            new CustomEvent('sw-update-available', { detail: { registration: reg } })
          );
        }

        // Listen for new updates discovered during session
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                console.log('[PWA] New version installed and waiting for skipWaiting.');
                window.dispatchEvent(
                  new CustomEvent('sw-update-available', { detail: { registration: reg } })
                );
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
  });
}
