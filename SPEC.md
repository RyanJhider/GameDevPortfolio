# Portfolio ISART Digital - Game Design & Programming

> Specification technique du portfolio. **Reflete l'implementation reelle** (theme PS2 Horror). Pour la reference visuelle detaillee, voir `DESIGN_BIBLE_PORTFOLIO_PS2_HORROR.md`.

---

## 1. Vue d'ensemble

- **Type** : site statique + Firebase Firestore
- **Hebergement prevu** : Firebase Hosting
- **Mode degrade** : fallback `data/projects.json` si Firebase non configure
- **Cible** : recruteurs, studios, collaborateurs

---

## 2. Pages

| URL | Source de verite | Chargee par |
|-----|------------------|-------------|
| `/index.html` | `profile` (Firestore) + `projects.featured` | `js/profile.js` + `js/main.js` |
| `/projects.html` | `projects` (tous) | `js/main.js` |
| `/project.html?id=xxx` | `projects/{id}` (Firestore) ou fallback JSON | `js/project.js` |
| `/about.html` | `profile` (Firestore) | `js/profile.js` |
| `/admin.html` | CRUD complet | `js/admin.js` |

---

## 3. Theme PS2 Horror

### Couleurs (variables CSS)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bg-void` | `#0a0908` | Fond principal |
| `--bg-primary` | `#111210` | Stats, sidebar |
| `--bg-surface` | `#1c1e1a` | Cartes, form sections |
| `--bg-elevated` | `#242621` | Inputs, tag editor |
| `--text-primary` | `#e2d8c8` | Texte courant |
| `--text-secondary` | `#9a9e95` | Sous-texte |
| `--text-muted` | `#5a5d56` | Labels |
| `--accent-phosphor` | `#3dff5e` | CTA, liens, active states |
| `--accent-blood` | `#7a1515` | Boutons primaires, danger |
| `--border-subtle` | `rgba(200,190,170,0.08)` | Separateurs |
| `--border-medium` | `rgba(200,190,170,0.15)` | Bordures visibles |

### Typographie

- **Titres** : `Bebas Neue` (Google Fonts), uppercase, letter-spacing 0.05em
- **Corps** : `Space Grotesk` (Google Fonts)
- **Labels / mono** : `Share Tech Mono` (Google Fonts)

### Effets

- **Grain de film** : `body::before` avec SVG `feTurbulence`, animation 4 steps
- **Scanlines CRT** : `body::after` avec gradient repete
- **Loading screen** : "INITIALIZING..." en Share Tech Mono, 600ms
- **Hover cards** : `translateY(-4px)` + box-shadow 0 8px 32px noir

---

## 4. Schema Firestore

### `profile/{id}`

Document unique (`main` par convention). Champs :
- `name`, `title`, `school`, `location` (string)
- `bio`, `description` (string)
- `avatar` (base64 JPEG compresse, max 400px)
- `skills` (map de 4 listes) : `engines`, `languages`, `tools`, `softSkills`
- `social` (map) : `github`, `linkedin`, `itchio`, `email`

### `projects/{id}`

