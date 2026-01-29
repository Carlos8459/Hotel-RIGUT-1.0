// Este archivo DEBE estar en la carpeta 'public' para ser servido en la raíz de tu sitio.

// Aunque este proyecto usa el SDK modular, los service workers tienen requerimientos de importación específicos.
// Usamos `importScripts` para cargar los SDK de Firebase para service workers.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// La configuración de tu Firebase Web App.
// Es la misma configuración de src/firebase/config.ts
const firebaseConfig = {
  "projectId": "studio-4803952210-fa8bf",
  "appId": "1:332002577508:web:55641406f4e36e7017a371",
  "apiKey": "AIzaSyApfPZJEp8ydYKMSXe6QDckwmzNYTDSFCc",
  "authDomain": "studio-4803952210-fa8bf.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "332002577508"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener una instancia de Firebase Messaging para que pueda manejar mensajes en segundo plano.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );

  // Personaliza la notificación aquí
  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje.',
    icon: '/icon-192x192.png' // Un ícono por defecto para tu app
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
