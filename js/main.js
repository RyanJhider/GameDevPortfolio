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
            link: "silent-pit.html",
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
            image: "images/Heistgaard/HeistGaard.png",
            year: "2025"
        },
        {
            title: "Mislender",
            description: "A multiplayer horror game with proximity chat where players must work together to fix their broken car and escape the haunted forest. AI creatures track players using sound and movement - work together quietly or risk being hunted down. Built with Unity and Mirror networking.",
            skills: ["Unity", "C#", "Mirror Networking", "Vivox", "Steam Integration", "Proximity Chat", "MultiPlayer", "AI Behavior", "Horror Design"],
            link: "mislender.html",
            image: "images/Mislender/Mislender.png",
            year: "2024",
            trailer: "https://www.youtube.com/watch?v=example"
        },
        {
            title: "SlenderMultiplayer",
            description: "A multiplayer horror game where players work together to collect pages while being hunted by Slender. Features proximity chat and randomized map layouts for replayability.",
            skills: ["Unity", "C#", "Mirror Networking", "Proximity Chat", "MultiPlayer", "AI Behavior", "Procedural Generation", "Horror Design"],
            link: "slendermultiplayer.html",
            image: "images/SlenderMultiplayer/SlenderMultiplayer.png",
            year: "2024",
            trailer: "https://www.youtube.com/watch?v=example"
        }
    ];

    const projectsSection = document.getElementById('projects');
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = `terminal-box project ${project.title === "Rocket Landing" ? 'featured-project' : ''}`;
        projectElement.innerHTML = `
            <div class="project-header">
                <h2 class="glitch-text" data-text="${project.title}">${project.title}</h2>
                <span class="project-year">${project.year}</span>
            </div>
            <img src="${project.image}" alt="${project.title}" class="project-image">
            <p class="terminal-text" style="white-space: pre-wrap;">${project.description.replace(/\. /g, '.\n')}</p>
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

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            formStatus.textContent = '> SENDING_MESSAGE...';
            formStatus.style.color = '#00ff00';

            try {
                // Convert form data to URL-encoded string
                const formData = new URLSearchParams();
                formData.append('name', contactForm.elements.name.value);
                formData.append('email', contactForm.elements.email.value);
                formData.append('message', contactForm.elements.message.value);
                formData.append('_replyto', contactForm.elements.email.value);
                formData.append('_subject', 'New message from portfolio');
                formData.append('_format', 'plain');
                formData.append('_gotcha', ''); // Honeypot

                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData.toString(),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                let result;
                try {
                    result = await response.json();
                    if (!response.ok) {
                        throw new Error(result.error || 'Form submission failed');
                    }
                } catch (error) {
                    throw new Error('Failed to parse server response');
                }
                
                if (response.ok && result.ok) {
                    formStatus.textContent = '> MESSAGE_SENT_SUCCESSFULLY!';
                    formStatus.style.color = '#00ff00';
                    contactForm.reset();
                } else {
                    throw new Error(result.error || 'Failed to send message. Please try again later.');
                }
            } catch (error) {
                formStatus.textContent = `> ERROR: ${error.message}`;
                formStatus.style.color = '#ff0000';
                console.error('Form Error:', error);
                
                // Show contact email as fallback
                const emailLink = document.createElement('a');
                emailLink.href = 'mailto:ryanjhider@gmail.com';
                emailLink.textContent = 'ryanjhider@gmail.com';
                emailLink.className = 'terminal-link';
                formStatus.appendChild(document.createTextNode(' > '));
                formStatus.appendChild(emailLink);
            }
        });
    }
});
