# PORTFOLIO ISART - CONTEXTE TECHNIQUE
# Derniere mise a jour: 18 Juillet 2026

## Structure du Projet
```
.
├── index.html          # Page d'accueil (Hero + Featured + Stats + Skills)
├── projects.html       # Tous les projets (depuis Firebase)
├── project.html        # Detail projet (via ?id=xxx)
├── about.html          # Page a propos
├── admin.html          # Page administration
├── css/
│   ├── style.css       # Styles principaux (theme PS2 Horror)
│   └── admin.css       # Styles admin
├── js/
│   ├── utils.js        # Helpers partages (escape, safeUrl, tags, links, video)
│   ├── main.js         # Home + projects (Firebase + JSON fallback, filtre tags)
│   ├── project.js      # Page detail (Firebase + JSON fallback)
│   ├── profile.js      # Charge profil Firestore -> DOM (incl. CV)
│   ├── cv-viewer.js    # Lecteur PDF integre (PDF.js, navigation + zoom)
│   ├── admin.js        # Administration (auth + CRUD + compression)
│   └── config.example.js  # Template Firebase config
├── data/
│   └── projects.json   # Donnees locales (fallback dev)
├── images/             # Screenshots (utilises par data/projects.json)
├── firestore.rules     # Regles de securite Firestore
├── DESIGN_BIBLE_PORTFOLIO_PS2_HORROR.md
├── README.md
└── SPEC.md
```

## Technologies Utilisees
- **Frontend**: HTML5, CSS3, JavaScript ES5 (Firebase v8 compat)
- **Backend**: Firebase Firestore (NoSQL cloud)
- **Auth**: Firebase Authentication (email/password)
- **Hebergement**: Firebase Hosting
- **Images**: base64 compressees cote client (canvas) -> Firestore

## Configuration Firebase
Projet: **mon-portfolio-a976b**
- API Key: dans `js/config.js` (gitignored, voir `js/config.example.js`)
- Auth Domain: `mon-portfolio-a976b.firebaseapp.com`
- Project ID: `mon-portfolio-a976b`
- App ID: `1:399672092330:web:1fbd1f94a63e7d006852d3`

---

## STRUCTURE FIRESTORE

### Collection: `profile` (document: `main`)
```json
{
  "name": "Ryan Jhider",
  "title": "Game Design & Programming Student",
  "school": "ISART Digital",
  "location": "France",
  "bio": "Passionate game developer...",
  "description": "3rd year Game Design & Programming student...",
  "avatar": "data:image/jpeg;base64,...",
  "skills": {
    "engines": ["Unity", "Godot"],
    "languages": ["C#", "C++", "Python"],
    "tools": ["Blender", "Git", "FMOD"],
    "softSkills": ["Teamwork", "Problem Solving"]
  },
  "social": {
    "github": "",
    "linkedin": "https://linkedin.com/in/ryan-jhider",
    "itchio": "",
    "email": "ryanjhider@gmail.com"
  },
  "cvUrl": "cv/ryan-jhider.pdf",
  "cvLabel": "Curriculum Vitae",
  "cvData": "",
  "education": [
    { "year": "2025", "label": "3rd Year — ISART Digital", "meta": "Game Design & Programming", "current": true },
    { "year": "2024", "label": "2nd Year — ISART Digital", "meta": "Game Design & Programming" },
    { "year": "2023", "label": "1st Year — ISART Digital", "meta": "Game Design & Programming" }
  ]
}
```

### Collection: `projects` (documents avec id = slug)
```json
{
  "id": "heistgaard",
  "title": "Heistgaard",
  "description": "Court",
  "descriptionLong": "Long...",
  "year": "2025",
  "date": "2025",
  "status": "published",
  "featured": true,
  "video": "https://www.youtube.com/embed/...",
  "thumbnail": "data:image/jpeg;base64,...",
  "images": ["data:image/jpeg;base64,..."],
  "tags": [
    {"name": "Game Design & Programming", "category": "role"},
    {"name": "Unity", "category": "engine"},
    {"name": "C#", "category": "language"}
  ],
  "links": [
    {"type": "itchio", "url": "https://labriquerouge.itch.io/heistg"}
  ],
  "platform": "PC (Steam)",
  "team": "12 developers",
  "context": "School",
  "duration": "2-month school project",
  "role": "Game Designer & Programmer"
}
```

