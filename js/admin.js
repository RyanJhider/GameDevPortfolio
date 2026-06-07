// Admin Dashboard - Firebase Only
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

function initAdmin() {
    if (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey) {
        try {
            firebase.initializeApp(FIREBASE_CONFIG);
            window.FIREBASE_CONFIG = FIREBASE_CONFIG;
            console.log('Firebase initialized');
        } catch(e) {
            console.log('Firebase init error:', e);
        }
    }
    
    setupLoginForm();
    setupNav();
    setupProjectFilters();
    setupProjectForm();
    setupFileUploads();
    setupProfileForm();
    checkAuth();
}

function setupLoginForm() {
    var form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            doLogin();
        });
    }
}

function doLogin() {
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var errorEl = document.getElementById('login-error');
    
    if (!email || !password) return;
    
    email = email.value;
    password = password.value;
    errorEl.textContent = '';
    
    if (typeof firebase === 'undefined') {
        errorEl.textContent = 'Firebase non charge';
        return;
    }
    
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
        errorEl.textContent = 'Config Firebase manquante';
        return;
    }
    
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(userCredential) {
        showDashboard();
    })
    .catch(function(error) {
        errorEl.textContent = getErrorMessage(error.code);
    });
}

function getErrorMessage(code) {
    switch(code) {
        case 'auth/user-not-found': return 'Utilisateur non trouve';
        case 'auth/wrong-password': return 'Mot de passe incorrect';
        case 'auth/invalid-email': return 'Email invalide';
        case 'auth/too-many-requests': return 'Trop de tentatives';
        case 'auth/network-request-failed': return 'Erreur reseau';
        default: return 'Erreur: ' + code;
    }
}

function doLogout() {
    firebase.auth().signOut().then(function() {
        showLoginScreen();
    }).catch(function() {
        showLoginScreen();
    });
}

function checkAuth() {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
        showLoginScreen();
        return;
    }
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            showDashboard();
        } else {
            showLoginScreen();
        }
    }, function(error) {
        showLoginScreen();
    });
}

function showLoginScreen() {
    var login = document.getElementById('login-screen');
    var dashboard = document.getElementById('admin-dashboard');
    if (login) login.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
}

function showDashboard() {
    var login = document.getElementById('login-screen');
    var dashboard = document.getElementById('admin-dashboard');
    if (login) login.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    loadProjects();
    loadExistingTags();
}

// NAVIGATION
function setupNav() {
    var navItems = document.querySelectorAll('.admin-nav-item');
    for (var i = 0; i < navItems.length; i++) {
        navItems[i].addEventListener('click', function(e) {
            e.preventDefault();
            var view = this.getAttribute('data-view');
            goToView(view);
        });
    }
    
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
}

function goToView(view) {
    var navItems = document.querySelectorAll('.admin-nav-item');
    for (var i = 0; i < navItems.length; i++) {
        if (navItems[i].getAttribute('data-view') === view) {
            navItems[i].classList.add('active');
        } else {
            navItems[i].classList.remove('active');
        }
    }
    
    var views = document.querySelectorAll('.admin-view');
    for (var j = 0; j < views.length; j++) {
        views[j].classList.add('hidden');
        views[j].classList.remove('active');
    }
    
    var target = document.getElementById('view-' + view);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    
    if (view === 'profile') {
        loadProfile();
    }
}

window.showProjectsView = function() {
    goToView('projects');
};

// PROJECTS
var projects = [];
var existingTags = [];

function loadProjects() {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
        renderProjects([]);
        return;
    }
    
    var db = firebase.firestore();
    db.collection('projects').get().then(function(snapshot) {
        projects = [];
        snapshot.forEach(function(doc) {
            projects.push({ id: doc.id, ...doc.data() });
        });
        renderProjects(projects);
    }).catch(function(error) {
        console.log('Firestore error:', error);
        renderProjects([]);
    });
}

