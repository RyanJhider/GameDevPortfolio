// SIMPLE TEST - Just load and show projects
(function() {
    alert('Script loaded!');
    
    const grid = document.querySelector('.projects-grid');
    alert('Grid element: ' + (grid ? 'FOUND' : 'NOT FOUND'));
    
    if (!grid) {
        alert('STOP - No grid in page!');
        return;
    }
    
    // Try to load from Firestore
    if (typeof firebase === 'undefined') {
        alert('Firebase NOT loaded');
        return;
    }
    
    if (firebase.apps.length === 0) {
        alert('Firebase NOT initialized');
        return;
    }
    
    alert('Loading from Firestore...');
    
    firebase.firestore().collection('projects').get()
        .then(snapshot => {
            alert('Firestore: ' + snapshot.size + ' projects');
            
            if (snapshot.empty) {
                grid.innerHTML = '<p style="text-align:center">Aucun projet dans Firestore</p>';
                return;
            }
            
            let html = '';
            snapshot.forEach(doc => {
                const p = doc.data();
                html += '<div style="border:1px solid #fff;padding:15px;margin:10px;color:#fff"><h3>' + p.title + '</h3><p>' + (p.description || '') + '</p></div>';
            });
            
            grid.innerHTML = html;
            alert('Displayed ' + snapshot.size + ' projects');
        })
        .catch(err => {
            alert('Error: ' + err.message);
        });
})();