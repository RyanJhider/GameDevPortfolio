# Rework du style — Portfolio Hezaerd

## Objectif

Refaire le style visuel du portfolio (couleurs, typographie, espacements, composants) pour gagner en clarté UX et en cohérence, **sans modifier la structure du code, le routing, les données, ni la logique métier**. C'est un rework CSS/design system, pas une réécriture fonctionnelle.

Le site est **multi-pages** (pas one-page) : le rework doit assurer une cohérence visuelle et une clarté de navigation à travers toutes les pages.

## Contraintes strictes

- Ne pas toucher aux fichiers de logique (fetch de données, hooks, routing Next.js, API routes).
- Ne pas renommer/déplacer de composants ni changer leur arborescence de props.
- Modifier uniquement : classes CSS/Tailwind, variables de design (couleurs, radius, shadows), fichiers de style dédiés, et éventuellement le markup purement structurel (wrapper divs) si besoin pour la mise en page — jamais le contenu ou les données.
- Une page = une intention claire. Si une page a plusieurs responsabilités visuelles, clarifier via hiérarchie typographique plutôt qu'en ajoutant de la logique.

## 1. Design tokens à définir en premier (source de vérité)

- **Palette** : 1 fond principal, 1 fond secondaire (cards/sections), 1 accent, 1 couleur de texte primaire, 1 secondaire (muted), + variantes dark/light si déjà en place.
- **Typographie** : une échelle claire (ex. 12/14/16/20/28/40px), une police pour le corps, une monospace réservée aux éléments techniques (tags, code, raccourcis).
- **Espacements** : une échelle cohérente (4/8/12/16/24/32/48/64) appliquée partout, plus de valeurs magiques éparpillées.
- **Radius/ombres** : 1-2 valeurs de radius max, ombres subtiles et cohérentes entre cards.

## 2. Clarté UX à viser (multi-pages)

- **Navigation persistante** : header identique sur toutes les pages, avec état actif visible sur la page courante (soulignement, couleur, ou fond).
- **En-tête de page cohérent** : chaque page a un titre clair + éventuellement un fil d'Ariane ou une sous-nav si la page a des sous-sections.
- **Hiérarchie visuelle uniforme** : mêmes styles de titres (h1/h2/h3) sur toutes les pages, pas de réinvention page par page.
- **États interactifs cohérents** : hover/focus/active identiques sur tous les boutons, liens, cards du site (pas juste sur la page projets).
- **Feedback de chargement** : si une page a du contenu dynamique (stats GitHub, etc.), prévoir un état de chargement/skeleton cohérent avec le design global.
- **Continuité entre pages** : transitions douces, pas de "saut" visuel brutal (mêmes marges de conteneur, même largeur max de contenu partout).

## 3. Par type de composant existant, sans changer son rôle

- **Cards de projets** : uniformiser padding, ratio image, style des badges, comportement hover (garder la vidéo au survol si elle existe déjà, juste styliser l'overlay/transition).
- **Timeline expérience/éducation** : aligner avec la même grille d'espacement que le reste du site.
- **Dashboard GitHub stats** : rendre les chiffres/graphiques visuellement cohérents avec la palette globale (actuellement souvent un style "widget" à part — l'intégrer visuellement).
- **Boutons/CTA** : un seul style primaire, un seul style secondaire, réutilisés partout.

## 4. Méthode de travail recommandée pour l'IA

1. Auditer les fichiers de style actuels et lister les incohérences (couleurs codées en dur, espacements irréguliers, styles de boutons différents selon les pages).
2. Proposer le design system (tokens) avant de toucher aux composants.
3. Appliquer page par page, en commençant par les composants partagés (header, footer, boutons, cards) puisque ce sont ceux qui ont le plus d'impact transverse.
4. Vérifier après chaque page que rien de fonctionnel n'a changé (mêmes props, mêmes data, mêmes routes).