function renderProjects(list) {
    var grid = document.getElementById('projects-list');
    if (!grid) return;
    
    if (!list || list.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">Aucun projet</p>';
        return;
    }
    
    grid.innerHTML = list.map(function(p) {
        var thumb = p.thumbnail ? '<img src="' + p.thumbnail + '">' : '<div class="thumbnail-placeholder">?</div>';
        var featured = p.featured ? '<span class="badge">Featured</span>' : '';
        var draft = p.status === 'draft' ? '<span class="badge badge-draft">Brouillon</span>' : '';
        
        return '<div class="admin-project-card">' +
            '<div class="thumbnail">' + thumb + '</div>' +
            '<div class="info">' +
                '<h3>' + (p.title || 'Sans titre') + '</h3>' +
                '<p>' + (p.description || '') + '</p>' +
                '<div class="tags-row">' + featured + draft + '</div>' +
                '<div class="actions">' +
                    '<button class="btn btn-primary btn-sm" onclick="editProject(\'' + p.id + '\')">Editer</button>' +
                    '<button class="btn btn-danger btn-sm" onclick="deleteProject(\'' + p.id + '\')">Supprimer</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

// FILTERS
function setupProjectFilters() {
    var btns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function() {
            var filter = this.getAttribute('data-filter');
            var allBtns = document.querySelectorAll('.filter-btn');
            for (var j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            
            var filtered = projects;
            if (filter === 'featured') filtered = projects.filter(function(p) { return p.featured; });
            else if (filter === 'published') filtered = projects.filter(function(p) { return p.status !== 'draft'; });
            else if (filter === 'draft') filtered = projects.filter(function(p) { return p.status === 'draft'; });
            renderProjects(filtered);
        });
    }
}

// PROJECT FORM
var currentEditId = null;
var uploadedFiles = { thumbnail: null, gallery: [] };

function editProject(id) {
    var p = projects.find(function(x) { return x.id === id; });
    if (p) window.showCreateForm(p);
}

function deleteProject(id) {
    if (!confirm('Supprimer ce projet?')) return;
    
    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
        var db = firebase.firestore();
        db.collection('projects').doc(id).delete().then(function() {
            loadProjects();
            showToast('Projet supprime');
        }).catch(function(e) {
            showToast('Erreur: ' + e.message, 'error');
        });
    }
}

function setupProjectForm() {
    var form = document.getElementById('project-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProject();
        });
    }
}

window.showCreateForm = function(project) {
    currentEditId = project ? project.id : null;
    document.getElementById('project-form').reset();
    document.getElementById('form-title').textContent = project ? 'Editer le projet' : 'Nouveau projet';
    
    uploadedFiles = { thumbnail: null, gallery: [] };
    renderGalleryPreview();
    renderTags([]);
    renderLinks([]);
    
    if (project) {
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-title').value = project.title || '';
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-description-long').value = project.descriptionLong || '';
        document.getElementById('project-date').value = project.date || '';
        document.getElementById('project-year').value = project.year || '';
        document.getElementById('project-platform').value = project.platform || '';
        document.getElementById('project-status').value = project.status || 'published';
        document.getElementById('project-video').value = project.video || '';
        document.getElementById('project-featured').checked = project.featured || false;
        
        // NEW: Team, Context, Duration, Role
        document.getElementById('project-team').value = project.team || '';
        document.getElementById('project-context').value = project.context || '';
        document.getElementById('project-duration').value = project.duration || '';
        document.getElementById('project-role').value = project.role || '';
        
        if (project.thumbnail) {
            uploadedFiles.thumbnail = project.thumbnail;
            document.getElementById('thumbnail-preview').innerHTML = '<img src="' + project.thumbnail + '">';
        }
        if (project.images) {
            uploadedFiles.gallery = project.images;
            renderGalleryPreview();
        }
        if (project.tags) renderTags(project.tags);
        if (project.links) renderLinks(project.links);
    }
    
    goToView('create');
};

// Load existing tags from projects for easy selection
function loadExistingTags() {
    fetch('data/projects.json?t=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (!data.projects) return;
        
        var tagsMap = {};
        data.projects.forEach(function(p) {
            if (p.tags && Array.isArray(p.tags)) {
                p.tags.forEach(function(t) {
                    var name = (typeof t === 'object' && t.name) ? t.name : t;
                    var cat = (typeof t === 'object' && t.category) ? t.category : 'other';
                    tagsMap[name.toLowerCase()] = { name: name, category: cat };
                });
            }
        });
        
        existingTags = Object.values(tagsMap);
        renderExistingTags();
    })
    .catch(function() {});
}

