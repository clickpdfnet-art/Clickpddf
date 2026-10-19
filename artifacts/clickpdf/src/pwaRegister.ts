export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const basePath = import.meta.env.BASE_URL;
    const serviceWorkerUrl = `${basePath}sw.js`;

    if (!import.meta.env.PROD) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          if (registration.active?.scriptURL === new URL(serviceWorkerUrl, window.location.origin).href) {
            registration.unregister();
          }
        }
      });
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(serviceWorkerUrl, { scope: basePath })
        .then((registration) => {
          console.log('[ClickPDF] ServiceWorker registered with online enforcement:', registration.scope);
        })
        .catch((error) => {
          console.warn('[ClickPDF] ServiceWorker registration failed:', error);
        });
    });
  }
}
