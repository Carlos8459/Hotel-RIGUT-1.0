// Scripts para Firebase y Firebase Messaging (versión de compatibilidad para service workers)
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Configuración de Firebase de tu aplicación web.
// NOTA: Esta información es pública y es seguro tenerla aquí.
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

// Obtener una instancia de Firebase Messaging para que pueda manejar los mensajes en segundo plano.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano ', payload);

  // Personaliza la notificación aquí
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Asegúrate de tener este ícono en tu carpeta /public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