function renderExistingTags() {
    var container = document.getElementById('existing-tags-list');
    if (!container || existingTags.length === 0) return;
    
    container.innerHTML = existingTags.map(function(t) {
        return '<span class="existing-tag" onclick="addTagFromExisting(\'' + t.name.replace(/'/g, "\\'") + '\', \'' + t.category + '\')">' + t.name + '</span>';
    }).join('');
}

window.addTagFromExisting = function(name, category) {
    var container = document.getElementById('tags-container');
    if (!container) return;
    
    var existing = container.querySelectorAll('.tag-name');
    for (var i = 0; i < existing.length; i++) {
        if (existing[i].value.toLowerCase() === name.toLowerCase()) {
            showToast('Tag deja ajoute', 'error');
            return;
        }
    }
    
    var row = document.createElement('div');
    row.className = 'tag-row';
    row.innerHTML = 
        '<input type="text" class="tag-name" value="' + name + '" placeholder="Nom du tag">' +
        '<select class="tag-category">' +
            '<option value="engine"' + (category === 'engine' ? ' selected' : '') + '>Moteur</option>' +
            '<option value="language"' + (category === 'language' ? ' selected' : '') + '>Langage</option>' +
            '<option value="role"' + (category === 'role' ? ' selected' : '') + '>Role</option>' +
            '<option value="genre"' + (category === 'genre' ? ' selected' : '') + '>Genre</option>' +
            '<option value="platform"' + (category === 'platform' ? ' selected' : '') + '>Plateforme</option>' +
            '<option value="tool"' + (category === 'tool' ? ' selected' : '') + '>Outil</option>' +
            '<option value="other"' + (category === 'other' ? ' selected' : '') + '>Autre</option>' +
        '</select>' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>';
    container.appendChild(row);
    showToast('Tag ajoute: ' + name);
};

function renderLinks(links) {
    var container = document.getElementById('links-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (links && typeof links === 'object') {
        Object.keys(links).forEach(function(type) {
            var row = document.createElement('div');
            row.className = 'link-row';
            row.innerHTML = 
                '<select class="link-type">' +
                    '<option value="itch"' + (type === 'itch' ? ' selected' : '') + '>Itch.io</option>' +
                    '<option value="steam"' + (type === 'steam' ? ' selected' : '') + '>Steam</option>' +
                    '<option value="github"' + (type === 'github' ? ' selected' : '') + '>GitHub</option>' +
                    '<option value="googleplay"' + (type === 'googleplay' ? ' selected' : '') + '>Google Play</option>' +
                    '<option value="demo"' + (type === 'demo' ? ' selected' : '') + '>Demo</option>' +
                    '<option value="other"' + (type === 'other' ? ' selected' : '') + '>Autre</option>' +
                '</select>' +
                '<input type="url" class="link-url" value="' + (links[type] || '') + '" placeholder="https://...">' +
                '<button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>';
            container.appendChild(row);
        });
    }
}

function saveProject() {
    var id = document.getElementById('project-id').value.trim();
    if (!id) { showToast('ID requis', 'error'); return; }
    
    var data = {
        id: id,
        title: document.getElementById('project-title').value.trim(),
        description: document.getElementById('project-description').value.trim(),
        descriptionLong: document.getElementById('project-description-long').value.trim(),
        year: document.getElementById('project-year').value.trim(),
        date: document.getElementById('project-date').value.trim(),
        platform: document.getElementById('project-platform').value.trim(),
        status: document.getElementById('project-status').value,
        video: document.getElementById('project-video').value.trim(),
        featured: document.getElementById('project-featured').checked,
        
        team: document.getElementById('project-team').value.trim(),
        context: document.getElementById('project-context').value.trim(),
        duration: document.getElementById('project-duration').value.trim(),
        role: document.getElementById('project-role').value.trim(),
        
        thumbnail: uploadedFiles.thumbnail,
        images: uploadedFiles.gallery,
        tags: getTags(),
        links: getLinks()
    };
    
    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
        var db = firebase.firestore();
        db.collection('projects').doc(id).set(data).then(function() {
            showToast('Projet enregistre!');
            loadProjects();
            goToView('projects');
        }).catch(function(e) {
            showToast('Erreur: ' + e.message, 'error');
        });
    } else {
        showToast('Firebase non configure - impossible de sauvegarder', 'error');
    }
}

