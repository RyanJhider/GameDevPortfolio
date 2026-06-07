// Main Portfolio - Firebase First, then JSON fallback

var projectsData = null;
var activeTags = [];

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupFilters();
});

// Firebase config from config.js (excluded from Git)
var firebaseConfig = window.FIREBASE_CONFIG || {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

function loadData() {
    // Try Firebase first
    try {
        firebase.initializeApp(firebaseConfig);
        var db = firebase.firestore();
        
        db.collection('projects').get()
        .then(function(snapshot) {
            var projects = [];
            snapshot.forEach(function(doc) {
                projects.push(doc.data());
            });
            
            if (projects.length > 0) {
                projectsData = projects;
                renderProjects();
                updateStats();
            } else {
                // Fallback to JSON
                loadFromJSON();
            }
        })
        .catch(function(e) {
            console.log('Firebase error, fallback to JSON:', e);
            loadFromJSON();
        });
    } catch(e) {
        loadFromJSON();
    }
}

function loadFromJSON() {
    fetch('data/projects.json')
    .then(function(response) {
        if (!response.ok) throw new Error('Failed to load');
        return response.json();
    })
    .then(function(data) {
        if (data.projects && data.projects.length > 0) {
            projectsData = data.projects;
            renderProjects();
            updateStats();
        }
    })
    .catch(function(error) {
        console.error('Error loading data:', error);
    });
}

function getTagColor(category) {
    var colors = {
        'engine': '#3dff5e',
        'language': '#4ecdc4',
        'role': '#a855f7',
        'genre': '#ef4444',
        'platform': '#f59e0b',
        'tool': '#10b981',
        'other': '#6b7280'
    };
    return colors[category] || colors['other'];
}

function renderProjects() {
    var grid = document.getElementById('projects-list');
    if (!grid || !projectsData) return;
    
    // Home = featured only, Projects page = all
    var isHome = window.location.pathname.includes('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('projects');
    var toShow = isHome ? projectsData.filter(function(p) { return p.featured; }) : projectsData;
    
    // Tag filtering
    if (activeTags.length > 0) {
        toShow = toShow.filter(function(p) {
            if (!p.tags) return false;
            var projectTags = p.tags.map(function(t) { return typeof t === 'object' ? t.name : t; });
            return activeTags.some(function(tag) { 
                return projectTags.map(function(t) { return t.toLowerCase(); }).includes(tag.toLowerCase()); 
            });
        });
    }
    
    if (!toShow || toShow.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No projects found</div>';
        return;
    }
    
    grid.innerHTML = toShow.map(function(p) {
        var thumbnail = p.thumbnail ? '<img src="' + p.thumbnail + '" alt="' + (p.title || 'Project') + '" class="project-thumb">' : '<div class="project-thumb"></div>';
        var tagsHtml = '';
        if (p.tags && p.tags.length > 0) {
            tagsHtml = '<div class="project-tags">';
            p.tags.slice(0, 4).forEach(function(t) {
                var tagName = typeof t === 'object' ? t.name : t;
                var tagCat = typeof t === 'object' ? t.category : 'other';
                tagsHtml += '<span class="project-tag" style="color:' + getTagColor(tagCat) + ';">' + tagName + '</span>';
            });
            tagsHtml += '</div>';
        }
        
        return '<a href="project.html?id=' + p.id + '" class="project-card">' +
            thumbnail +
            '<div class="card-info">' +
                '<h3 class="project-title">' + (p.title || 'Untitled') + '</h3>' +
                '<p class="project-desc">' + (p.description || '') + '</p>' +
                tagsHtml +
            '</div>' +
        '</a>';
    }).join('');
}

function updateStats() {
    if (!projectsData) return;
    var total = projectsData.length;
    var featured = projectsData.filter(function(p) { return p.featured; }).length;
    var years = new Date().getFullYear() - 2022;
    
    var countEl = document.getElementById('projects-count');
    if (countEl) countEl.textContent = total;
    
    var featEl = document.getElementById('featured-count');
    if (featEl) featEl.textContent = featured;
    
    var yearsEl = document.getElementById('years-experience');
    if (yearsEl) yearsEl.textContent = years > 0 ? years : 1;
}

function setupFilters() {
    var btns = document.querySelectorAll('.filter-btn');
    btns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var filter = this.getAttribute('data-filter');
            
            if (filter === 'all') {
                activeTags = [];
            } else {
                activeTags = [filter];
            }
            
            btns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            
            renderProjects();
        });
    });
}

// Loading screen - FAST
window.addEventListener('load', function() {
    setTimeout(function() {
        var loader = document.getElementById('loading-screen');
        if (loader) loader.classList.add('hidden');
    }, 600);
});