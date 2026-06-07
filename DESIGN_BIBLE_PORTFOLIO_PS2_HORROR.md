# ☠️ DESIGN BIBLE — PORTFOLIO PS2 HORROR
### Document de référence complet pour la conception d'un portfolio créatif
*Rédigé pour être utilisé comme contexte complet par une IA de génération de code*

---

## TABLE DES MATIÈRES

1. [Vision & Identité Conceptuelle](#vision)
2. [L'Esthétique PS2 Horror — Définition Précise](#esthétique-ps2-horror)
3. [Système de Couleurs](#couleurs)
4. [Typographie](#typographie)
5. [UI Diégétique — Principes & Application Web](#diégétique)
6. [Juicyness & Animations](#animations)
7. [Layout & Composition](#layout)
8. [Structure du Portfolio](#structure)
9. [Lisibilité & Accessibilité](#lisibilité)
10. [Anti-Patterns à Éviter](#antipatterns)
11. [Checklist Technique](#checklist)

---

## 1. VISION & IDENTITÉ CONCEPTUELLE {#vision}

### Le concept central

Ce portfolio doit fonctionner comme **un artefact découvert**, pas comme une page web visitée. L'utilisateur ne "navigue pas sur un site" — il explore quelque chose qui semble avoir existé avant lui. Comme trouver une vieille cassette VHS dans un appartement abandonné, ou allumer une PlayStation 2 dans une maison vide à 3h du matin.

L'objectif est de provoquer une réaction émotionnelle immédiate : **fascination inconfortable, nostalgie perturbée, curiosité morbide.**

### Ce que ce portfolio N'est PAS

- Un portfolio minimaliste blanc avec des cartes grises et une font Inter ❌
- Un portfolio "dark mode" générique avec du violet et du néon ❌
- Un portfolio "AI-made" avec des sections parfaitement symétriques ❌
- Un portfolio qui essaie d'imiter Awwwards ❌

### Ce qu'il EST

- Un objet visuel avec une **cohérence de monde** propre ✅
- Un site qui raconte une histoire même sans texte ✅
- Un endroit où chaque interaction **répond** de façon vivante ✅
- Une expérience qu'on mémorise parce qu'elle crée un **affect** ✅

---

## 2. L'ESTHÉTIQUE PS2 HORROR — DÉFINITION PRÉCISE {#esthétique-ps2-horror}

### Qu'est-ce que le "PS2 Horror" visuellement ?

L'ère PS2 (2000–2006) pour les jeux d'horreur (Silent Hill 2, Fatal Frame, Forbidden Siren, Haunting Ground) se caractérise par :

#### A — La Texture de l'Image

- **Grain de film VHS/CRT** : le rendu PS2 était affiché sur des télés cathodiques à 480i. Cela créait un flou naturel, une légère vibration, un scanline effect. Le grain n'était pas un bug, c'était une nappe de texture sur toute l'image qui la rendait **organique, respirante, impure.**
- **Dithering & aliasing** : les bords n'étaient jamais parfaitement nets. Les polygones se découpaient avec des escaliers de pixels.
- **Compression artefact** : les textures basse résolution, les JPEG artifactueux appliqués sur des surfaces 3D créaient un effet de "matière qui transpire."

**En CSS/web, on simule ça avec :**
```css
/* Grain de film */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
  opacity: 0.04;
  pointer-events: none;
  z-index: 9999;
  animation: grain 0.5s steps(1) infinite;
}

/* Scanlines subtils */
body::after {
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
}
```

#### B — Le Brouillard comme Design

Dans Silent Hill, le brouillard n'était pas un choix artistique pur — c'était une contrainte technique (limiter le draw distance). Mais les développeurs l'ont **transformé en langage visuel**. Le brouillard :
- Cache ce qui vient
- Crée une profondeur illimitée avec peu de moyens
- Force l'attention sur l'immédiat

**Traduit en web :** utiliser des fondus, des blurs graduels, des overlays semi-transparents pour que **les éléments lointains (en bas de page, en arrière-plan) soient flous ou voilés**. L'information se révèle quand on s'approche (scroll, hover).

```css
/* Effet fog sur sections éloignées */
.section-distant {
  filter: blur(1px);
  opacity: 0.7;
  transition: filter 0.8s ease, opacity 0.8s ease;
}
.section-distant.in-view {
  filter: blur(0);
  opacity: 1;
}
```

#### C — La Palette de Couleur PS2 Horror

Le PS2 horror a une couleur principale : **le gris verdâtre humide**. Pas le gris neutre propre, le gris qui ressemble à de l'eau stagnante, aux murs de sous-sols moisis, au métal rouillé.

Les couleurs caractéristiques de l'esthétique (Silent Hill 2, Fatal Frame) :

| Rôle | Description | Hex approximatif |
|------|-------------|-----------------|
| Background primaire | Noir profond, presque marron | `#0d0b0a` |
| Background secondaire | Gris ardoise humide | `#1a1a18` |
| Surface/Card | Vert mousse désaturé sombre | `#1e2318` |
| Fog overlay | Gris-beige transparent | `#c8bfb0` à ~8% |
| Texte principal | Blanc cassé, légèrement jaunâtre | `#e8e0d0` |
| Texte secondaire | Gris bleuté pâle | `#8a9499` |
| Accent choc | Rouge sang, rare et précis | `#8b1a1a` |
| Accent électrique | Vert phosphorescent (écrans CRT) | `#4aff6e` |
| Accent froid | Bleu acier froid | `#2a4a5e` |
| Rouille/Warning | Brun-orange oxydé | `#7a4a2a` |

**La règle d'or des couleurs :** 80% dans les tons désaturés/sombres, 15% en touches neutres, **5% en couleur vive qui claque**. La rareté de la couleur intense lui donne sa force — exactement comme le rouge du casque de Pyramid Head sur fond de gris.

#### D — Les Textures de Matière

Les surfaces du PS2 Horror ne sont jamais lisses. Elles ont :
- De la **rouille** (overlay orangé bruité sur métaux)
- De la **moisissure** (pattern organique irrégulier)
- Du **béton fendu** (texture craquelée)
- De **l'eau** (reflets déformés, taches d'humidité)

En CSS, utiliser `background-blend-mode`, `mix-blend-mode`, des SVG filters (`feTurbulence`, `feDisplacementMap`) pour ajouter de l'organicité aux surfaces.

---

## 3. SYSTÈME DE COULEURS {#couleurs}

### Palette principale complète

```css
:root {
  /* === BACKGROUNDS === */
  --bg-void: #0a0908;          /* Le néant, fond le plus profond */
  --bg-primary: #111210;       /* Background de base */
  --bg-surface: #1c1e1a;       /* Cards, panels */
  --bg-elevated: #242621;      /* Éléments au-dessus */
  --bg-fog: rgba(180,170,155,0.06); /* Overlay fog */

  /* === TEXTES === */
  --text-primary: #e2d8c8;     /* Texte principal lisible */
  --text-secondary: #9a9e95;   /* Texte secondaire */
  --text-muted: #5a5d56;       /* Texte discret */
  --text-ghost: #3a3d36;       /* À peine visible */

  /* === ACCENTS (utiliser avec parcimonie) === */
  --accent-blood: #7a1515;     /* Rouge sang — danger, highlights importants */
  --accent-blood-bright: #c02020; /* Rouge vif — hover states */
  --accent-phosphor: #3dff5e;  /* Vert CRT — données, code, status actif */
  --accent-phosphor-dim: #1a7a30; /* Vert dim */
  --accent-steel: #1e3a4a;     /* Bleu acier — infos froides */
  --accent-rust: #6b3a1a;      /* Rouille — warnings, anciens éléments */
  --accent-pale: #b8c4cc;      /* Blanc bleuté — fantôme, négatif */

  /* === BORDERS & SÉPARATEURS === */
  --border-subtle: rgba(200,190,170,0.08);
  --border-medium: rgba(200,190,170,0.15);
  --border-strong: rgba(200,190,170,0.30);
  --border-accent: rgba(122,21,21,0.5);   /* Rouge sang transparent */

  /* === EFFETS === */
  --glow-blood: 0 0 20px rgba(122,21,21,0.4);
  --glow-phosphor: 0 0 15px rgba(61,255,94,0.3);
  --shadow-deep: 0 8px 32px rgba(0,0,0,0.8);
  --shadow-card: 0 4px 16px rgba(0,0,0,0.6);
}
```

### Comment utiliser les couleurs de façon intelligente

**Hiérarchie visuelle par couleur :**

1. **Fond** → Toujours dans les `--bg-*`. Jamais de fond coloré.
2. **Texte corps** → `--text-primary` pour tout ce qui doit être lu facilement.
3. **Texte d'ambiance** → `--text-secondary` ou `--text-muted` pour les métadonnées, labels.
4. **Éléments actifs/CTA** → Une seule couleur d'accent, pas un mélange. Choisir sang ou phosphor selon l'émotion souhaitée.
5. **Hover states** → Passer à la version `bright` de l'accent, ajouter le `glow` correspondant.
6. **Moments dramatiques** → Les accents vifs ne doivent apparaître qu'à des moments clés (CTA principal, titre hero, élément sélectionné). Maximum 3–5% de surface colorée.

**Règle de contraste pour la lisibilité :**

- Ratio de contraste minimum : **4.5:1** pour le corps de texte (WCAG AA)
- `--text-primary` (#e2d8c8) sur `--bg-primary` (#111210) = ratio ~11:1 ✅
- `--text-secondary` (#9a9e95) sur `--bg-primary` = ratio ~6:1 ✅
- Ne jamais mettre du texte `--text-muted` sur `--bg-surface` pour du contenu informatif

---

## 4. TYPOGRAPHIE {#typographie}

### Philosophie typographique

La typo dans le PS2 Horror n'est pas belle — elle est **étrange, un peu abîmée, fonctionnelle mais dérangeante.** Penser aux menus de Silent Hill : police simple, légèrement décentrée, espacement bizarre.

### Stack de polices recommandé

```css
/* TITRES DISPLAY — Impact, étrangeté */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
/* Ou : Oswald condensed, Share Tech Mono, VT323 (pixel), Syne */

/* CORPS DE TEXTE — Lisible mais pas générique */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&display=swap');
/* Ou : DM Mono, IBM Plex Mono (pour l'effet terminal), Epilogue */

/* ACCENT / CODE / DONNÉES */
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
/* Effet phosphorescent d'écran de terminal */
```

**Suggestion de paires :**

- **Option A (Brutal)** : `Bebas Neue` pour les titres + `DM Mono` pour le corps
- **Option B (Terminal)** : `VT323` pour les titres display + `IBM Plex Mono` pour le corps
- **Option C (Équilibré)** : `Syne` (bold) pour les titres + `Space Grotesk` pour le corps

### Règles typographiques

```css
/* Titres principaux */
h1 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(4rem, 12vw, 10rem);
  letter-spacing: 0.05em;
  line-height: 0.9;
  color: var(--text-primary);
  text-transform: uppercase;
}

/* Effet "légèrement abîmé" sur certains titres */
.title-damaged {
  text-shadow: 
    2px 0 0 rgba(122,21,21,0.3),   /* décalage rouge */
    -1px 0 0 rgba(61,255,94,0.2);  /* décalage vert */
}

/* Corps de texte */
body {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-primary);
}

/* Labels / métadonnées */
.label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent-phosphor);
}
```

### Effet Glitch Typographique (à utiliser avec parcimonie)

```css
@keyframes glitch-text {
  0%   { clip-path: inset(0 0 95% 0); transform: skew(-2deg); }
  10%  { clip-path: inset(20% 0 60% 0); transform: skew(1deg); }
  20%  { clip-path: inset(50% 0 30% 0); transform: skew(-3deg); }
  30%  { clip-path: inset(0 0 95% 0); transform: skew(0); }
  100% { clip-path: inset(0 0 95% 0); transform: skew(0); }
}

.glitch-title::before,
.glitch-title::after {
  content: attr(data-text);
  position: absolute;
  top: 0; left: 0;
  width: 100%;
}
.glitch-title::before {
  color: var(--accent-blood);
  animation: glitch-text 4s infinite linear;
  animation-delay: 0s;
}
.glitch-title::after {
  color: var(--accent-phosphor);
  animation: glitch-text 4s infinite linear;
  animation-delay: 0.1s;
}
```

**Usage du glitch :** Maximum 1 élément par vue. Uniquement sur le titre hero ou un élément d'accent. Le glitch permanent fatigue l'œil — le déclencher on hover ou de façon occasionnelle (toutes les 6–8 secondes).

---

## 5. UI DIÉGÉTIQUE — PRINCIPES & APPLICATION WEB {#diégétique}

### Qu'est-ce que le diégétique ?

Dans les jeux vidéo, un élément est **diégétique** s'il existe à la fois dans l'interface ET dans l'univers narratif — les personnages en sont conscients. Dans Dead Space, la barre de vie est physiquement attachée au dos du personnage. Dans Metro 2033, le personnage tient vraiment une carte papier chiffonnée.

**L'opposé** (non-diégétique) : les barres de vie flottant dans un coin de l'écran que seul le joueur voit.

### Application diégétique dans un portfolio web

**L'idée centrale :** Le portfolio ne doit pas se présenter comme "une interface web" mais comme **un objet concret qui existe dans un univers.** Chaque élément d'UI doit avoir une justification dans la fiction du site.

#### Exemples de traductions diégétiques pour un portfolio :

| Élément classique | Version diégétique PS2 Horror |
|-------------------|-------------------------------|
| Barre de navigation | Panneau de contrôle métallique vissé en haut, avec des voyants qui s'allument |
| Section "À propos" | Un dossier de police froissé, avec photos et notes manuscrites |
| Portfolio / Grille de projets | Un tableau de liège avec des punaises, des fils rouges, des post-its |
| Formulaire de contact | Une vieille fiche de rapport à remplir, tampon administratif |
| Loading state | Écran de démarrage PS2 avec barre de progression et bruit électronique |
| Bouton CTA | Un interrupteur physique ou un bouton industriel à enfoncer |
| Status / Tags | Des étiquettes autocollantes décollées aux coins |
| Séparateurs de sections | Des traces, des fissures dans du béton, du ruban adhésif |
| Dates | Horodatages de type terminal `[2024-03-15 / 03:47:22]` |
| Catégories de projets | Des cassettes VHS étiquetées à la main |

#### Règles du diégétique appliqué

**Règle 1 — La cohérence de monde :** Si vous décidez que la navigation est un panneau de contrôle industriel, TOUS les éléments de navigation doivent s'inscrire dans cette logique. Pas de mélange avec un menu hamburger générique.

**Règle 2 — L'information reste lisible :** Une interface diégétique belle mais incompréhensible est une interface ratée. Un dossier de police diégétique doit quand même avoir des sections clairement identifiables. Le diégétique est une **habillage narratif**, pas un déguisement de l'information.

**Règle 3 — Le personnage est conscient de l'interface :** Dans l'univers de ce portfolio, "quelqu'un" utilise ces outils. Les hover states peuvent simuler une main qui touche quelque chose (cursor personnalisé, légère déformation au survol).

**Règle 4 — Pas tout diégétique :** Même Dead Space, maître du diégétique, gardait des éléments non-diégétiques pour des raisons d'accessibilité. Limiter le diégétique fort à 3–4 éléments clés. Le reste peut être influencé par l'esthétique sans être pleinement diégétique.

#### Implémentation : Curseur personnalisé

```css
/* Curseur custom — croix de visée style survival horror */
* { cursor: none; }

.custom-cursor {
  width: 20px;
  height: 20px;
  border: 1px solid var(--accent-phosphor);
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 99999;
  transition: transform 0.15s ease, border-color 0.2s;
  /* Ligne centrale horizontale */
}
.custom-cursor::before, .custom-cursor::after {
  content: '';
  position: absolute;
  background: var(--accent-phosphor);
}
/* Sur les éléments cliquables */
a:hover ~ .custom-cursor,
button:hover ~ .custom-cursor {
  transform: scale(2.5);
  border-color: var(--accent-blood);
  background: rgba(122,21,21,0.1);
}
```

#### Implémentation : Navigation diégétique (panneau de contrôle)

```html
<nav class="control-panel">
  <div class="panel-label">SYS://NAV_PANEL — UNIT_04</div>
  <ul class="panel-links">
    <li>
      <span class="indicator" aria-hidden="true"></span>
      <a href="#work">TRAVAUX</a>
    </li>
    <li>
      <span class="indicator" aria-hidden="true"></span>
      <a href="#about">PROFIL</a>
    </li>
    <li>
      <span class="indicator" aria-hidden="true"></span>
      <a href="#contact">SIGNAL</a>
    </li>
  </ul>
</nav>
```

```css
.control-panel {
  font-family: 'Share Tech Mono', monospace;
  border: 1px solid var(--border-medium);
  background: var(--bg-surface);
  padding: 0.5rem 1rem;
  /* Légère texture métallique */
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255,255,255,0.01) 10px,
    rgba(255,255,255,0.01) 11px
  );
}
.panel-label {
  font-size: 0.6rem;
  color: var(--text-muted);
  letter-spacing: 0.2em;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.3rem;
  margin-bottom: 0.5rem;
}
.indicator {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--text-ghost);
  margin-right: 0.5rem;
  transition: background 0.3s, box-shadow 0.3s;
}
.panel-links li:hover .indicator {
  background: var(--accent-phosphor);
  box-shadow: var(--glow-phosphor);
}
```

---

## 6. JUICYNESS & ANIMATIONS {#animations}

### Qu'est-ce que la Juicyness ?

Le terme vient du game design (GDC 2012, Petri Purho "Juice it or Lose It"). Un jeu est **"juicy"** quand chaque interaction produit **plus de feedback que nécessaire** — de façon délicieuse et satisfaisante.

**Exemples de juicyness dans les jeux :**
- Un ennemi qui meure explose en particules et en son
- Un bouton qui rebondit légèrement quand on appuie dessus
- Un score qui incrémente chiffre par chiffre avec une vibration
- L'herbe qui s'incline au passage du personnage

**Traduit en web :** chaque élément interactif doit répondre de manière **vivante, un peu excessive, satisfaisante.** Pas juste un changement de couleur — une transformation avec squash/stretch, glow, particules légères, son (optionnel).

### Les 6 Layers du Juicy Feedback

Pour chaque interaction importante (clic de bouton, ouverture de projet, envoi de formulaire), viser plusieurs layers simultanés :

**Layer 1 — Forme :** l'élément change légèrement de shape (squash/stretch)
**Layer 2 — Couleur :** l'élément change de couleur / luminosité
**Layer 3 — Luminosité :** un glow/halo apparaît
**Layer 4 — Mouvement secondaire :** les éléments autour réagissent
**Layer 5 — Particules :** de petits éléments émergent
**Layer 6 — Typographie :** le texte de l'élément réagit (shake, scale)

Pour un portfolio, viser systématiquement 3–4 layers simultanés.

### Timing & Easing — Les règles

```css
/* Easing PS2 Horror = pas trop fluide, légèrement saccadé */
:root {
  --ease-snap: cubic-bezier(0.25, 0, 0, 1);      /* Accélération puis stop net */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Légère overshoot */
  --ease-horror: cubic-bezier(0.4, 0, 1, 1);     /* Lent puis brusque */
  --ease-glitch: steps(4, end);                   /* Saccadé façon pixel */
}
```

**Durées recommandées :**
- Micro-interactions (hover simple) : **150–200ms**
- Transitions de composants : **250–350ms**
- Animations d'entrée de section : **400–600ms**
- Transitions de page : **600–900ms**
- Effets atmosphériques (grain, fog pulse) : **2000–8000ms**

**Règle des animations :** `animation-duration` < 300ms = snappy, satisfaisant. > 800ms = atmosphérique, contemplatif. Éviter la zone 300–800ms sans raison — c'est là que les animations semblent "lentes sans être intentionnelles".

### Hover States Juicy sur Boutons

```css
.btn-primary {
  position: relative;
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  padding: 0.75rem 2rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: none;
  transition: 
    transform 150ms var(--ease-bounce),
    box-shadow 200ms ease,
    border-color 200ms ease;
  overflow: hidden;
}

/* Pseudo-element pour le fill qui monte */
.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-blood);
  transform: translateY(100%);
  transition: transform 250ms var(--ease-snap);
}

.btn-primary:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--glow-blood), var(--shadow-deep);
  border-color: var(--accent-blood);
  color: var(--text-primary);
}

.btn-primary:hover::before {
  transform: translateY(0);
}

.btn-primary:active {
  transform: translateY(1px) scale(0.98); /* Squash au clic */
  transition-duration: 80ms;
}

/* Texte au-dessus du pseudo-element */
.btn-primary span {
  position: relative;
  z-index: 1;
}
```

### Animation d'Entrée des Sections (Scroll-triggered)

```javascript
// Utiliser IntersectionObserver
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      // Stagger les enfants
      entry.target.querySelectorAll('.stagger-child').forEach((el, i) => {
        el.style.animationDelay = `${i * 80}ms`;
        el.classList.add('stagger-in');
      });
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.section-reveal').forEach(el => observer.observe(el));
```

```css
.section-reveal {
  opacity: 0;
  transform: translateY(30px);
  filter: blur(4px);
}
.section-reveal.revealed {
  animation: reveal-in 600ms var(--ease-snap) forwards;
}
@keyframes reveal-in {
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* Stagger children */
.stagger-child {
  opacity: 0;
  transform: translateY(15px);
}
.stagger-child.stagger-in {
  animation: stagger-up 400ms var(--ease-bounce) forwards;
}
@keyframes stagger-up {
  to { opacity: 1; transform: translateY(0); }
}
```

### Effet "Static" / Glitch Atmosphérique

```css
/* Apparition des éléments avec un flash de static */
@keyframes static-reveal {
  0%   { opacity: 0; filter: brightness(3) contrast(0) blur(6px); }
  10%  { opacity: 1; filter: brightness(2) contrast(2) blur(2px); transform: translateX(-3px); }
  20%  { filter: brightness(1) contrast(1) blur(0); transform: translateX(2px); }
  30%  { transform: translateX(0); filter: brightness(1.1); }
  100% { opacity: 1; filter: brightness(1); transform: translateX(0); }
}

.static-entrance {
  animation: static-reveal 0.5s var(--ease-horror) forwards;
}
```

### Particules de Sang (Pour un CTA spécial)

```javascript
// Mini particle system pour les clics sur éléments importants
function spawnParticles(x, y, color = '#7a1515') {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
    `;
    document.body.appendChild(particle);
    
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
    const speed = Math.random() * 80 + 40;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 60;
    
    let startTime = null;
    function animate(time) {
      if (!startTime) startTime = time;
      const elapsed = (time - startTime) / 1000;
      particle.style.left = (x + vx * elapsed) + 'px';
      particle.style.top = (y + vy * elapsed + 120 * elapsed * elapsed) + 'px';
      particle.style.opacity = Math.max(0, 1 - elapsed * 2);
      if (elapsed < 0.5) requestAnimationFrame(animate);
      else particle.remove();
    }
    requestAnimationFrame(animate);
  }
}

// Déclencher sur les CTAs importants
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', (e) => {
    spawnParticles(e.clientX, e.clientY, '#c02020');
  });
});
```

### Grain de Film Animé

```javascript
// Grain de film généré canvas, plus performant qu'une image
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.style.cssText = `
  position: fixed; inset: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 9998; opacity: 0.035;
  mix-blend-mode: screen;
`;
document.body.appendChild(canvas);

function generateGrain() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.random() * 255;
    imageData.data[i] = value;
    imageData.data[i+1] = value;
    imageData.data[i+2] = value;
    imageData.data[i+3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

// Régénérer le grain à 8fps pour effet VHS
setInterval(generateGrain, 125);
window.addEventListener('resize', generateGrain);
generateGrain();
```

---

## 7. LAYOUT & COMPOSITION {#layout}

### Philosophie de composition

Oublier les grilles symétriques parfaites. Le PS2 Horror a une composition **légèrement déséquilibrée, comme si quelqu'un avait disposé des objets sans règle**, mais avec une intention. Penser à un bureau de détective, un tableau d'enquête, un casier d'hôpital.

### Principes de disposition

**1. Asymétrie intentionnelle**
Les sections ne s'alignent pas toujours sur la même grille. Certains éléments débordent (negative overflow), d'autres sont décalés.

**2. Layers & Profondeur**
Utiliser `position: absolute` et des z-index différents pour créer des superpositions. Un titre peut être en partie caché par un élément "posé devant".

**3. Espacement irrégulier**
Pas toujours `margin: 0 auto`. Alterner entre pleine largeur, décalage gauche, centré, décalage droit.

**4. Tension visuelle**
Certains éléments semblent "vouloir sortir du cadre" (texte qui coupe, image dont on voit juste un bord).

### Grid System Recommandé

```css
.container {
  display: grid;
  grid-template-columns: 
    [edge-left] 1fr 
    [content-start] 20px 
    repeat(10, 1fr) 
    20px 
    [content-end] 1fr 
    [edge-right];
  gap: 0 1.5rem;
}

/* Élément normal */
.col-normal { grid-column: content-start / content-end; }

/* Élément décalé gauche */
.col-offset-left { grid-column: edge-left / col 8; }

/* Élément pleine largeur */
.col-full { grid-column: edge-left / edge-right; }

/* Élément qui déborde sur la droite */
.col-bleed-right { grid-column: col 4 / edge-right; }
```

### Layout de la page Hero

```
┌─────────────────────────────────────────────────────┐
│ [PANNEAU NAV DIÉGÉTIQUE]                            │
│ SYS://NAV — ● TRAVAUX  ● PROFIL  ● SIGNAL          │
├─────────────────────────────────────────────────────┤
│                                                      │
│                    [GRAIN OVERLAY]                   │
│                                                      │
│   NOM/                              [IMAGE FLOUTÉE  │
│   PRÉNOM                             en arrière-    │
│   ━━━━━━━━━━━━━━━━━                  plan, légère   │
│                                      opacity 30%]   │
│   DESIGNER /                                        │
│   DÉVELOPPEUR                                       │
│                                                      │
│   [LABEL VERT] SYS://PROFIL_CHARGÉ                  │
│                                                      │
│   [BTN] ▶ ACCÉDER AUX TRAVAUX                       │
│                                                      │
│                          [SCROLL INDICATOR]          │
│                          ↓ 042 ENTRÉES              │
└─────────────────────────────────────────────────────┘
```

### Layout des Cards de Projets

Éviter la grille 3×N parfaite. Proposer :

**Option A — Masonry irrégulier :**
```css
.projects-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: 80px;
  gap: 1rem;
}
/* Chaque carte a une taille différente */
.project-card:nth-child(1) { grid-column: span 7; grid-row: span 5; }
.project-card:nth-child(2) { grid-column: span 5; grid-row: span 3; }
.project-card:nth-child(3) { grid-column: span 5; grid-row: span 4; }
.project-card:nth-child(4) { grid-column: span 12; grid-row: span 3; } /* Large */
```

**Option B — Tableau d'enquête (diégétique fort) :**
Les projets sont représentés comme des photos épinglées sur un tableau de liège, avec des fils colorés les reliant par catégorie, des post-its annotés, des angles légèrement différents pour chaque élément.

**Option C — Liste de fichiers :**
Chaque projet est une ligne de tableau (style explorateur de fichiers), avec colonnes : `[TITRE] [CATEGORIE] [ANNÉE] [STATUS] [TAILLE_FICHIER_FICTIF]`. Hover révèle une preview.

### Cards de Projet — Anatomie

```css
.project-card {
  position: relative;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  
  /* Légère rotation aléatoire sur certaines */
  /* transform: rotate(var(--card-tilt, 0deg)); */
}

/* Overlay diégétique : étiquette de fichier */
.project-card::before {
  content: attr(data-index) " / " attr(data-year);
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  z-index: 2;
}

/* Corner accent */
.project-card::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 24px 24px 0;
  border-color: transparent var(--accent-blood) transparent transparent;
  transition: border-width 200ms var(--ease-bounce);
}
.project-card:hover::after {
  border-width: 0 32px 32px 0;
}

/* Image avec effet CRT au hover */
.project-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.7) contrast(1.1);
  transition: filter 300ms ease, transform 400ms var(--ease-snap);
}
.project-card:hover img {
  filter: saturate(1) contrast(1.2);
  transform: scale(1.03);
}

/* Overlay info qui monte au hover */
.card-info {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(10,9,8,0.95) 60%, transparent);
  padding: 2rem 1rem 1rem;
  transform: translateY(60%);
  transition: transform 300ms var(--ease-snap);
}
.project-card:hover .card-info {
  transform: translateY(0);
}
```

---

## 8. STRUCTURE DU PORTFOLIO {#structure}

### Sections recommandées et leur traitement diégétique

#### Section 1 — HERO / BOOT SCREEN

**Concept diégétique :** Simuler le démarrage d'un système. L'écran s'allume progressivement. Du texte de "boot" défile. Puis le nom apparaît.

```
> INITIALIZING SYSTEM...
> LOADING PROFILE DATA... [████████░░] 80%
> DECRYPTING WORK FILES... OK
> WARNING: 14 UNREAD MESSAGES
> PRESS ANY KEY TO CONTINUE_
```

Durée de l'animation : 2–3 secondes maximum. Ajouter un bouton "Skip" accessible.

#### Section 2 — TRAVAUX / PROJETS

**Concept diégétique :** Dossiers classifiés, tableaux d'enquête, ou terminal de fichiers.

Pour chaque projet, les métadonnées à afficher :
- Titre du projet
- Client / Contexte
- Rôle exercé
- Année
- Technologies (tags en style `[UNITY]` `[FIGMA]` `[REACT]`)
- Un "STATUS" fictif : `ARCHIVÉ` / `EN COURS` / `CLASSIFIÉ`

#### Section 3 — PROFIL / À PROPOS

**Concept diégétique :** Un dossier de personnel, avec photo (légèrement dégradée), données biographiques en style formulaire administratif.

```
┌──────────────────────────────────────────┐
│  DOSSIER PERSONNEL — [Tampon: CONFID.]   │
│  ─────────────────────────────────────── │
│  NOM ..............: [Prénom Nom]         │
│  SPÉCIALITÉ .......: Design / Dev        │
│  STATUT ...........: DISPONIBLE          │
│  ANNÉES D'EXP .....: 0X ANS             │
│  LOCALISATION .....: [Ville]             │
│  ─────────────────────────────────────── │
│  COMPÉTENCES :                           │
│  ┌──────────┬──────────┬──────────┐     │
│  │ DESIGN   │ DEV      │ MOTION   │     │
│  │ ████████ │ ██████░░ │ █████░░░ │     │
│  └──────────┴──────────┴──────────┘     │
└──────────────────────────────────────────┘
```

#### Section 4 — CONTACT / SIGNAL

**Concept diégétique :** Formulaire de transmission radio, ou terminal de messagerie cryptée.

```
> INITIER TRANSMISSION
> DESTINATAIRE : [votre@email.com]
> FREQUENCE : [OUVERTE]
> SÉCURITÉ : [CHIFFRÉE]
>
> MESSAGE :
> _
```

Bouton d'envoi : "ENVOYER LE SIGNAL" avec animation d'onde radio au clic.

---

## 9. LISIBILITÉ & ACCESSIBILITÉ {#lisibilité}

Cette section est NON NÉGOCIABLE. L'esthétique ne doit jamais compromettre la lisibilité.

### Règles de lisibilité absolues

**1. Jamais de texte coloré sur fond coloré**
```css
/* ❌ INTERDIT */
.bad { color: var(--accent-phosphor); background: var(--bg-surface); }
/* Le vert sur fond sombre = ratio 3:1 seulement, insuffisant */

/* ✅ Correct pour le texte informatif */
.label-phosphor { 
  color: var(--accent-phosphor);
  /* Uniquement pour les PETITS labels décoratifs, pas le corps */
}
.body-text { color: var(--text-primary); /* Toujours pour le corps */ }
```

**2. Le grain n'affecte jamais la lisibilité du texte**
```css
/* Le grain est sur un layer au-dessus MAIS avec pointer-events: none 
   ET une opacité maximale de 0.05 pour ne jamais masquer le texte */
.grain-layer { opacity: 0.04; mix-blend-mode: screen; }
```

**3. Les images de fond n'interfèrent jamais avec le texte**
```css
/* Toujours avoir un overlay de sécurité entre image et texte */
.hero-with-bg-image {
  position: relative;
}
.hero-with-bg-image::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(10,9,8,0.85) 0%,
    rgba(10,9,8,0.6) 50%,
    rgba(10,9,8,0.3) 100%
  );
  z-index: 1;
}
.hero-with-bg-image > * { position: relative; z-index: 2; }
```

**4. Tailles de texte minimales**
- Corps de texte : minimum `16px` (1rem)
- Labels/métadonnées : minimum `12px` (0.75rem)
- Jamais en-dessous de `11px` pour du contenu informatif

**5. Contraste des états interactifs**
```css
/* Focus visible pour accessibilité clavier */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--accent-phosphor);
  outline-offset: 4px;
}
/* Ne jamais supprimer outline sans alternative */
```

**6. Le glitch ne dure jamais plus de 0.5 secondes sur du texte**
Les animations de texte longues (glitch en boucle permanente sur du contenu) sont illisibles. Le glitch est ponctuel, rare, dramatique.

### Tester la lisibilité

Avant de livrer, tester avec :
- **Chrome DevTools → Rendering → Emulate vision deficiency** (simule différentes daltonismes)
- **Lighthouse** → Accessibility score > 90
- Vérifier que chaque texte informatif a un ratio de contraste ≥ 4.5:1

---

## 10. ANTI-PATTERNS À ÉVITER {#antipatterns}

### Ce que font TOUS les portfolios IA — À fuir absolument

| À éviter | Pourquoi | Alternative |
|----------|----------|-------------|
| Hero avec gradient violet-rose | Ultra générique depuis 2022 | Fond noir texturé avec grain |
| Font "Inter" ou "Space Grotesk" seul | Trop courant | Bebas Neue, VT323, DM Mono |
| Cards carrées identiques en grille 3×3 | Aucune personnalité | Masonry irrégulier, tailles variées |
| Couleur d'accent unique "bleu ciel" | Chaque portfolio IA l'a | Sang / Phosphor / Rouille |
| Section "Skills" avec barres de progression rondes | Cliché UX 2019 | Format dossier, texte tabulaire |
| Animation de typing permanente | Fatiguant, vu partout | Typing uniquement au boot screen |
| Fond blanc ou gris très clair | Ne correspond pas à l'univers | Fond noir/ardoise profond |
| Boutons CTA en "pill shape" blanc/rose | Sans caractère | Bouton anguleux, style industriel |
| Effets parallax standard sur le hero | Tout le monde | Fog layer + reveal au scroll |

### Pièges du Thème Horror à éviter

| À éviter | Pourquoi |
|----------|----------|
| Trop de rouge partout | Le rouge perd son impact si omniprésent |
| Texte en rouge sur fond sombre | Mauvaise lisibilité, douloureux |
| Animations de glitch permanentes | Illisible et épileptique |
| Gore gratuit ou images choquantes | Pas professionnel, aliène des clients |
| Musique qui se lance automatiquement | UX catastrophique |
| Fonts illisibles (trop stylisées) | Sacrifier la lisibilité pour l'esthétique = échec |
| Fond avec image de sang / corps | Trop littéral, peu créatif |

**Règle d'or :** L'horreur PS2, c'est l'**inconfort subtil**, pas la violence explicite. C'est la sensation de quelque chose qui cloche, pas l'image de quelque chose qui choque.

---

## 11. CHECKLIST TECHNIQUE {#checklist}

### Performance

- [ ] Grain animé via Canvas JS (pas gif lourd)
- [ ] Images compressées, format WebP
- [ ] `will-change` uniquement sur les éléments animés (pas sur tout)
- [ ] `prefers-reduced-motion` respecté

```css
/* Toujours inclure */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] Polices chargées avec `font-display: swap`
- [ ] Lazy loading sur les images de projets
- [ ] Pas d'animations sur des propriétés coûteuses (width, height, top, left) — utiliser `transform` et `opacity`

