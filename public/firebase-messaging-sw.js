// These scripts are imported by the browser.
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Your web app's Firebase configuration.
// It's safe to expose this, as security is handled by Firestore rules.
const firebaseConfig = {
  "projectId": "studio-4803952210-fa8bf",
  "appId": "1:332002577508:web:55641406f4e36e7017a371",
  "apiKey": "AIzaSyApfPZJEp8ydYKMSXe6QDckwmzNYTDSFCc",
  "authDomain": "studio-4803952210-fa8bf.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "332002577508"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification?.title || "Hotel RIGUT";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva notificación.",
    icon: "/icon-192x192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
