
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  const isAndroidApk = navigator.userAgent.includes('KCCAssessmentAndroid/');

  if ('serviceWorker' in navigator && import.meta.env.PROD && isAndroidApk) {
    window.addEventListener('load', () => {
      const removeServiceWorkers = navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));
      const removeWebCaches = 'caches' in window
        ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        : Promise.resolve([]);

      Promise.all([removeServiceWorkers, removeWebCaches]).catch((error) => {
        console.error('APK cache cleanup failed:', error);
      });
    });
  } else if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      }).catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    });
  }
