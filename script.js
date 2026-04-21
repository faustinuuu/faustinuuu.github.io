document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('cosmos-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let width, height;
    let particles = [];
    const particleCount = window.innerWidth < 768 ? 1200 : 3000;

    let state = 'intro'; 

    const mouse = { x: null, y: null, radius: 120 };
    const cursorEl = document.getElementById('custom-cursor');

    window.addEventListener('mousemove', (e) => { 
        mouse.x = e.clientX; 
        mouse.y = e.clientY; 
        if(cursorEl) {
            cursorEl.style.left = `${e.clientX}px`;
            cursorEl.style.top = `${e.clientY}px`;
        }
    });
    window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .nav-btn, .game-link, #intro-screen h2')) {
            cursorEl.classList.add('hovering');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .nav-btn, .game-link, #intro-screen h2')) {
            cursorEl.classList.remove('hovering');
        }
    });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    });
    window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

    window.addEventListener('resize', () => {
        resize();
        if (state === 'text' && currentSection) {
            let textMap = { 'me': 'ME', 'about': 'ABOUT', 'socials': 'SOCIALS', 'games': 'GAMES' };
            getTextCoordinates(textMap[currentSection]);
        }
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;

            this.baseVx = (Math.random() - 0.5) * 0.8;
            this.baseVy = (Math.random() - 0.5) * 0.8;

            this.z = Math.random() * 0.8 + 0.2; 
            this.size = (Math.random() * 1.8 + 0.2) * this.z;
            this.density = (Math.random() * 30 * this.z) + 1;

            let hue = 270 + (Math.random() * 50 - 25);
            let saturation = Math.random() * 60 + 40;
            let lightness = Math.random() * 50 + 50;
            this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

            this.targetX = this.x;
            this.targetY = this.y;
            this.vx = 0;
            this.vy = 0;

            this.isTextParticle = false;
        }

        update() {
            if (state === 'intro') {

                let centerX = width / 2;
                let centerY = height / 2;
                let dx = this.x - centerX;
                let dy = this.y - centerY;
                let dist = Math.sqrt(dx*dx + dy*dy) || 1;

                this.vx -= (dx / dist) * 0.01 * this.density;
                this.vy -= (dy / dist) * 0.01 * this.density;

                this.vx += (-dy / dist) * 0.075 * this.density;
                this.vy += (dx / dist) * 0.075 * this.density;

                this.vx *= 0.90; 
                this.vy *= 0.90;

                this.x += this.vx;
                this.y += this.vy;

            } else if (state === 'galaxy' || (state === 'text' && !this.isTextParticle)) {
                this.x += this.baseVx * this.z;
                this.y += this.baseVy * this.z;

                let centerX = width / 2;
                let centerY = height / 2;
                let dx = this.x - centerX;
                let dy = this.y - centerY;
                let dist = Math.sqrt(dx*dx + dy*dy) || 1;

                this.x += (-dy / dist) * 0.4 * this.z;
                this.y += (dx / dist) * 0.4 * this.z;

                this.vx *= 0.985;
                this.vy *= 0.985;
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < -10) this.x = width + 10;
                if (this.x > width + 10) this.x = -10;
                if (this.y < -10) this.y = height + 10;
                if (this.y > height + 10) this.y = -10;

            } else if (state === 'text' && this.isTextParticle && this.targetX !== undefined) {
                let dxTarget = this.targetX - this.x;
                let dyTarget = this.targetY - this.y;

                this.vx += dxTarget * 0.0005;
                this.vy += dyTarget * 0.0005;
                this.vx *= 0.985; 
                this.vy *= 0.985;
                this.x += this.vx;
                this.y += this.vy;
            } else if (state === 'scattered') {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.985;
                this.vy *= 0.985;

                if (this.x < -10) this.x = width + 10;
                if (this.x > width + 10) this.x = -10;
                if (this.y < -10) this.y = height + 10;
                if (this.y > height + 10) this.y = -10;
            }

            if (mouse.x !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    let force = (mouse.radius - distance) / mouse.radius;

                    this.vx -= (dx / distance) * force * this.density * 0.07;
                    this.vy -= (dy / distance) * force * this.density * 0.07;
                }
            }

            ctx.fillStyle = this.color;
            ctx.beginPath();

            let drawSize = this.size;
            if (state === 'text' && this.isTextParticle) {
                drawSize = this.size * 2.2;
                ctx.globalAlpha = 1.0;
            } else {
                ctx.globalAlpha = this.z < 0.5 ? 0.3 : (this.z < 0.8 ? 0.6 : 1.0);
            }

            ctx.arc(this.x, this.y, drawSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    let textCoordinates = [];

    function getTextCoordinates(text) {
        if (!width || !height) return;
        const textCanvas = document.createElement('canvas');
        const tCtx = textCanvas.getContext('2d', { willReadFrequently: true });
        textCanvas.width = width;
        textCanvas.height = height;

        tCtx.fillStyle = 'white';
        tCtx.strokeStyle = 'white';
        tCtx.lineWidth = width < 768 ? 10 : 25;
        tCtx.lineJoin = 'round';
        tCtx.lineCap = 'round';

        if (text === 'heart') {
            let cx = width / 2;
            let cy = height / 3.5;
            let size = Math.min(width / 100, 12) * 0.7;
            if (size < 4) size = 4;
            
            tCtx.beginPath();
            for (let t = 0; t <= Math.PI * 2; t += 0.05) {
                let x = 16 * Math.pow(Math.sin(t), 3);
                let y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                if (t === 0) tCtx.moveTo(cx + x * size, cy + y * size);
                else tCtx.lineTo(cx + x * size, cy + y * size);
            }
            tCtx.closePath();
            tCtx.stroke();
        } else {
            let fontSize = Math.min(width / 5, 200);
            if (text.length > 5) {
                fontSize = Math.min(width / (text.length * 0.7), 180);
            }
            tCtx.font = `bold ${fontSize}px 'Outfit', sans-serif`;
            tCtx.textAlign = 'center';
            tCtx.textBaseline = 'middle';
            tCtx.fillText(text, width / 2, height / 3.5);
        }

        const textData = tCtx.getImageData(0, 0, width, height).data;
        textCoordinates = [];
        const step = window.innerWidth < 768 ? 6 : 4; 

        for (let y = 0, y2 = textData.length; y < y2; y += 4 * step * width) {
            for (let x = 0; x < width * 4; x += 4 * step) {
                if (textData[y + x + 3] > 128) { 
                    textCoordinates.push({x: (x / 4), y: (y / (width * 4))});
                }
            }
        }

        textCoordinates.sort(() => Math.random() - 0.5);

        particles.forEach(p => p.isTextParticle = false);

        let maxTextParticles = Math.floor(particles.length * 0.50);
        let neededParticles = Math.min(textCoordinates.length, maxTextParticles);

        let shuffledParticles = [...particles].sort(() => Math.random() - 0.5);

        for (let i = 0; i < neededParticles; i++) {
            if (i >= shuffledParticles.length) break;

            let p = shuffledParticles[i];
            p.isTextParticle = true;

            if (i < textCoordinates.length) {
                p.targetX = textCoordinates[i].x;
                p.targetY = textCoordinates[i].y;
            } else if (textCoordinates.length > 0) {
                let randCoord = textCoordinates[Math.floor(Math.random() * textCoordinates.length)];
                p.targetX = randCoord.x;
                p.targetY = randCoord.y;
            }
        }
    }

    function initCanvas() {
        resize();
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        animate();
    }

    function animate() {
        ctx.fillStyle = 'rgba(2, 0, 5, 0.2)';
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }

        if (state === 'galaxy') {
            connect();
        }

        requestAnimationFrame(animate);
    }

    function connect() {
        let limit = Math.min(particles.length, 300); 
        for(let a = 0; a < limit; a++) {
            for(let b = a; b < limit; b++) {
                if (Math.abs(particles[a].z - particles[b].z) > 0.2) continue;

                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = dx * dx + dy * dy;

                if (distance < 3000) {
                    let opacity = 1 - (distance/3000);
                    ctx.strokeStyle = `rgba(216, 180, 254, ${opacity * 0.15})`;
                    ctx.lineWidth = 1 * particles[a].z;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    initCanvas();

    let currentSection = null;
    const mainMenu = document.getElementById('main-menu');
    const introScreen = document.getElementById('intro-screen');
    const bgMusic = document.getElementById('bg-music');
    bgMusic.volume = 0.25;

    introScreen.addEventListener('click', () => {
        bgMusic.play().catch(() => console.log("Audio playback blocked"));
        introScreen.classList.add('hidden');

        state = 'scattered';
        particles.forEach(p => {
            p.vx = (Math.random() - 0.5) * 40; 
            p.vy = (Math.random() - 0.5) * 40;
        });

        setTimeout(() => {
            state = 'galaxy';
        }, 800);

        setTimeout(() => {
            mainMenu.classList.remove('hidden');
        }, 1500);
    });

    const navBtns = document.querySelectorAll('.nav-btn');
    const backBtns = document.querySelectorAll('.back-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = btn.getAttribute('data-target');
            let textMap = { 'me': 'ME', 'about': 'ABOUT', 'socials': 'SOCIALS', 'games': 'GAMES' };

            state = 'scattered';
            particles.forEach(p => {
                p.vx = (Math.random() - 0.5) * 40; 
                p.vy = (Math.random() - 0.5) * 40;
            });

            setTimeout(() => {
                currentSection = target;
                getTextCoordinates(textMap[target]);
                state = 'text';
            }, 450); 

            mainMenu.classList.add('hidden');
            setTimeout(() => {
                document.getElementById(`content-${target}`).classList.remove('hidden');
            }, 2000); 
        });
    });

    const mePfp = document.getElementById('me-pfp');
    if (mePfp) {
        mePfp.addEventListener('mouseover', () => {
            if (currentSection === 'me') {
                particles.forEach(p => {
                    p.vx = (Math.random() - 0.5) * 20;
                    p.vy = (Math.random() - 0.5) * 20;
                });
                getTextCoordinates('heart');
            }
        });
        mePfp.addEventListener('mouseout', () => {
            if (currentSection === 'me') {
                particles.forEach(p => {
                    p.vx = (Math.random() - 0.5) * 20;
                    p.vy = (Math.random() - 0.5) * 20;
                });
                getTextCoordinates('ME');
            }
        });
    }

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentSection) {
                document.getElementById(`content-${currentSection}`).classList.add('hidden');
            }

            state = 'scattered';
            particles.forEach(p => {
                p.vx = (Math.random() - 0.5) * 40;
                p.vy = (Math.random() - 0.5) * 40;
            });

            setTimeout(() => {
                currentSection = null;
                state = 'galaxy';
            }, 450);

            setTimeout(() => {
                mainMenu.classList.remove('hidden');
            }, 1200);
        });
    });
});
