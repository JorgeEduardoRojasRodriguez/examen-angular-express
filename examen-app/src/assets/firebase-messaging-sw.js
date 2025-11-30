// Firebase Messaging Service Worker
// Este archivo maneja las notificaciones push en segundo plano (background)

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Configuración de Firebase (debe coincidir con environment.ts)
firebase.initializeApp({
  apiKey: "AIzaSyB4XC8BS79K2NIStLAYynXaPd4EWC__Daw",
  authDomain: "examen-ecuador.firebaseapp.com",
  projectId: "examen-ecuador",
  storageBucket: "examen-ecuador.firebasestorage.app",
  messagingSenderId: "999739598572",
  appId: "1:999739598572:web:35302a0433131d9cade7c9"
});

const messaging = firebase.messaging();

// Manejar notificaciones en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/assets/icon/favicon.png',
    badge: '/assets/icon/favicon.png',
    data: payload.data,
    vibrate: [200, 100, 200],
    tag: 'notification-' + Date.now(),
    requireInteraction: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);

  event.notification.close();

  // Abrir la app o enfocar ventana existente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('[firebase-messaging-sw.js] Service Worker cargado');
