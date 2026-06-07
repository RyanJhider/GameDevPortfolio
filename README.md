# 🎮 Portfolio ISART Digital

Portfolio étudiant pour un étudiant en **Game Design & Programming** à ISART Digital - 3ème année.

![Portfolio Preview](https://img.shields.io/badge/Status-Actif-green) ![Firebase](https://img.shields.io/badge/Storage-Firebase_Firestore-blue)

---

## ✨ Fonctionnalités

- 🎨 **Design moderne** avec thème sombre cyberpunk
- ✨ **Animations fluides** (particules, typing effect, scroll animations)
- 🔥 **Firebase Firestore** - Base de données cloud en temps réel
- ⚙️ **Admin Panel** - Interface d'administration pour gérer le contenu
- 🏷️ **Système de tags** par catégorie (Rôle, Moteur, Langage, Outil)
- 🎥 **Support vidéo** (YouTube embeds, vidéos locales)
- 📷 **Galerie photos** par projet
- 🔍 **Filtrage des projets** par catégorie
- 📱 **Responsive design** (mobile, tablette, desktop)

---

## 🏗️ Architecture

```
Portfolio ISART
├── Firebase Firestore (Cloud)
│   ├── collection: "profile" (document: "main")
│   └── collection: "projects" (documents individuels)
│
└── Fichiers locaux
    ├── index.html      # Accueil (Hero + Featured Projects + About)
    ├── projects.html   # Tous les projets
    ├── project.html    # Détail d'un projet (?id=xxx)
    ├── about.html      # Page À propos
    ├── admin.html      # Panel d'administration
    ├── css/style.css   # Styles
    └── js/main.js      # Logique Firebase + affichage
```

---

## ⚙️ Configuration Firebase

### Variables d'environnement (dans chaque HTML)

```javascript
var FIREBASE_CONFIG = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "mon-portfolio.firebaseapp.com",
    projectId: "mon-portfolio",
    storageBucket: "mon-portfolio.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### Structure Firestore

```
Firestore Database
│
├── profile (collection)
│   └── main (document)
│       ├── name: "Ryan Jhider"
│       ├── title: "Game Design & Programming Student"
│       ├── bio: "Passionate game developer..."
│       ├── description: "3rd year student..."
│       ├── avatar: "url vers image"
│       ├── location: "France"
│       ├── school: "ISART Digital"
│       ├── skills: {
│       │   ├── engines: ["Unity", "Godot"]
│       │   ├── languages: ["C#", "C++", "Python"]
│       │   ├── tools: ["Blender", "Git", "FMOD"]
│       │   └── softSkills: ["Teamwork", "Problem Solving"]
│       │   }
│       └── social: {
│           ├── github: "https://github.com/..."
│           ├── linkedin: "https://linkedin.com/..."
│           ├── itchio: "https://itch.io/..."
│           ├── email: "email@gmail.com"
│           └── twitter: "https://twitter.com/..."
│           }
│
└── projects (collection)
    └── {project-id} (documents)
        ├── id: "nebula-drift"
        ├── title: "Nebula Drift"
        ├── description: "Short description"
        ├── descriptionLong: "Long description..."
        ├── thumbnail: "url vers image"
        ├── video: "url vidéo ou YouTube embed"
        ├── gallery: ["url1", "url2", ...]
        ├── tags: [
        │   {name: "Lead Programmer", category: "role"},
        │   {name: "Unity", category: "engine"},
        │   {name: "C#", category: "language"}
        │ ]
        ├── links: {
        │   itchio: "https://itch.io/...",
        │   github: "https://github.com/...",
        │   playstore: "https://play.google.com/...",
        │   web: "https://web-url.com"
        │   }
        ├── date: "2024"
        └── featured: true
```

---

## 🎛️ Panel Admin

Le fichier `admin.html` fournit une interface pour gérer le contenu :

### Fonctionnalités

- 📤 **Importer un profil** - Chargement depuis JSON local vers Firestore
- ➕ **Ajouter un projet** - Création d'un nouveau projet
- ✏️ **Modifier un projet** - Édition d'un projet existant
- 🗑️ **Supprimer un projet** - Suppression d'un projet
- 👁️ **Aperçu** - Visualisation rapide

### Accès

1. Ouvrez `admin.html` dans votre navigateur
2. Cliquez sur les boutons d'action

---

## 🚀 Déploiement

### Option 1: Hébergement Firebase

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser
firebase init

# Déployer
firebase deploy
```

### Option 2: GitHub Pages

```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

---

## 🖥️ Développement local

### Prérequis
- Node.js (pour Firebase CLI)
- Navigateur moderne
- Compte Firebase

### Étapes

1. **Créer un projet Firebase**
   - Allez sur [firebase.google.com](https://firebase.google.com)
   - Créez un nouveau projet
   - Activez Firestore Database

2. **Configurer les règles Firestore**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

3. **Lancer en local**
   ```bash
   # Avec Python
   python -m http.server 8000
   
   # Ou avec Node
   npx serve .
   ```

4. **Ouvrir** `http://localhost:8000`

---

## 🎯 Catégories de tags

| Catégorie | Couleur | Exemples |
|-----------|---------|----------|
| `role` | 🔴 Rose/Rouge | Lead Programmer, Game Designer |
| `engine` | 🟠 Orange | Unity, Unreal Engine, Godot |
| `language` | 🟣 Violet | C#, C++, Python, GDScript |
| `tool` | 🔵 Teal | Blender, Photoshop, Git |

---

## 📁 Structure des fichiers

```
portfolio/
├── index.html          # Page d'accueil
├── projects.html      # Tous les projets
├── project.html       # Détail d'un projet (?id=xxx)
├── about.html         # À propos
├── admin.html         # Panel d'administration
├── css/
│   └── style.css      # Styles principaux
├── js/
│   ├── main.js        # Logique Firebase + affichage
│   ├── particles.js   # Animation particules
│   └── typing.js      # Animation typing
├── assets/
│   ├── thumbnails/    # Images miniatures projets
│   └── projects/     # Images des projets
├── data/
│   └── projects.json  # (Legacy - non utilisé)
├── FIREBASE-GUIDE.md  # Guide Firebase
├── SPEC.md            # Spécifications techniques
└── README.md          # Ce fichier
```

---

## 🔧 Personnalisation

### Changer les couleurs

Dans `css/style.css` :

```css
:root {
    --accent-primary: #ff3366;
    --accent-secondary: #00ffcc;
    --accent-tertiary: #ffaa00;
}
```

### Modifier le profil

1. Allez sur [firebase.google.com](https://firebase.google.com)
2. Accédez à Firestore Database
3. Modifiez le document `main` dans la collection `profile`

### Ajouter des projets

Via le panel admin (`admin.html`) ou directement dans Firestore.

---

## 🛠️ Technologies

- **HTML5** - Structure
- **CSS3** - Stylage (Variables CSS, Flexbox, Grid)
- **JavaScript ES6+** - Logique
- **Firebase Firestore** - Base de données temps réel
- **Canvas API** - Animation particules

---

## 📧 Contact

Pour toute question : ryanjhider@gmail.com

---

Fait avec ❤️ pour ISART Digital