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

// Listener directo para eventos push (más confiable)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event recibido:', event);

  if (event.data) {
    const payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Payload:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Nueva Notificación';
    const notificationBody = payload.notification?.body || payload.data?.body || '';

    // Enviar mensaje a todas las ventanas/tabs abiertas de la app
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        console.log('[firebase-messaging-sw.js] Clientes encontrados:', clientList.length);
        clientList.forEach((client) => {
          client.postMessage({
            type: 'FCM_MESSAGE',
            title: notificationTitle,
            body: notificationBody,
            data: payload.data || {},
            messageId: payload.messageId || Date.now().toString()
          });
        });

        // Mostrar notificación del sistema
        const notificationOptions = {
          body: notificationBody,
          icon: '/assets/icon/favicon.png',
          badge: '/assets/icon/favicon.png',
          data: payload.data || {},
          vibrate: [200, 100, 200],
          tag: 'fcm-notification-' + Date.now(),
          requireInteraction: false,
          silent: false
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
      })
    );
  }
});

// Manejar notificaciones en background (backup)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationBody = payload.notification?.body || '';

  // Enviar mensaje a todas las ventanas/tabs abiertas de la app
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage({
        type: 'FCM_MESSAGE',
        title: notificationTitle,
        body: notificationBody,
        data: payload.data,
        messageId: payload.messageId || Date.now().toString()
      });
    });
  });

  const notificationOptions = {
    body: notificationBody,
    icon: '/assets/icon/favicon.png',
    badge: '/assets/icon/favicon.png',
    data: payload.data,
    vibrate: [200, 100, 200],
    tag: 'fcm-bg-' + Date.now()
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notificación clickeada:', event);

  event.notification.close();

  // Abrir la app o enfocar ventana existente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla y enviar mensaje
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/tabs/notifications');
      }
    })
  );
});

console.log('[firebase-messaging-sw.js] Service Worker cargado correctamente');
