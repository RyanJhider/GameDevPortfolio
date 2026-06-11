// Firebase Configuration Template
// Copy this file to config.js and fill in your actual values
// DO NOT commit config.js to Git!

var FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    // Whitelist des emails autorises a acceder a l'admin (login Google + email/password)
    // Si vide, tout email authentifie est accepte (deconseille en production)
    adminEmails: [
        "votre@email.com"
    ]
};