Document par projet. `id` = slug. Champs :
- `id`, `title`, `description`, `descriptionLong`
- `year`, `date` (string, libre)
- `platform`, `status` (`published` | `draft`), `featured` (bool)
- `video` (URL YouTube embed, watch, ou youtu.be)
- `thumbnail` (base64 JPEG compresse, max 600px)
- `images` (array de base64 JPEG, max 1280px chacune, max 5 recommande)
- `tags` (array d'objets `{name, category}`) — `category` ∈ `engine, language, role, genre, platform, tool, other`
- `links` (array d'objets `{type, url}`) — `type` ∈ `itchio, steam, github, googleplay, demo, other`
- `team`, `context`, `duration`, `role` (strings)

### Couleurs des tags

| Categorie | Couleur | Hex |
|-----------|---------|-----|
| engine | Phosphor vert | `#3dff5e` |
| language | Cyan | `#4ecdc4` |
| role | Violet | `#a855f7` |
| genre | Rouge | `#ef4444` |
| platform | Orange | `#f59e0b` |
| tool | Emerald | `#10b981` |
| other | Gris | `#6b7280` |

---

## 5. Compression des images

Toutes les images uploadées via l'admin sont compressées **côté client** avant d'être stockées en base64 dans Firestore.

| Type | maxWidth | quality | Sortie typique |
|------|----------|---------|----------------|
| Thumbnail | 600px | 0.70 | 30-80 KB |
| Gallery | 1280px | 0.75 | 100-200 KB |
| Avatar | 400px | 0.75 | 20-50 KB |

Implementation : `js/admin.js` → `compressImage(file, opts)`. Utilise `FileReader` + `Image` + `canvas.toDataURL('image/jpeg', quality)`.

**Limite Firestore** : 1 MB / document. Un projet avec 1 thumb + 4-5 images tient largement.

**Pas de Firebase Storage** utilisé (coût).

---

## 6. Architecture JS

### Modules

| Fichier | Role | Charge par |
|---------|------|-----------|
| `js/utils.js` | Helpers partages : `escapeHtml`, `safeUrl`, `getTagName/Category`, `normalizeLinks`, `linkLabel`, `getTagColor`, `extractVideoId`, `sortProjectsByDateDesc` | toutes les pages |
| `js/main.js` | Charge `projects`, rend grille, gere filtre tags, stats | index, projects |
| `js/project.js` | Charge 1 projet, rend hero/pills/details/gallery/links | project |
| `js/profile.js` | Charge `profile`, applique au DOM (textes, skills, social) | index, projects, about |
| `js/admin.js` | Auth Firebase, CRUD projets, CRUD profil, compression, import JSON | admin |
| `js/config.js` | (gitignored) Firebase config : `apiKey`, `authDomain`, `projectId`, etc. | toutes les pages |

### Flux de chargement (pages publiques)

```
HTML parse
  -> js/config.js  (FirebaseConfig global)
  -> Firebase SDK (app, firestore)
  -> js/utils.js
  -> js/profile.js (charge profile)
  -> js/main.js ou js/project.js (charge projects)
     -> Firebase en priorite
     -> fallback data/projects.json
```

### Securite

- Toutes les insertions `innerHTML` passent par `PortfolioUtils.escapeHtml` / `escapeAttr`
- URLs externes validees par `PortfolioUtils.safeUrl` (rejette `javascript:`, `data:`)
- `textContent` utilise pour les valeurs simples (titles, descriptions)
- Liens externes : `target="_blank" rel="noopener noreferrer"`

---

## 7. Filtre multi-tags (projects.html)

**Comportement** :
1. La barre de filtres est generee dynamiquement depuis les tags uniques des projets charges
2. Tags groupes par categorie dans l'ordre : engine, language, role, genre, platform, tool, other
3. Cliquer un tag : toggle dans `activeTags` (multi-select)
4. Logique de filtrage : **OR** — un projet est affiche s'il a au moins un des tags actifs
5. Bouton "All" : reset `activeTags = []`
6. Etat actif visible via `data-active="true"` + style CSS

Implementation : `js/main.js` → `buildFilterBar()` + `getFilteredProjects()`.

---

## 8. Responsive

### Breakpoints

- `> 800px` : 2 colonnes (PDP), 4 colonnes (skills), grille flex
- `768px - 800px` : stats wrap, skills 2 colonnes
- `< 768px` : 1 colonne partout, sidebar admin en haut
- `< 480px` : 1 colonne skills, hero CTA stack

### Mobile

- `viewport` meta sur toutes les pages
- Nav-links wrap en dessous du header
- `.pdp-content` → 1 colonne (sidebar remontée)
- `.pdp-gallery` → 1 colonne

---

## 9. Accessibilite

- `lang="en"` (ou `fr` pour admin) sur `<html>`
- Labels `<label>` sur tous les inputs
- `alt` sur les images
- Liens externes : `rel="noopener noreferrer"`
- Loading screen `aria-hidden` a ajouter (TODO)
- `prefers-reduced-motion` a respecter (TODO)

---

## 10. Deploiement

1. Creer un projet Firebase + activer Firestore + Auth (Email/Password)
2. `cp js/config.example.js js/config.js` + remplir
3. `firebase init hosting` (depuis la racine)
4. Configurer `firebase.json` :
   ```json
   {
     "hosting": {
       "public": ".",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**", "test-*.js", "test-*.html"]
     }
   }
   ```
5. Deployer les rules : `firebase deploy --only firestore:rules`
6. `firebase deploy --only hosting`

---

## 11. Maintenance

### Commandes utiles

```bash
# Valider la syntaxe JS
node --check js/*.js

# Smoke tests
node test-utils.js
node test-profile.js
node test-filter.js

# Tester la compression image (ouvrir dans browser)
# http://localhost:8000/test-image-compress.html

# Servir en local
node test-server.js
```

### TODOs (priorite basse)

- [ ] Ajouter `firestore.rules` au repo
- [ ] Ajouter og:* / SEO meta
- [ ] Ajouter `aria-hidden` sur loading screen
- [ ] Respecter `prefers-reduced-motion`
- [ ] Migrer les images locales en WebP/AVIF
- [ ] Internationalisation FR/EN