### Animations

- [ ] Chaque animation a un `animation-fill-mode: forwards` si elle doit persister
- [ ] Les animations de scroll utilisent IntersectionObserver (pas scroll events)
- [ ] Les transitions ont des durées cohérentes avec la charte
- [ ] Le glitch n'est pas en boucle permanente sur du texte lisible
- [ ] Particules sont nettoyées du DOM après leur animation

### Accessibilité

- [ ] Ratio de contraste ≥ 4.5:1 pour tout texte informatif
- [ ] Navigation au clavier fonctionnelle (focus visible)
- [ ] Alt texts sur toutes les images
- [ ] ARIA labels sur les éléments diégétiques non-standard
- [ ] Le skip intro est accessible et fonctionnel
- [ ] Pas d'autoplay audio ou vidéo

### Cohérence UI

- [ ] CSS Variables utilisées partout (pas de couleurs en dur)
- [ ] Curseur custom désactivé sur mobile
- [ ] Grain overlay désactivé sur mobile (performance)
- [ ] Responsive vérifié aux breakpoints : 375px, 768px, 1024px, 1440px
- [ ] Les effets diégétiques restent compréhensibles sur mobile

### Responsive — Adaptations Mobile

Sur mobile, l'esthétique est maintenue mais simplifiée :
- Grain : réduire opacity de moitié
- Animations d'entrée : durées réduites de 30%
- Layout masonry : passer en colonne unique
- Navigation diégétique : version condensée ou drawer
- Les particules et effets lourds : désactivés