function getTags() {
    var tags = [];
    var rows = document.querySelectorAll('.tag-row');
    for (var i = 0; i < rows.length; i++) {
        var name = rows[i].querySelector('.tag-name').value.trim();
        var category = rows[i].querySelector('.tag-category').value;
        if (name) tags.push({ name: name, category: category });
    }
    return tags;
}

function getLinks() {
    var links = {};
    var rows = document.querySelectorAll('.link-row');
    for (var i = 0; i < rows.length; i++) {
        var type = rows[i].querySelector('.link-type').value;
        var url = rows[i].querySelector('.link-url').value.trim();
        if (url) links[type] = url;
    }
    return links;
}

window.addNewLink = function() {
    var container = document.getElementById('links-container');
    if (!container) return;
    var row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML = 
        '<select class="link-type">' +
            '<option value="itch">Itch.io</option><option value="steam">Steam</option>' +
            '<option value="github">GitHub</option><option value="googleplay">Google Play</option>' +
            '<option value="demo">Demo</option><option value="other">Autre</option>' +
        '</select>' +
        '<input type="url" class="link-url" placeholder="https://...">' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>';
    container.appendChild(row);
};

window.addNewTag = function() {
    var container = document.getElementById('tags-container');
    if (!container) {
        console.log('Tags container not found!');
        return;
    }
    var row = document.createElement('div');
    row.className = 'tag-row';
    row.innerHTML = 
        '<input type="text" class="tag-name" value="" placeholder="Nom du tag">' +
        '<select class="tag-category">' +
            '<option value="engine">Moteur (Unity, Godot...)</option>' +
            '<option value="language">Langage (C#, C++...)</option>' +
            '<option value="role">Role (Game Designer, Prog...)</option>' +
            '<option value="genre">Genre (Horror, RPG...)</option>' +
            '<option value="platform">Plateforme (PC, Mobile...)</option>' +
            '<option value="tool">Outil (Blender, FMOD...)</option>' +
            '<option value="other">Autre</option>' +
        '</select>' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>';
    container.appendChild(row);
};

function renderTags(tags) {
    var container = document.getElementById('tags-container');
    if (!container) {
        console.log('Tags container not found for render!');
        return;
    }
    container.innerHTML = '';
    
    if (tags && tags.length > 0) {
        for (var i = 0; i < tags.length; i++) {
            var row = document.createElement('div');
            row.className = 'tag-row';
            row.innerHTML = 
                '<input type="text" class="tag-name" value="' + (tags[i].name || '') + '" placeholder="Nom du tag">' +
                '<select class="tag-category">' +
                    '<option value="engine"' + (tags[i].category === 'engine' ? ' selected' : '') + '>Moteur</option>' +
                    '<option value="language"' + (tags[i].category === 'language' ? ' selected' : '') + '>Langage</option>' +
                    '<option value="role"' + (tags[i].category === 'role' ? ' selected' : '') + '>Role</option>' +
                    '<option value="genre"' + (tags[i].category === 'genre' ? ' selected' : '') + '>Genre</option>' +
                    '<option value="platform"' + (tags[i].category === 'platform' ? ' selected' : '') + '>Plateforme</option>' +
                    '<option value="tool"' + (tags[i].category === 'tool' ? ' selected' : '') + '>Outil</option>' +
                    '<option value="other"' + (tags[i].category === 'other' ? ' selected' : '') + '>Autre</option>' +
                '</select>' +
                '<button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>';
            container.appendChild(row);
        }
    }
}

// FILE UPLOADS
function setupFileUploads() {
    var thumbInput = document.getElementById('project-thumbnail-file');
    if (thumbInput) {
        thumbInput.addEventListener('change', function() {
            uploadThumbnail(this.files[0]);
        });
    }
    
    var galleryInput = document.getElementById('project-gallery-files');
    if (galleryInput) {
        galleryInput.addEventListener('change', function() {
            uploadGallery(this.files);
        });
    }
}

