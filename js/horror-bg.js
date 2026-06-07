/* ========================================
   HORROR-BG.JS - Interactive Horror Background
   Dark atmosphere with subtle movement
   ======================================== */

class HorrorBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.ripples = [];
        
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.resize();
        
        // Create atmospheric particles
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }
    
    handleMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        
        // Create subtle ripple on mouse move
        if (Math.random() > 0.9) {
            this.ripples.push({
                x: this.mouseX,
                y: this.mouseY,
                radius: 0,
                maxRadius: 50 + Math.random() * 30,
                opacity: 0.15
            });
        }
    }
    
    update() {
        // Update particles
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Wrap around edges
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Slight attraction to mouse
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 200 && dist > 0) {
                p.x += (dx / dist) * 0.2;
                p.y += (dy / dist) * 0.2;
            }
        });
        
        // Update ripples
        this.ripples = this.ripples.filter(r => {
            r.radius += 2;
            r.opacity -= 0.008;
            return r.opacity > 0;
        });
    }
    
    draw() {
        // Clear with slight trail effect
        this.ctx.fillStyle = 'rgba(8, 8, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw atmospheric particles
        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(139, 35, 35, ${p.opacity})`;
            this.ctx.fill();
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            gradient.addColorStop(0, `rgba(139, 35, 35, ${p.opacity * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw ripples
        this.ripples.forEach(r => {
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(196, 60, 60, ${r.opacity})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
        
        // Occasional flash effect
        if (Math.random() > 0.995) {
            this.ctx.fillStyle = 'rgba(139, 35, 35, 0.03)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('horror-canvas');
    if (canvas) {
        new HorrorBackground(canvas);
    }
});