```css
@media (max-width: 768px) {
  .grain-layer { opacity: 0.02; }
  .custom-cursor { display: none; }
  * { cursor: auto; }
  
  /* Simplifier les animations */
  .section-reveal {
    transform: translateY(15px); /* Moins de mouvement */
  }
}
```

---

## RÉSUMÉ EXÉCUTIF — Ce que l'IA doit retenir

**1. L'esthétique centrale** est le PS2 Horror : gris verdâtre humide, grain de film, brouillard, accents de rouge sang rare, textures organiques. Pas de blanc, pas de violet, pas de rose.

**2. Le diégétique** signifie que chaque élément UI existe dans un univers cohérent. La navigation est un panneau de contrôle. Les projets sont des dossiers. Le contact est une transmission radio. Les éléments "savent qu'ils existent dans cet univers."

**3. La juicyness** signifie que chaque interaction produit plus de feedback que nécessaire : squash/stretch, glow, particules, secondary animation. Viser 3–4 layers de feedback simultanés sur les interactions importantes.

**4. La lisibilité est NON NÉGOCIABLE.** Le texte principal est toujours `#e2d8c8` sur fond sombre. Ratio minimum 4.5:1. Le grain, les glitches et les effets ne masquent jamais le contenu. L'art ne justifie pas l'illisibilité.

**5. La couleur est rare et précise.** 80% de tons neutres sombres, 15% de neutres intermédiaires, 5% de couleur vive. Le rouge sang n'apparaît que sur les éléments les plus importants. Cette rareté lui donne sa force.

**6. Ce portfolio doit provoquer une émotion,** pas juste "impressionner." L'utilisateur doit partir avec le sentiment d'avoir visité quelque chose d'unique et légèrement dérangeant, dans le bon sens.

---

*Document rédigé en avril 2026 pour usage comme contexte IA. Toutes les spécifications CSS sont fonctionnelles et peuvent être utilisées directement.*
