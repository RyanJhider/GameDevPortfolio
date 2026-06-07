# Portfolio ISART Digital - Game Design & Programming

## 1. Project Overview

**Project Name:** Portfolio Game Designer & Programmer  
**Type:** Static website (hostable on GitHub Pages)  
**Core Functionality:** Showcase student projects with easy add/remove capability via JSON data file  
**Target Users:** Recruiters, game studios, potential collaborators

---

## 2. UI/UX Specification

### Layout Structure

**Pages:**
1. **Home (index.html)** - Hero + featured projects + about preview
2. **Projects (projects.html)** - All projects gallery with filters
3. **Project Detail (project.html)** - Individual project view
4. **About (about.html)** - Student profile, skills, resume

**Sections per page:**
- **Header:** Fixed navigation with logo + nav links
- **Hero:** Full viewport intro with animated text
- **Projects Grid:** Responsive card layout
- **Footer:** Social links + copyright

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3-4 columns)

### Visual Design

**Color Palette:**
- Background Primary: `#0a0a0f` (deep black)
- Background Secondary: `#12121a` (dark purple-black)
- Accent Primary: `#ff3366` (vibrant pink-red)
- Accent Secondary: `#00ffcc` (cyber teal)
- Accent Tertiary: `#ffaa00` (golden orange)
- Text Primary: `#ffffff`
- Text Secondary: `#8a8a9a`
- Card Background: `#1a1a24`

**Typography:**
- Headings: "Orbitron" (futuristic, techy)
- Body: "Rajdhani" (modern, readable)
- Accent/Code: "JetBrains Mono" (monospace)

**Font Sizes:**
- H1: 4rem (hero), 2.5rem (page titles)
- H2: 1.8rem
- H3: 1.4rem
- Body: 1rem
- Small: 0.875rem

**Spacing System:**
- Base unit: 8px
- Section padding: 80px vertical
- Card padding: 24px
- Gap between cards: 32px

**Visual Effects:**
- Glassmorphism cards with backdrop-filter
- Glow effects on hover (box-shadow with accent colors)
- Particle background animation (canvas)
- Gradient borders on cards
- Smooth scroll behavior

### Components

**1. Navigation Bar**
- Fixed position, glassmorphism background
- Logo (text-based with glow)
- Links: Home, Projets, À propos
- Hover: underline animation with accent color

**2. Hero Section**
- Full viewport height
- Animated typing effect for titles
- Particle canvas background
- CTA buttons with glow hover
- Social icons row

**3. Project Cards**
- Aspect ratio: 16:9 thumbnail area
- Thumbnail (image or video embed)
- Title overlay on hover
- Tags displayed as pills
- Role badge
- Hover: scale up + glow border

**4. Project Detail Modal/Page**
- Large hero image/video
- Project title + description
- Tags (tools, roles)
- Gallery (images + videos)
- Links (itch.io, steam, github)
- Tech stack Used

**5. Tag Pills**
- Rounded corners (20px)
- Color-coded by category:
  - Role tags: pink-red (`#ff3366`)
  - Tool tags: teal (`#00ffcc`)
  - Engine tags: orange (`#ffaa00`)
  - Language tags: purple (`#9966ff`)

**6. Filter Bar**
- Horizontal scrollable on mobile
- Active filter has glow effect
- "All" option + category filters

---

## 3. Functionality Specification

### Core Features

**Project Data Management:**
- All projects stored in `data/projects.json`
- Each project has:
  - id: unique identifier
  - title: project name
  - description: short description
  - descriptionLong: full description
  - thumbnail: path to preview image
  - video: optional YouTube/Vimeo embed or video file
  - images: array of gallery images
  - tags: array of tag objects {name, category}
  - links: object with itch, steam, github, demo URLs
  - date: completion date
  - featured: boolean for home page highlight

**Adding a Project:**
1. Add entry to `data/projects.json`
2. Add thumbnail to `assets/thumbnails/`
3. Add images to `assets/projects/{id}/`

**Removing a Project:**
1. Remove entry from JSON
2. Optionally delete associated files

**Filtering:**
- Filter by tag category (role, tool, engine)
- Multi-select filter support
- Animated filter transitions

**Animations:**
- Page load: staggered fade-in for cards
- Scroll: elements animate in when visible
- Hover: scale, glow, color transitions
- Hero: typing effect + particle animation
- Navigation: smooth underline animation

### User Interactions
- Click project card → open detail view
- Click filter → filter projects with animation
- Scroll → trigger scroll animations
- Hover cards → reveal overlay + glow

### Data Structure (projects.json)
```json
{
  "projects": [
    {
      "id": "project-slug",
      "title": "Project Title",
      "description": "Short description",
      "descriptionLong": "Full description...",
      "thumbnail": "assets/thumbnails/project.jpg",
      "video": "https://youtube.com/embed/xxx",
      "images": ["img1.jpg", "img2.jpg"],
      "tags": [
        {"name": "Game Designer", "category": "role"},
        {"name": "Unity", "category": "engine"},
        {"name": "C#", "category": "language"}
      ],
      "links": {
        "itch": "https://...",
        "github": "https://..."
      },
      "date": "2024",
      "featured": true
    }
  ]
}
```

---

## 4. File Structure

```
portfolio/
├── index.html
├── projects.html
├── project.html
├── about.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── projects.js
│   ├── particles.js
│   └── typing.js
├── data/
│   └── projects.json
├── assets/
│   ├── thumbnails/
│   └── projects/
└── README.md
```

---

## 5. Acceptance Criteria

- [ ] Site loads with animated hero and particle background
- [ ] All projects display from JSON data
- [ ] Filtering works correctly with animations
- [ ] Project detail shows video/images/tags correctly
- [ ] Adding new project to JSON reflects on site
- [ ] Responsive on mobile/tablet/desktop
- [ ] All animations smooth (60fps)
- [ ] Tags color-coded by category
- [ ] External links open in new tab
- [ ] Can be hosted on GitHub Pages
