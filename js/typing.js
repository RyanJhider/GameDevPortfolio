/* ========================================
   TYPING.JS - Terminal Typing Effect
   ======================================== */

class TypingEffect {
    constructor(element, texts, options = {}) {
        this.element = element;
        this.texts = texts;
        this.options = {
            typeSpeed: options.typeSpeed || 60,
            deleteSpeed: options.deleteSpeed || 30,
            delayBetween: options.delayBetween || 3000,
            ...options
        };
        
        this.textIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        this.timeoutId = null;
        
        this.init();
    }
    
    init() {
        this.type();
    }
    
    type() {
        const currentText = this.texts[this.textIndex];
        
        if (this.isDeleting) {
            this.element.textContent = currentText.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.element.textContent = currentText.substring(0, this.charIndex + 1);
            this.charIndex++;
        }
        
        let typeSpeed = this.isDeleting ? this.options.deleteSpeed : this.options.typeSpeed;
        
        if (!this.isDeleting && this.charIndex === currentText.length) {
            typeSpeed = this.options.delayBetween;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.textIndex = (this.textIndex + 1) % this.texts.length;
            typeSpeed = 500;
        }
        
        this.timeoutId = setTimeout(() => this.type(), typeSpeed);
    }
    
    destroy() {
        if (this.timeoutId) clearTimeout(this.timeoutId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const typingElement = document.getElementById('typed-text');
    if (typingElement) {
        const texts = [
            'GAME DESIGNER',
            'PROGRAMMER',
            'TECHNICAL ARTIST',
            'UNITY DEVELOPER',
            'LEVEL DESIGNER'
        ];
        
        new TypingEffect(typingElement, texts, {
            typeSpeed: 60,
            deleteSpeed: 30,
            delayBetween: 3000
        });
    }
});