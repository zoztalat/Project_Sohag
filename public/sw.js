// sw.js — Medication Reminder Service Worker
// Place this file in: myAPP/public/sw.js

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Store active reminders in memory
let reminders = [];

// Check every minute if any reminder matches current time
setInterval(() => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  reminders.forEach((reminder) => {
    if (reminder.enabled && reminder.time === currentTime) {
      self.registration.showNotification('💊 Medication Reminder', {
        body: `Time to take your ${reminder.medication}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `reminder-${reminder.id}-${currentTime}`, // unique per minute so it doesn't collapse
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { medication: reminder.medication, time: reminder.time, id: reminder.id },
        actions: [
          { action: 'taken', title: '✅ Taken' },
          { action: 'snooze', title: '⏰ Snooze 10min' },
        ],
      });
    }
  });
}, 60 * 1000); // every 60 seconds

// Receive reminders list from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_REMINDERS') {
    reminders = event.data.reminders;
    console.log('[SW] Reminders updated:', reminders);
  }
});

// Handle notification button clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'snooze') {
    const { medication, time, id } = event.notification.data;
    // Show again after 10 minutes
    setTimeout(() => {
      self.registration.showNotification('💊 Snoozed Reminder', {
        body: `(Snoozed) Time to take your ${medication}`,
        icon: '/favicon.ico',
        tag: `snooze-${id}-${Date.now()}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { medication, time, id },
        actions: [
          { action: 'taken', title: '✅ Taken' },
        ],
      });
    }, 10 * 60 * 1000);
    return;
  }

  // Focus or open the app on click
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});
