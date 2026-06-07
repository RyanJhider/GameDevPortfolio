/* ========================================
   PROJECT DETAIL.JS
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    loadProjectDetail();
});

function loadProjectDetail() {
    // Get project ID from URL
    var urlParams = new URLSearchParams(window.location.search);
    var projectId = urlParams.get('id');
    
    if (!projectId) {
        showNotFound();
        return;
    }
    
    // Load project data first
    loadData();
}

var originalRenderAll = window.renderAll;
window.renderAll = function() {
    // Get project ID from URL
    var urlParams = new URLSearchParams(window.location.search);
    var projectId = urlParams.get('id');
    
    if (!projectId || !projectsData) {
        showNotFound();
        return;
    }
    
    var project = projectsData.find(function(p) { return p.id === projectId; });
    
    if (!project) {
        showNotFound();
        return;
    }
    
    renderProject(project);
};

function renderProject(project) {
    // Title
    var titleEl = document.getElementById('project-title');
    if (titleEl) titleEl.textContent = project.title || '';
    
    // Meta
    var yearEl = document.getElementById('project-year');
    if (yearEl) yearEl.textContent = project.date || project.year || '';
    
    var platformEl = document.getElementById('project-platform');
    if (platformEl) platformEl.textContent = project.platform || 'PC';
    
    // Tags
    var tagsEl = document.getElementById('project-tags');
    if (tagsEl && project.tags) {
        tagsEl.innerHTML = project.tags.slice(0, 6).map(function(t) {
            return '<span class="project-tag">' + (t.name || t) + '</span>';
        }).join('');
    }
    
    // Description
    var descEl = document.getElementById('project-description');
    if (descEl) {
        descEl.textContent = project.descriptionLong || project.description || '';
    }
    
    // Hero (video or image)
    var heroEl = document.getElementById('project-hero');
    if (heroEl && project.video) {
        heroEl.innerHTML = '<iframe src="' + project.video + '" frameborder="0" allowfullscreen style="width:100%;height:100%;"></iframe>';
    } else if (heroEl && project.thumbnail) {
        heroEl.innerHTML = '<img src="' + project.thumbnail + '" alt="">';
    }
    
    // Gallery
    var galleryEl = document.getElementById('project-gallery');
    if (galleryEl && project.images && project.images.length > 0) {
        galleryEl.innerHTML = project.images.map(function(img) {
            return '<img src="' + img + '" alt="">';
        }).join('');
    }
    
    // Links
    var linksEl = document.getElementById('project-links');
    if (linksEl && project.links && project.links.length > 0) {
        linksEl.innerHTML = project.links.map(function(link) {
            var label = link.type ? link.type.toUpperCase() : 'LINK';
            return '<a href="' + (link.url || '#') + '" class="btn btn-primary" target="_blank">' + label + '</a>';
        }).join('');
    }
}

function showNotFound() {
    var titleEl = document.getElementById('project-title');
    if (titleEl) titleEl.textContent = 'Project Not Found';
    
    var descEl = document.getElementById('project-description');
    if (descEl) descEl.textContent = 'This project does not exist.';
}

// Override loadData to call renderAll after loading
var originalLoadData = window.loadData;
window.loadData = function() {
    var config = window.FIREBASE_CONFIG || (typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : null);
    
    if (typeof firebase !== 'undefined' && config && config.apiKey) {
        window.FIREBASE_CONFIG = config;
        loadFromFirebase();
    } else {
        loadFromLocalJSON();
    }
};

// Make loadFromFirebase available globally
window.loadFromFirebase = function() {
    try {
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(window.FIREBASE_CONFIG);
        }
        
        firebase.firestore().collection('projects').get()
        .then(function(snap) {
            if (!snap.empty) {
                var projects = [];
                snap.forEach(function(d) {
                    projects.push({id: d.id, ...d.data()});
                });
                
                projects.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
                projectsData = projects;
                window.renderAll();
            } else {
                loadFromLocalJSON();
            }
        })
        .catch(function(e) {
            loadFromLocalJSON();
        });
    } catch(e) {
        loadFromLocalJSON();
    }
};