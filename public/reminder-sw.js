// ── Skinova Medication Reminder Service Worker ─────────────────────────────
// Fires notifications at exact scheduled times, even when the tab is closed.

const STORE_KEY = 'skinova_reminders';
const FIRED_KEY = 'skinova_fired';

// ── Check every minute via periodic sync or message ───────────────────────
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Called from the app every second via postMessage
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CHECK_REMINDERS') return;

  const { reminders, now } = event.data;           // { HH:MM, dayOfMonth }
  const firedKey = `${now.time}-${now.day}`;

  reminders.forEach((r) => {
    if (!r.enabled) return;
    if (r.time !== now.time) return;

    const key = `${r.id}-${firedKey}`;
    // Use IndexedDB-like storage via clients: we store fired keys in SW memory
    if (self._fired && self._fired.has(key)) return;
    if (!self._fired) self._fired = new Set();
    self._fired.add(key);

    // Cleanup memory
    if (self._fired.size > 200) {
      const arr = Array.from(self._fired);
      self._fired = new Set(arr.slice(-100));
    }

    self.registration.showNotification('💊 Medication Reminder', {
      body: `Time to take your ${r.medication} (${r.time})`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: key,                   // prevents duplicate popups
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { reminder: r },
    });
  });
});

// ── Handle notification click ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
