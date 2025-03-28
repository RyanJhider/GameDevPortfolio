document.addEventListener('DOMContentLoaded', () => {
    // Typewriter effect
    const typewriterElements = document.querySelectorAll('.typewriter');
    typewriterElements.forEach(el => {
        const text = el.textContent;
        el.textContent = '';
        let i = 0;
        const typing = setInterval(() => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
            }
        }, 50);
    });

    // Random glitch effect
    setInterval(() => {
        const glitch = document.querySelector('.glitch');
        if (Math.random() > 0.7) {
            glitch.style.opacity = '0.9';
            glitch.style.background = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="${Math.random() > 0.5 ? '#ff00ff' : '#00ffff'}" opacity="0.5"/></svg>')`;
            setTimeout(() => {
                glitch.style.opacity = '0';
            }, 50);
        }
    }, 1000);

    // Apply desynchronized blinking to glitch text
    document.querySelectorAll('.glitch-text').forEach(el => {
        const text = el.textContent;
        el.innerHTML = '';
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.setProperty('--char-index', i);
            el.appendChild(span);
        });
    });

    // Set random blink delays for buttons
    document.querySelectorAll('.blinking').forEach((el, index) => {
        el.style.setProperty('--blink-delay', Math.random() * 5);
    });

    // Load projects dynamically
    const projects = [
        {
            title: "ROCKET LANDING",
            description: "A mobile game where players must safely land a rocket on a moving platform, testing their reflexes and precision. Over 1k downloads on Play Store.",
            skills: ["Unity", "C#", "Mobile Development", "Game Design", "UI/UX"],
            link: "https://play.google.com/store/apps/details?id=com.Rakemy.RocketLanding",
            image: "images/RocketLanding/RocketLandingStorePage.png",
            year: "2022",
            trailer: "https://www.youtube.com/watch?v=Ar9nVtMJKYs"
        },
        {
            title: "HAUNTED MANSION",
            description: "A first-person horror exploration game with puzzle elements set in a decaying Victorian mansion filled with supernatural phenomena.",
            skills: ["Unity", "C#", "Shader Graph", "AI Behavior", "Lighting"],
            link: "project1.html",
            image: "images/haunted-mansion.jpg",
            year: "2023"
        },
        {
            title: "RETRO ZOMBIE",
            description: "Top-down survival shooter with PS1-style graphics and a dynamic day/night cycle that affects zombie behavior.",
            skills: ["Godot", "GDScript", "Pixel Art", "Procedural Generation", "Sound Design"],
            link: "project2.html",
            image: "images/retro-zombie.jpg",
            year: "2022"
        },
        {
            title: "THE LOST TAPE",
            description: "Found footage horror experience with authentic VHS effects, where players must solve mysteries while managing limited battery life.",
            skills: ["Unreal Engine", "Blueprints", "Post-processing", "Cinematics", "Audio"],
            link: "project3.html",
            image: "images/lost-tape.jpg",
            year: "2024"
        }
    ];

    const projectsSection = document.getElementById('projects');
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = `terminal-box project ${project.title === "ROCKET LANDING" ? 'featured-project' : ''}`;
        projectElement.innerHTML = `
            <div class="project-header">
                <h2 class="glitch-text" data-text="${project.title}">${project.title}</h2>
                <span class="project-year">${project.year}</span>
            </div>
            <img src="${project.image}" alt="${project.title}" class="project-image">
            <p class="terminal-text">${project.description}</p>
            <div class="skills-used">
                ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="project-links">
                ${project.title === "ROCKET LANDING" ? 
                    `<a href="rocket-landing.html" class="terminal-link blinking" data-text="[VIEW DETAILS]">[VIEW DETAILS]</a>` : 
                    project.link.includes('play.google.com') ? 
                    `<a href="${project.link}" class="terminal-link blinking" data-text="[PLAY STORE]" target="_blank">[PLAY STORE]</a>` : 
                    `<a href="${project.link}" class="terminal-link" target="_blank">[VIEW PROJECT]</a>`}
                ${project.trailer ? `<a href="${project.trailer}" class="terminal-link" target="_blank">[WATCH TRAILER]</a>` : ''}
            </div>
        `;
        projectsSection.appendChild(projectElement);
    });

    // Load skills
    const skills = [
        { name: "Unity", level: 90 },
        { name: "Unreal Engine", level: 80 },
        { name: "C#", level: 85 },
        { name: "C++", level: 75 },
        { name: "Shader Programming", level: 70 },
        { name: "3D Modeling", level: 65 },
        { name: "Sound Design", level: 60 }
    ];

    const skillsSection = document.getElementById('skills');
    skills.forEach(skill => {
        const skillElement = document.createElement('div');
        skillElement.className = 'skill';
        skillElement.innerHTML = `
            <p class="terminal-text">${skill.name}</p>
            <div class="skill-bar">
                <div class="skill-level" style="width: ${skill.level}%"></div>
            </div>
        `;
        skillsSection.appendChild(skillElement);
    });


    // Set current date in footer
    const now = new Date();
    document.getElementById('current-date').textContent =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Interactive elements - Trigger on load
    const handleInteraction = () => {
        const blinkingElement = document.querySelector('.blinking');
        if (blinkingElement) {
            blinkingElement.style.animation = 'none';
            blinkingElement.innerHTML = '> SYSTEM_READY<span class="cursor">&#9608;</span>';
        }

        // Add interaction effect
        const inputElement = document.querySelector('.terminal-footer .terminal-text:last-child');
        if (inputElement) {
            inputElement.innerHTML = '> USER_INPUT: READY<span class="cursor">_</span>';
        }
    };

    handleInteraction(); // Call the function immediately on load

    // Carousel functionality
    const carouselSlides = document.querySelector('.carousel-slides');
    if (!carouselSlides) {
        console.error('Carousel slides container not found');
        return;
    }
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) {
        console.error('No carousel slides found');
        return;
    }
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const indicators = document.querySelectorAll('.carousel-indicator');
    let currentIndex = 0;

    function updateCarousel() {
        console.log('Updating carousel to index:', currentIndex);
        
        const transformValue = `translateX(-${currentIndex * 100}%)`;
        console.log('Applying transform:', transformValue);
        carouselSlides.style.transform = transformValue;
        
        // Update active states
        slides.forEach((slide, index) => {
            const isActive = index === currentIndex;
            console.log(`Slide ${index} active:`, isActive);
            slide.classList.toggle('active', isActive);
        });
        
        indicators.forEach((indicator, index) => {
            const isActive = index === currentIndex;
            console.log(`Indicator ${index} active:`, isActive);
            indicator.classList.toggle('active', isActive);
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    }

    // Debug carousel elements
    console.log('Carousel Debug:');
    console.log('Slides container:', carouselSlides);
    console.log('Slides:', slides);
    console.log('Prev button:', prevBtn);
    console.log('Next button:', nextBtn);
    console.log('Indicators:', indicators);

    // Button events with enhanced logging
    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Next button clicked - Current index before:', currentIndex);
            nextSlide();
            console.log('Current index after:', currentIndex);
        });
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Prev button clicked - Current index before:', currentIndex);
            prevSlide();
            console.log('Current index after:', currentIndex);
        });
    } else {
        console.error('Carousel buttons not found - Next:', nextBtn, 'Prev:', prevBtn);
    }

    // Indicator events
    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            currentIndex = parseInt(indicator.dataset.index);
            updateCarousel();
        });
    });

    // Auto-advance (optional)
    setInterval(() => {
        if (Math.random() > 0.7) { // Random glitch effect
            nextSlide();
        }
    }, 5000);
});
