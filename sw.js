const CACHE_NAME = 'mood-tracker-clean-v1';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/state.js',
  './js/utils.js',
  './js/db.js',
  './js/tags.js',
  './js/ui.js',
  './js/notifications.js',
  './js/app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

let reminderTimeoutId = null;
let reminderTime = null;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SET_REMINDER') {
    reminderTime = data.time || null;
    scheduleReminder(reminderTime);
  }

  if (data.type === 'CLEAR_REMINDER') {
    clearReminder();
  }
});

function clearReminder() {
  if (reminderTimeoutId) {
    clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;
  }
  reminderTime = null;
}

function scheduleReminder(timeString) {
  if (!timeString) return;

  if (reminderTimeoutId) {
    clearTimeout(reminderTimeoutId);
    reminderTimeoutId = null;
  }

  const [hours, minutes] = timeString.split(':').map(Number);

  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next.getTime() - now.getTime();

  reminderTimeoutId = setTimeout(async () => {
    await self.registration.showNotification('Mood Tracker', {
      body: 'Take a moment to log how you feel today.',
      icon: './icon-192.png',
      badge: './icon-192.png'
    });

    if (reminderTime) {
      scheduleReminder(reminderTime);
    }
  }, delay);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});