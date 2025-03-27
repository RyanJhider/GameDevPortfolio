// Advanced glitch effects
class GlitchEffect {
    constructor(element) {
        this.element = element;
        this.originalText = element.textContent;
        this.glitchInterval = null;
    }

    start() {
        this.glitchInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                this.applyGlitch();
            }
        }, 2000);
    }

    applyGlitch() {
        const glitchDuration = 100 + Math.random() * 400;
        const glitchText = this.generateGlitchText();
        
        this.element.textContent = glitchText;
        this.element.style.color = `hsl(${Math.random() * 120}, 100%, 50%)`;
        
        setTimeout(() => {
            this.element.textContent = this.originalText;
            this.element.style.color = '';
        }, glitchDuration);
    }

    generateGlitchText() {
        const chars = '!@#$%^&*()_+-=[]{}|;\':",./<>?\\';
        let result = '';
        for (let i = 0; i < this.originalText.length; i++) {
            if (Math.random() > 0.7) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            } else {
                result += this.originalText.charAt(i);
            }
        }
        return result;
    }
}

// Initialize glitch effects
document.addEventListener('DOMContentLoaded', () => {
    const glitchElements = document.querySelectorAll('.glitch-text');
    glitchElements.forEach(el => {
        const glitch = new GlitchEffect(el);
        glitch.start();
    });
});
