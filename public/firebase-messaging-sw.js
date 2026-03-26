// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC9Mmi2kpizV6_8nlNJxLJKM29mVsuw-PM",
  authDomain: "kentehaul-b1cb5.firebaseapp.com",
  projectId: "kentehaul-b1cb5",
  storageBucket: "kentehaul-b1cb5.firebasestorage.app",
  messagingSenderId: "761348006440",
  appId: "1:761348006440:web:567ab1b48f0f6c5efc8b1d"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Ensure this exists or use a generic icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
