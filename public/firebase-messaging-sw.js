/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "studio-4803952210-fa8bf",
  appId: "1:332002577508:web:55641406f4e36e7017a371",
  apiKey: "AIzaSyApfPZJEp8ydYKMSXe6QDckwmzNYTDSFCc",
  authDomain: "studio-4803952210-fa8bf.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "332002577508",
  storageBucket: "studio-4803952210-fa8bf.appspot.com",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  
  const notificationTitle = payload.notification.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/favicon.ico',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
