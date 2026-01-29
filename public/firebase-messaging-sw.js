// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-4803952210-fa8bf",
  "appId": "1:332002577508:web:55641406f4e36e7017a371",
  "apiKey": "AIzaSyApfPZJEp8ydYKMSXe6QDckwmzNYTDSFCc",
  "authDomain": "studio-4803952210-fa8bf.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "332002577508"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  const notificationTitle = payload.notification.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/icon-192x192.png' // Make sure you have this icon in your public folder
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
