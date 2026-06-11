// Firebase Configuration
// This file IS committed to the repo because the site is hosted on GitHub Pages.
// The apiKey below is NOT a secret: Firebase security is enforced server-side
// by firestore.rules (isAdmin() whitelist) and by the adminEmails whitelist
// in this file (used by the client-side Google sign-in flow).

var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCymrWrS9Xm5a-_aLNrGNrV6uWnJOc744A",
    authDomain: "mon-portfolio-a976b.firebaseapp.com",
    projectId: "mon-portfolio-a976b",
    storageBucket: "mon-portfolio-a976b.firebasestorage.app",
    messagingSenderId: "399672092330",
    appId: "1:399672092330:web:1fbd1f94a63e7d006852d3",
    // Whitelist des emails autorises a acceder a l'admin
    adminEmails: [
        "ryanjhider@gmail.com"
    ]
};
