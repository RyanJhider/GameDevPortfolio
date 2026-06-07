/* ========================================
   ANIMATIONS & JUICE - Portfolio Interactions
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initAnimations();
    initHoverEffects();
    initClickEffects();
    initScrollAnimations();
    initGlitchEffects();
    initParticleBackground();
});

// ========== HOVER EFFECTS ==========
function initHoverEffects() {
    // Project cards - scale and glow
    const projectCards = document.querySelectorAll('.project-card, .project-item');
    
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            // Add glow effect
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function(e) {
            this.style.transform = '';
        });
    });
    
    // Buttons - press effect
    const buttons = document.querySelectorAll('.btn, .terminal-btn, .social-btn, .nav-link');
    
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            playHoverSound();
        });
        
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            // Animate icon
            const icon = this.querySelector('.menu-icon');
            if (icon) {
                icon.style.transform = 'scale(1.3) rotate(10deg)';
                icon.style.textShadow = '0 0 15px var(--accent-cyan)';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.menu-icon');
            if (icon) {
                icon.style.transform = '';
                icon.style.textShadow = '';
            }
        });
    });
}

// ========== CLICK EFFECTS ==========
function initClickEffects() {
    // Ripple effect on buttons
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn, .terminal-btn, .menu-item, .project-item');
        if (btn) {
            createRipple(e, btn);
            playClickSound();
        }
    });
    
    // Project items click feedback
    const projectItems = document.querySelectorAll('.project-item, .project-card');
    projectItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Visual feedback
            this.style.transition = 'none';
            this.style.transform = 'translateX(8px) scale(0.98)';
            
            setTimeout(() => {
                this.style.transition = '';
                this.style.transform = '';
            }, 150);
        });
    });
}

function createRipple(e, element) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(51, 255, 51, 0.5);
        border-radius: 50%;
        pointer-events: none;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%) scale(0);
        animation: ripple 0.6s ease-out forwards;
    `;
    
    // Add ripple animation keyframes if not exists
    if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: translate(-50%, -50%) scale(20);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements
    const animateElements = document.querySelectorAll('.project-card, .project-item, .section-header, .stat-box');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
    
    // Add visible class styles
    setTimeout(() => {
        const style = document.createElement('style');
        style.textContent = `
            .visible, .visible .project-card, .visible .project-item, .visible .stat-box {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }, 100);
}

// ========== GLITCH EFFECTS ==========
function initGlitchEffects() {
    // Random glitch on hover
    const glitchElements = document.querySelectorAll('.project-name, .section-title, .terminal-title');
    
    glitchElements.forEach(el => {
        el.addEventListener('mouseenter', function() {
            if (Math.random() > 0.5) {
                glitchElement(this);
            }
        });
    });
}

function glitchElement(element) {
    const originalText = element.textContent;
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const glitchChars = '!@#$%<>[]{}|?';
    
    let iterations = 0;
    const maxIterations = 5 + Math.floor(Math.random() * 5);
    
    const interval = setInterval(() => {
        element.textContent = originalText.split('')
            .map((char, i) => {
                if (i < iterations) {
                    return originalText[i];
                }
                return glitchChars[Math.floor(Math.random() * glitchChars.length)];
            })
            .join('');
        
        iterations++;
        
        if (iterations >= originalText.length) {
            clearInterval(interval);
            element.textContent = originalText;
        }
    }, 30);
}

// ========== PARTICLE BACKGROUND ==========
function initParticleBackground() {
    const container = document.querySelector('.main-content');
    if (!container) return;
    
    // Create canvas for particles
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.15;
    `;
    
    container.style.position = 'relative';
    container.insertBefore(canvas, container.firstChild);
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    
    function resizeCanvas() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
    
    function createParticles() {
        particles = [];
        const count = Math.floor(canvas.width * canvas.height / 15000);
        
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(51, 255, 51, ${p.opacity})`;
            ctx.fill();
            
            // Draw connections
            particles.forEach(p2 => {
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(51, 255, 255, ${0.1 * (1 - dist / 100)})`;
                    ctx.stroke();
                }
            });
        });
        
        animationId = requestAnimationFrame(animateParticles);
    }
    
    // Initialize
    resizeCanvas();
    createParticles();
    animateParticles();
    
    // Recreate on resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
}

// ========== SOUND EFFECTS (Optional - can be disabled) ==========
let soundsEnabled = false;

function playHoverSound() {
    if (!soundsEnabled) return;
    // Placeholder for hover sound
    // You can add audio files here
}

function playClickSound() {
    if (!soundsEnabled) return;
    // Placeholder for click sound
}

// ========== TYPING EFFECT ==========
function initTypingEffect() {
    const textElement = document.getElementById('typed-text');
    if (!textElement) return;
    
    const texts = [
        'Game Developer',
        'Unity Expert', 
        '3D Artist',
        'Level Designer',
        'Indie Creator'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            textElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            textElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            setTimeout(type, 2000);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            setTimeout(type, 500);
        } else {
            setTimeout(type, isDeleting ? 50 : 100);
        }
    }
    
    type();
}

// ========== DYNAMIC STATS ==========
function initDynamicStats() {
    // Animate numbers counting up
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const text = stat.textContent;
        const num = parseInt(text);
        
        if (!isNaN(num)) {
            let current = 0;
            const increment = num / 30;
            const duration = 1000;
            const startTime = performance.now();
            
            function animate(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                current = Math.floor(num * easeOutQuart(progress));
                stat.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    stat.textContent = num;
                }
            }
            
            requestAnimationFrame(animate);
        }
    });
}

function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
}

// ========== INITIALIZE ALL ==========
function initAnimations() {
    initTypingEffect();
    initDynamicStats();
}

// Export for use in main.js
window.portfolioAnimations = {
    initAnimations,
    initHoverEffects,
    initClickEffects,
    initScrollAnimations,
    initGlitchEffects,
    initParticleBackground,
    initTypingEffect,
    initDynamicStats
};