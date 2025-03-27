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
        if (Math.random() > 0.9) {
            glitch.style.opacity = '0.7';
            glitch.style.background = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="${Math.random() > 0.5 ? '#ff00ff' : '#00ffff'}" opacity="0.3"/></svg>')`;
            setTimeout(() => {
                glitch.style.opacity = '0';
            }, 100);
        }
    }, 3000);

    // Load projects dynamically
    const projects = [
        {
            title: "HAUNTED MANSION",
            description: "A first-person horror exploration game with puzzle elements",
            skills: ["Unity", "C#", "Shader Graph"],
            link: "project1.html"
        },
        {
            title: "RETRO ZOMBIE",
            description: "Top-down survival shooter with PS1-style graphics",
            skills: ["Godot", "GDScript", "Pixel Art"],
            link: "project2.html"
        },
        {
            title: "THE LOST TAPE",
            description: "Found footage horror experience with VHS effects",
            skills: ["Unreal Engine", "Blueprints", "Post-processing"],
            link: "project3.html"
        }
    ];

    const projectsSection = document.getElementById('projects');
    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'terminal-box project';
        projectElement.innerHTML = `
            <h2 class="glitch-text" data-text="${project.title}">${project.title}</h2>
            <p class="terminal-text">${project.description}</p>
            <div class="skills-used">
                ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <a href="${project.link}" class="terminal-link">[EXPLORE]</a>
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

    // Interactive elements
    document.addEventListener('keypress', () => {
        document.querySelector('.blinking').style.animation = 'none';
        document.querySelector('.blinking').textContent = '> System ready...';
    });
});
