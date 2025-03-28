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
            title: "Rocket Landing",
            description: "A mobile game where players must safely land a rocket on a platform, testing their reflexes and precision. Over 1k downloads on Play Store.",
            skills: ["Unity", "C#", "Mobile Development", "Game Design", "UI/UX"],
            link: "rocket-landing.html",
            image: "images/RocketLanding/RocketLandingStorePage.png",
            year: "2022",
            trailer: "https://www.youtube.com/watch?v=Ar9nVtMJKYs"
        },
        {
            title: "Silent Pit",
            description: "A first-person horror game set in a deep pit and a rusted underground facility. Restore power and escape… but the monster hears you.",
            skills: ["Unity", "C#", "Shader Graph", "AI Behavior", "Lighting"],
            link: "Silent-Pit.html",
            image: "images/SilentPit/SilentPitMonster.png",
            year: "2024"
        },
        {
            title: "ZombieX",
            description: "A co-op isometric shooter where you and your team fight endless waves of zombies. Survive, upgrade, and push back the horde—before it’s too late.",
            skills: ["Unity", "C#", "Isometric", "MultiPlayer", "Steam"],
            link: "ZombieX.html",
            image: "images/ZombieX/ZombieX.png",
            year: "2024"
        },
        {
            title: "Heistgaard",
            description: "A 2D platformer where you play as a skilled thief working for Loki. Your mission: steal Thor’s relic while evading traps and enemies. A relentless boss pursues you throughout the heist, adding tension to every move. ",
            skills: ["Unity", "C#", "Post-processing", "Cinematics", "Audio", "Team of 12","Level Design","Git control"],
            link: "project3.html",
            image: "images/Heistgaard/Heistgaard.png",
            year: "2025"
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
                <a href="${project.link}" class="terminal-link" target="_blank">[VIEW PROJECT]</a>
                ${project.trailer ? `<a href="${project.trailer}" class="terminal-link" target="_blank">[WATCH TRAILER]</a>` : ''}
            </div>
        `;
        projectsSection.appendChild(projectElement);
    });

    // Load skills
    const skills = [
        { name: "Unity", level: 90 },
        { name: "Godot", level: 80 },
        { name: "C#", level: 85 },
        { name: "Blender", level: 75 },
        { name: "MultiPlayer", level: 70 },
        { name: "Texturing", level: 65 },
        { name: "Video Editing", level: 60 }
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

});