function uploadThumbnail(file) {
    if (!file || !file.type.startsWith('image/')) { 
        showToast('Selectionnez une image', 'error'); 
        return; 
    }
    
    // Check file size (limit to 500KB for Firestore)
    var maxSize = 500 * 1024;
    if (file.size > maxSize) {
        showToast('Image trop grande. Max 500KB. Utilisez une URL à la place.', 'error');
        return;
    }
    
    var reader = new FileReader();
    reader.onload = function(e) {
        var base64 = e.target.result;
        uploadedFiles.thumbnail = base64;
        var preview = document.getElementById('thumbnail-preview');
        if (preview) preview.innerHTML = '<img src="' + base64 + '">';
        showToast('Thumbnail ajoute (base64)');
    };
    reader.readAsDataURL(file);
}

function uploadGallery(files) {
    if (!files || files.length === 0) return;
    
    var uploaded = 0;
    var maxSize = 500 * 1024;
    
    for (var i = 0; i < files.length; i++) {
        if (!files[i].type.startsWith('image/')) continue;
        
        if (files[i].size > maxSize) {
            showToast('Image ' + files[i].name + ' trop grande. Max 500KB.', 'error');
            continue;
        }
        
        (function(f) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var base64 = e.target.result;
                uploadedFiles.gallery.push(base64);
                renderGalleryPreview();
                uploaded++;
                if (uploaded === files.length) {
                    showToast(uploaded + ' images ajoutees');
                }
            };
            reader.readAsDataURL(f);
        })(files[i]);
    }
}

function renderGalleryPreview() {
    var container = document.getElementById('gallery-preview');
    if (!container) return;
    
    if (uploadedFiles.gallery.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    var html = '';
    for (var i = 0; i < uploadedFiles.gallery.length; i++) {
        html += '<div class="gallery-item"><img src="' + uploadedFiles.gallery[i] + '"><button type="button" onclick="removeGalleryImage(' + i + ')">X</button></div>';
    }
    container.innerHTML = html;
}

window.removeGalleryImage = function(index) {
    uploadedFiles.gallery.splice(index, 1);
    renderGalleryPreview();
};

// IMPORT
window.importProjectsFromJSON = function() {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
        showToast('Config Firebase manquante!', 'error');
        return;
    }
    
    showToast('Import en cours vers Firestore...');
    
    fetch('data/projects.json?t=' + Date.now())
    .then(function(response) { 
        if (!response.ok) throw new Error('Fichier non trouve: ' + response.status);
        return response.json(); 
    })
    .then(function(data) {
        if (!data.projects || data.projects.length === 0) {
            showToast('Aucun projet trouve', 'error');
            return;
        }
        
        var imported = 0;
        var total = data.projects.length;
        var db = firebase.firestore();
        
        data.projects.forEach(function(project) {
            db.collection('projects').doc(project.id).set(project).then(function() {
                imported++;
                if (imported === total) {
                    showToast(total + ' projets importes dans Firestore!');
                    loadProjects();
                }
            }).catch(function(err) {
                showToast('Erreur import: ' + err.message, 'error');
            });
        });
    })
    .catch(function(err) { 
        showToast('Erreur: ' + err.message, 'error'); 
    });
};

// PROFILE
function loadProfile() {
    if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
        populateProfileForm({});
        return;
    }
    
    var db = firebase.firestore();
    db.collection('profile').doc('main').get().then(function(doc) {
        if (doc.exists) {
            populateProfileForm(doc.data());
        } else {
            populateProfileForm({});
        }
    }).catch(function() { populateProfileForm({}); });
}

