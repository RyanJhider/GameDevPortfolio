# Portfolio ISART Digital

Portfolio etudiant pour un etudiant en **Game Design & Programming** a ISART Digital - 3eme annee.

Theme visuel : **PS2 Horror** (phosphor vert + blood rouge sur void noir, grain de film, scanlines CRT).

---

## Pages

| Route | Description |
|-------|-------------|
| `index.html` | Hero + Stats + Featured Projects + Skills (profil Firestore) |
| `projects.html` | Tous les projets + filtre dynamique multi-tags |
| `project.html?id=xxx` | Detail projet (video YouTube, galerie, liens, tags) |
| `about.html` | Bio + timeline education (profil Firestore) |
| `admin.html` | Auth Firebase + CRUD projets + edition profil |

---

## Stack

- **Frontend** : HTML5, CSS3, JavaScript ES5 (Firebase v8 compat)
- **Backend** : Firebase Firestore (NoSQL cloud)
- **Auth** : Firebase Authentication (email/password)
- **Hebergement** : Firebase Hosting
- **Images** : base64 compressees cote client avant envoi Firestore

### Police et theme

- Titres : **Bebas Neue** (uppercase, large)
- Corps : **Space Grotesk**
- Labels / monospace : **Share Tech Mono**

Couleurs :
- Fond : `#0a0908` (void noir)
- Surface : `#1c1e1a`
- Texte : `#e2d8c8` (creme)
- Accent phosphor : `#3dff5e`
- Accent blood : `#7a1515`

### Effets

- Grain de film anime (body::before)
- Scanlines CRT (body::after)
- Hover avec glow phosphor
- Loading screen "INITIALIZING..." (600ms)

---

## Structure

```
.
├── index.html
├── projects.html
├── project.html
├── about.html
├── admin.html
├── css/
│   ├── style.css         # Theme PS2 Horror (public)
│   └── admin.css         # Dashboard admin
├── js/
│   ├── utils.js          # Helpers partages (escape, safeUrl, tags, links)
│   ├── main.js           # Home + projects (filtre tags, stats)
│   ├── project.js        # Page detail projet
│   ├── profile.js        # Charge le profil Firestore -> DOM
│   ├── admin.js          # Dashboard admin (auth + CRUD + compression)
│   └── config.example.js # Template de config Firebase
├── data/
│   └── projects.json     # Donnees de demo (fallback)
├── images/               # Screenshots projets (utilises par data/projects.json)
├── firestore.rules       # Regles de securite Firestore
├── DESIGN_BIBLE_PORTFOLIO_PS2_HORROR.md
└── README.md
```

---

## Configuration Firebase

1. Creer un projet Firebase
2. Activer **Firestore Database** et **Authentication** (Email/Password)
3. Copier `js/config.example.js` vers `js/config.js` et remplir les valeurs
4. Deployer les regles Firestore (voir `firestore.rules`)

```bash
cp js/config.example.js js/config.js
# Editer js/config.js avec vos identifiants
```

`js/config.js` est dans `.gitignore` : ne jamais le committer.

### Regles Firestore

`firestore.rules` (resume) :
- `projects` : lecture publique, ecriture authentifiee
- `profile` : lecture publique, ecriture authentifiee

---

## Developpement local

```bash
# Servir le dossier racine
node test-server.js
# Ou avec Python
python -m http.server 8000
```

Puis ouvrir <http://127.0.0.1:8000> (ou le port utilise).

Sans Firebase configure, le site fonctionne en mode **fallback JSON** :
`data/projects.json` alimente les pages publiques.

---

## Fonctionnement du tag filter (projects.html)

1. Les projets sont charges depuis Firestore (ou `data/projects.json`)
2. La barre de filtres est generee dynamiquement : un bouton par tag unique
3. Les tags sont groupes par categorie (engine, language, role, genre, platform, tool, other)
4. Cliquer un tag l'ajoute/retire de la selection (multi-select, logique **OR**)
5. Bouton "All" : reset
6. Le projet est affiche s'il possede **au moins un** des tags actifs

Implementation : `js/main.js` → fonction `buildFilterBar()`.

---

## Schema Firestore

### `profile` / `main` (document)

```json
{
  "name": "Ryan Jhider",
  "title": "Game Design & Programming Student",
  "school": "ISART Digital",
  "location": "France",
  "bio": "...",
  "description": "...",
  "avatar": "data:image/jpeg;base64,...",
  "skills": {
    "engines": ["Unity", "Godot"],
    "languages": ["C#", "C++"],
    "tools": ["Blender", "Git"],
    "softSkills": ["Teamwork"]
  },
  "social": {
    "github": "https://...",
    "linkedin": "https://...",
    "itchio": "https://...",
    "email": "ryanjhider@gmail.com"
  }
}
```

### `projects` / `{id}` (document)

```json
{
  "id": "heistgaard",
  "title": "Heistgaard",
  "description": "Court",
  "descriptionLong": "Long...",
  "year": "2025",
  "date": "2025",
  "platform": "PC (Steam)",
  "status": "published",
  "featured": true,
  "video": "https://www.youtube.com/embed/...",
  "thumbnail": "data:image/jpeg;base64,...",
  "images": ["data:image/jpeg;base64,..."],
  "tags": [
    {"name": "Unity", "category": "engine"},
    {"name": "C#", "category": "language"},
    {"name": "Game Design & Programming", "category": "role"}
  ],
  "links": [
    {"type": "itchio", "url": "https://labriquerouge.itch.io/heistg"}
  ],
  "team": "12 developers",
  "context": "School",
  "duration": "2-month school project",
  "role": "Game Designer & Programmer"
}
```

**Couleurs des tags** (`js/utils.js` → `getTagColor`) :
- `engine` : `#3dff5e` (phosphor vert)
- `language` : `#4ecdc4` (cyan)
- `role` : `#a855f7` (violet)
- `genre` : `#ef4444` (rouge)
- `platform` : `#f59e0b` (orange)
- `tool` : `#10b981` (emerald)
- `other` : `#6b7280` (gris)

---

## Compression des images (admin)

Firestore a une limite stricte de **1 MB par document**. Les images en base64 consomment ~33% de plus.

L'admin compresse cote client avant upload (`js/admin.js` → `compressImage`) :
- **Thumbnail** : max 600px de large, JPEG q=0.7 → ~30-80 KB
- **Gallery** : max 1280px de large, JPEG q=0.75 → ~100-200 KB
- **Avatar** : max 400px de large, JPEG q=0.75 → ~20-50 KB

Un projet typique (1 thumb + 4-5 images gallery) tient dans ~600-900 KB, sous la limite.

**Pas de Firebase Storage** : tout est en base64 dans le document Firestore.

---

## Deploiement

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init (une seule fois)
firebase init hosting

# Deploy
firebase deploy
```

`firebase.json` a ete omis du repo pour eviter d'imposer une config. A generer avec `firebase init`.

---

## Tests / validation

```bash
# Syntaxe JS
node --check js/main.js js/admin.js js/utils.js js/project.js js/profile.js

# Smoke tests
node test-utils.js
node test-profile.js
node test-filter.js

# Test de compression image (ouvrir dans le navigateur)
# http://localhost:8000/test-image-compress.html
```

---

## Contact

ryanjhider@gmail.com
