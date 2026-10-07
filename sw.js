// Service Worker для MiniChat.
// Зачем: обычные Notification без воркера теряются, если вкладка выгружена,
// по клику ничего не открывается, и нельзя поставить цифру на иконку.
// С воркером уведомление переживает вкладку, клик открывает нужный чат.
const CACHE = 'minichat-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./','./index.html']).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Клик по уведомлению: открываем приложение и сразу нужный чат.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Закрытие уведомления — снимаем цифру с иконки.
self.addEventListener('notificationclose', () => {});

// На случай, если push придёт извне в будущем: FCM отправляет в эти события.
self.addEventListener('push', e => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(self.registration.showNotification(p.title || 'MiniChat', {
    body: p.body || '',
    icon: p.icon || './icon-192.png',
    badge: p.badge || './icon-192.png',
    tag: p.tag || 'minichat',
    renotify: !!p.renotify,
    data: { url: p.url || './' }
  }));
});