function populateProfileForm(data) {
    data = data || {};
    
    if (data.avatar) {
        var preview = document.getElementById('avatar-preview');
        if (preview) preview.innerHTML = '<div class="preview-item"><img src="' + data.avatar + '"></div>';
    }
    
    var fields = ['profile-name', 'profile-title', 'profile-school', 'profile-location', 'profile-bio', 'profile-description'];
    var dataFields = ['name', 'title', 'school', 'location', 'bio', 'description'];
    
    for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById(fields[i]);
        if (el && data[dataFields[i]]) {
            el.value = data[dataFields[i]];
        }
    }
    
    if (data.skills) {
        var skillFields = ['skills-engines', 'skills-languages', 'skills-tools', 'skills-soft'];
        var skillData = ['engines', 'languages', 'tools', 'softSkills'];
        for (var j = 0; j < skillFields.length; j++) {
            var skillEl = document.getElementById(skillFields[j]);
            if (skillEl && data.skills[skillData[j]]) {
                skillEl.value = data.skills[skillData[j]].join(', ');
            }
        }
    }
    
    if (data.social) {
        var socialFields = ['social-github', 'social-linkedin', 'social-itchio', 'social-twitter', 'social-email'];
        var socialData = ['github', 'linkedin', 'itchio', 'twitter', 'email'];
        for (var k = 0; k < socialFields.length; k++) {
            var socialEl = document.getElementById(socialFields[k]);
            if (socialEl && data.social[socialData[k]]) {
                socialEl.value = data.social[socialData[k]];
            }
        }
    }
}

var uploadedAvatar = null;

function setupProfileForm() {
    var form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfile();
        });
    }
    
    var avatarInput = document.getElementById('profile-avatar-file');
    if (avatarInput) {
        avatarInput.addEventListener('change', function() {
            uploadAvatar(this.files[0]);
        });
    }
}

function uploadAvatar(file) {
    if (!file || !file.type.startsWith('image/')) return;
    
    var maxSize = 500 * 1024;
    if (file.size > maxSize) {
        showToast('Image trop grande. Max 500KB.', 'error');
        return;
    }
    
    var reader = new FileReader();
    reader.onload = function(e) {
        uploadedAvatar = e.target.result;
        var preview = document.getElementById('avatar-preview');
        if (preview) preview.innerHTML = '<div class="preview-item"><img src="' + uploadedAvatar + '"></div>';
        showToast('Avatar ajoute');
    };
    reader.readAsDataURL(file);
}

function saveProfile() {
    var data = {
        name: document.getElementById('profile-name').value.trim(),
        title: document.getElementById('profile-title').value.trim(),
        school: document.getElementById('profile-school').value.trim(),
        location: document.getElementById('profile-location').value.trim(),
        bio: document.getElementById('profile-bio').value.trim(),
        description: document.getElementById('profile-description').value.trim(),
        avatar: uploadedAvatar || '',
        skills: {
            engines: parseList('skills-engines'),
            languages: parseList('skills-languages'),
            tools: parseList('skills-tools'),
            softSkills: parseList('skills-soft')
        },
        social: {
            github: document.getElementById('social-github').value.trim(),
            linkedin: document.getElementById('social-linkedin').value.trim(),
            itchio: document.getElementById('social-itchio').value.trim(),
            twitter: document.getElementById('social-twitter').value.trim(),
            email: document.getElementById('social-email').value.trim()
        }
    };
    
    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
        var db = firebase.firestore();
        db.collection('profile').doc('main').set(data).then(function() {
            showToast('Profil enregistre!');
        }).catch(function(e) {
            showToast('Erreur: ' + e.message, 'error');
        });
    }
}

function parseList(id) {
    var el = document.getElementById(id);
    if (!el || !el.value) return [];
    return el.value.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
}

// TOAST
function showToast(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    var toast = document.createElement('div');
    toast.className = 'toast';
    if (type) toast.className += ' toast-' + type;
    toast.textContent = msg;
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// Export functions
window.goToView = goToView;
window.showCreateForm = window.showCreateForm;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.addNewTag = addNewTag;
window.addNewLink = addNewLink;
window.addTagFromExisting = addTagFromExisting;
window.importProjectsFromJSON = importProjectsFromJSON;
window.importProfileFromJSON = function() {
    fetch('data/projects.json?t=' + Date.now())
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (!data.profile) {
            showToast('Pas de profil trouve dans le fichier', 'error');
            return;
        }
        var db = firebase.firestore();
        db.collection('profile').doc('main').set(data.profile)
        .then(function() {
            showToast('Profil importe!', 'success');
            loadProfile();
        })
        .catch(function(err) {
            showToast('Erreur: ' + err.message, 'error');
        });
    });
};
window.showProjectsView = window.showProjectsView;
window.removeGalleryImage = removeGalleryImage;