**Format `links`** : tableau `[{type, url}]` (uniformise).
**Format `tags`** : tableau `[{name, category}]` (categories : engine, language, role, genre, platform, tool, other).

---

## FONCTIONNALITES IMPLEMENTEES

### 1. Chargement des donnees
- **Firebase en priorite** -> Si echec, fallback `data/projects.json`
- Toutes les pages utilisent le meme systeme via `js/utils.js` + Firebase SDK

### 2. Page Projet (project.html)
Layout deux colonnes:
- Hero: Titre + Sous-titre (Year // Platform // Status) + Media (YouTube iframe ou Image)
- Pills: engine + genre + mode
- Colonne gauche: Description + Liens + Galerie
- Colonne droite: Details (Release, Year, Platform, Status, Featured, My Role, Team, Context, Duration, Languages) + Tech (tags colores)

### 3. Filtre tags dynamique (projects.html)
- Genere dynamiquement depuis les tags uniques des projets
- Multi-select (logique **OR**)
- Bouton "All" pour reset
- Couleurs differentes par categorie (voir ci-dessous)

### 4. Page Admin
- Auth Firebase (email/password)
- Upload d'images: compression canvas cote client (max 600/1280/400px selon usage)
- CRUD projets (create, edit, delete, list, filter)
- **Reordonner les projets par drag-and-drop** (poignee `≡` sur chaque carte) -> champ `order` (number) stocke dans Firestore
- Bouton "Reinitialiser (tri par date)" -> efface le champ `order` sur tous les projets
- Edition profil
- Import JSON vers Firestore (projets + profil)

### 5. Design - THEME PS2 HORROR
- **Couleurs** : void #0a0908, surface #1c1e1a, creme #e2d8c8, phosphor #3dff5e, blood #7a1515
- **Effets** : Grain de film, scanlines CRT
- **Typographie** : Bebas Neue (titres), Space Grotesk (corps), Share Tech Mono (labels)
- **Animations** : Hover avec glow, transitions smooth

### Couleurs des tags
- `engine` : `#3dff5e` (phosphor vert)
- `language` : `#4ecdc4` (cyan)
- `role` : `#a855f7` (violet)
- `genre` : `#ef4444` (rouge)
- `platform` : `#f59e0b` (orange)
- `tool` : `#10b981` (emerald)
- `other` : `#6b7280` (gris)

---

## FONCTIONS JS PRINCIPALES

### `js/utils.js`
- `escapeHtml(str)` / `escapeAttr(str)` : anti-XSS
- `safeUrl(url)` : rejette `javascript:`, `data:`, accepte `http(s)`, `mailto:`, `/`, `#`
- `getTagName(tag)` / `getTagCategory(tag)` : normalise tag objet/string
- `normalizeLinks(links)` : accepte tableau OU objet, retourne `[{type, url}]`
- `linkLabel(type)` : 'Itch.io', 'Steam', 'GitHub', etc.
- `getTagColor(category)` : couleur par categorie
- `getProjectPlatform(project, fallback)` : renvoie le tag `platform` (defaut `PC`). **Le champ `p.platform` texte n'existe plus** : la plateforme est uniquement stockee comme tag de categorie `platform`.
- `extractVideoId(video)` : extrait ID YouTube depuis watch/embed/youtu.be/raw
- `sortProjectsByDateDesc(list)` : tri stable (fallback si pas d'`order`)
- `sortProjectsByOrder(list)` : tri par `order` asc, fallback date desc pour projets sans `order`

### `js/main.js`
- `loadData()` : Firebase -> fallback JSON
- `renderProjects()` : featured sur home, tous sur projects
- `buildFilterBar()` : genere boutons filtres depuis tags uniques
- `getFilteredProjects()` : applique OR logic
- `updateStats()` : compteurs projects/featured/years
- `afterLoad()` : declenche aussi `window.loadProfile()`

### `js/project.js`
- `loadProject(id)` : Firebase -> fallback JSON
- `renderProject(p)` : hero + media + pills + description + links + details + tech + gallery
- `extractVideoId()` (duplique de utils)

### `js/profile.js`
- `loadProfile()` : Firebase -> fallback JSON
- `applyProfile(data)` : peuple DOM (textContent, setAttribute, innerHTML escape)
- Selecteurs : `.profile-name`, `.profile-title`, `.profile-school`, `.profile-location`, `.profile-bio`, `.profile-description`, `.profile-avatar`, `.social-*`, `#education-timeline`, `#about-skills-section`, `#about-cv-section`, `[data-show-when="<field>"]`
- `applyShowWhen(field, value)` : montre/cache les elements `[data-show-when="<field>"]` selon la presence de `p[field]`
- `applyAvatar(value)` : affiche `#about-avatar-wrap` + `.profile-avatar` uniquement si `p.avatar` est renseigne
- `applySkillsSection(skills)` : affiche `#about-skills-section` et chaque `[data-skills-group]` uniquement si le groupe a au moins une entree
- `applyEducation(list)` : rend dynamiquement `#education-timeline` depuis `profile.education` (tri annee desc, badge `// NOW` + dot plein si `current`)
- `applyCv(p)` : hydrate la section `#cv-viewer` (label + URL/base64) et declenche `initCvViewer()`; cache la section si aucune source

### `js/cv-viewer.js`
- `initCvViewer()` : charge le PDF depuis `#cv-source` (data: URL ou URL externe)
- Navigation : boutons prev/next, saisie directe du n° de page, fleches ←/→
- Zoom : boutons +/−, touches +/-, plage 50% -> 300% par pas de 20%
- Rend chaque page sur `<canvas>` avec DPR adapte pour la nettete Retina
- Loader + spinner pendant le rendu, gestion d'erreurs avec message explicite
- Bouton "Telecharger" -> lien direct vers le PDF (`download` attribute)
- Affiche un placeholder propre si aucun CV n'est renseigne

**Section CV** : `#cv-viewer` dans `about.html` (apres le bloc Bio + Timeline). Style PS2 Horror (scanlines + glow phosphor). Toolbar en haut (pages, zoom, telechargement), zone de lecture en dessous.

### `js/admin.js`
- `doLogin()` / `doLogout()` / `checkAuth()` : Firebase Auth
- `loadProjects()` / `renderProjects()` : liste admin
- `editProject(id)` / `deleteProject(id)` : CRUD
- `showCreateForm(project?)` : formulaire (le champ texte `platform` a ete supprime, on utilise un tag de categorie `platform` a la place)
- `saveProject()` : Firestore set (avec rename = delete old). Le champ `platform` n'est plus ecrit.
- `getTags()` / `getLinks()` : extraction form -> data (avec dedup tags, normalisation links en array)
- `compressImage(file, opts)` : canvas resize + JPEG quality
- `handleImage(file, target)` / `handleImages(files, target)` : upload avec compression
- `loadProfile()` / `saveProfile()` : profil
- `importProjectsFromJSON()` / `importProfileFromJSON()` : migration
- `migratePlatformToTag()` : migration one-shot, convertit l'ancien champ `platform` (string) en tag de categorie `platform` sur tous les projets Firestore, puis supprime le champ. Idempotente. Declenchable depuis Parametres Firebase > "Migrer les projets".

---

## FICHIERS HTML - STRUCTURE

### index.html
- Header avec nav (Home, Projects, About)
- Hero avec badge `ISART DIGITAL // <span class="profile-school">3RD YEAR</span>`
- Stats (projects, featured, years, school)
- Featured Projects (filtre bar = All only sur home)
- Skills (4 groupes : engines, languages, tools, softSkills)
- Footer (liens sociaux charges via `.social-*`)

### projects.html
- Filter bar dynamique (`#filter-bar`)
- Projects grid avec tous les projets

### project.html
- Breadcrumb "Back to Projects"
- Hero avec titre + subtitle + media
- Pills (engine, genre, mode)
- Grid 2 colonnes

### about.html
Sections :
- Page header (`// PROFILE_DUMP` + `ABOUT` + ligne phosphor)
- Bloc identite : nom (`.profile-name`) + role (`.profile-title` @ `.profile-school` via `[data-show-when="school"]`) + ligne LOC (`.profile-location` via `[data-show-when="location"]`)
- Bio (`.profile-description` + `.profile-bio`)
- Timeline education (`#education-timeline` rendue dynamiquement depuis `profile.education`)
- Section DOCUMENT (CV) `#about-cv-section` : affichee uniquement si `cvUrl` ou `cvData` est renseigne
- Section LOADOUT (Skills) `#about-skills-section` : affichee uniquement si au moins un groupe est renseigne; les groupes vides sont masques individuellement
- Footer

L'avatar (`#about-avatar-wrap` + `.profile-avatar`) n'est rendu que si `p.avatar` est defini dans Firebase.

Profile data chargee via `.profile-name`, `.profile-title`, `.profile-school`, `.profile-location`, `.profile-bio`, `.profile-description`, `.profile-avatar`, `.social-*`, `#education-timeline`, `#about-cv-section`, `#about-skills-section`.

**Pilotage conditionnel** : `js/profile.js` utilise `applyShowWhen(field, value)` pour montrer/cacher les elements `[data-show-when="<field>"]` selon la presence de `p[field]`, et `applyAvatar / applySkillsSection / applyCv` pour les sections qui dependent de la donnee.

### admin.html
- Login screen
- Dashboard sidebar (Projects, New project, Settings, Profile)
- Formulaire projet complet (basic, media, tags, links)
- Formulaire profil (avatar, infos, skills, social)

---

## SECURITE (XSS)

Toutes les insertions dans le DOM :
- `textContent` : pour les valeurs simples (titre, description, etc.)
- `innerHTML` : UNIQUEMENT apres `PortfolioUtils.escapeHtml(value)`
- URLs : verifiees par `PortfolioUtils.safeUrl(url)` avant `href`
- Liens externes : `target="_blank" rel="noopener noreferrer"`

`js/utils.js` est la seule source de verite pour l'echappement. Ne JAMAIS utiliser `innerHTML` avec des donnees non echappees ailleurs.

---

## COMPRESSION IMAGES (CRITIQUE)

Firestore : **limite 1 MB par document**. Les images sont stockees en base64 (donc +33%).

Compression cote client dans `js/admin.js` → `compressImage()` :
- **Thumbnail** : max 600px, q=0.7 (JPEG) -> ~30-80 KB
- **Gallery** : max 1280px, q=0.75 -> ~100-200 KB par image
- **Avatar** : max 400px, q=0.75 -> ~20-50 KB

Un projet (1 thumb + 4 images gallery) tient dans ~500-800 KB. Sous la limite.

**Pas de Firebase Storage** (coût). Compression client obligatoire.

---

## NOTES POUR PROCHAINE IA

1. **Lire ce CONTEXT.md en premier** + `SPEC.md`
2. **Firebase est la source de verite** - JSON = fallback dev uniquement
3. **Images: base64 dans Firestore** (apres compression canvas) - PAS de Storage
4. **Tags: format objet** - `{"name": "Unity", "category": "engine"}`
5. **Liens: format tableau** - `[{"type": "itchio", "url": "..."}]` (uniformise)
6. **XSS**: utiliser `PortfolioUtils.escapeHtml` / `escapeAttr` / `safeUrl`
7. **Debug**: Console F12 (Firebase + erreurs canvas)

Pour modifier l'affichage, editer `js/main.js` / `js/project.js` / `css/style.css`.
Pour l'admin, editer `js/admin.js` / `admin.html` / `css/admin.css`.
Pour les helpers partages, editer `js/utils.js`.
