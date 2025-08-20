// src/serviceWorkerRegistration.js
// Minimal CRA-style SW registration helper

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
  )
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return; // different origin

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // localhost: just try to register; dev may skip caching aggressively
        registerValidSW(swUrl, config);
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      // optional: listen for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // new content available
              if (config && config.onUpdate) config.onUpdate(registration);
            } else {
              // content cached for offline use
              if (config && config.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch(e => {
      // swallow errors silently or console.warn if you prefer
      // console.warn('SW register failed', e);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.unregister();
    });
  }
}