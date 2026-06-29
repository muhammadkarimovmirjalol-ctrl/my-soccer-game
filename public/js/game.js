// ==========================================
// ULTIMATE SOCCER LEAGUE 3D - GAME ENGINE
// Built with Three.js & Physics Physics Simulation
// ==========================================

class FootballGame {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.mode = 'penalty'; // 'penalty' or 'arcade'
        this.selectedTeam = { name: 'Real Madrid', color: 0xffffff, sec: 0xe6b800 };
        this.playerName = 'Kapitan';
        
        // Game Stats
        this.score = 0;
        this.goals = 0;
        this.shotsLeft = 5;
        this.streak = 0;
        this.wind = { x: 0, z: 0, speed: 0 };
        this.isPlaying = false;
        this.isShooting = false;
        this.isReplay = false;

        // Mouse Drag / Touch Swipe tracking
        this.dragStart = { x: 0, y: 0, time: 0 };
        this.dragCurrent = { x: 0, y: 0 };
        this.isDragging = false;

        // Init Three.js Environment
        this.initThree();
        this.buildStadium();
        this.buildGoal();
        this.buildBall();
        this.buildKeeper();
        this.buildWall();

        // Setup Events & UI
        this.setupEventListeners();
        this.loadLeaderboard();
        this.simulateLoadingScreen();

        // Start Animation Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    simulateLoadingScreen() {
        let p = 0;
        const pBar = document.getElementById('progress-bar');
        const interval = setInterval(() => {
            p += 15;
            if (pBar) pBar.style.width = p + '%';
            if (p >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.add('hidden');
                }, 400);
            }
        }, 100);
    }

    // ------------------------------------------
    // THREE.JS WORLD INITIALIZATION
    // ------------------------------------------
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a1124);
        this.scene.fog = new THREE.FogExp2(0x0a1124, 0.008);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 300);
        // Default Penalty Kick Camera Position
        this.cameraResetPos = new THREE.Vector3(0, 2.2, 16);
        this.camera.position.copy(this.cameraResetPos);
        this.camera.lookAt(0, 1.8, -15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xddeeff, 0.6);
        this.scene.add(ambientLight);

        // Stadium Main Floodlight
        this.floodLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.floodLight.position.set(20, 40, 20);
        this.floodLight.castShadow = true;
        this.floodLight.shadow.mapSize.width = 2048;
        this.floodLight.shadow.mapSize.height = 2048;
        this.floodLight.shadow.camera.near = 0.5;
        this.floodLight.shadow.camera.far = 100;
        this.floodLight.shadow.camera.left = -30;
        this.floodLight.shadow.camera.right = 30;
        this.floodLight.shadow.camera.top = 30;
        this.floodLight.shadow.camera.bottom = -30;
        this.scene.add(this.floodLight);

        // Secondary rim light for dynamic specular highlights
        const rimLight = new THREE.DirectionalLight(0x00bfff, 0.5);
        rimLight.position.set(-20, 20, -20);
        this.scene.add(rimLight);
    }

    // ------------------------------------------
    // STADIUM & PITCH BUILDER
    // ------------------------------------------
    buildStadium() {
        // Procedural Grass Canvas Texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Stripe pattern
        ctx.fillStyle = '#2d8a3e';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#257834';
        for (let i = 0; i < 512; i += 64) {
            ctx.fillRect(0, i, 512, 32);
        }

        const grassTexture = new THREE.CanvasTexture(canvas);
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(20, 40);

        const pitchGeo = new THREE.PlaneGeometry(100, 150);
        const pitchMat = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.8,
            metalness: 0.1
        });
        this.pitch = new THREE.Mesh(pitchGeo, pitchMat);
        this.pitch.rotation.x = -Math.PI / 2;
        this.pitch.receiveShadow = true;
        this.scene.add(this.pitch);

        // White Lines & Penalty Box Markings
        this.createWhiteLines();
    }

    createWhiteLines() {
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Goal line
        const lineGeo = new THREE.PlaneGeometry(30, 0.2);
        const goalLine = new THREE.Mesh(lineGeo, lineMat);
        goalLine.rotation.x = -Math.PI / 2;
        goalLine.position.set(0, 0.01, -15);
        this.scene.add(goalLine);

        // Penalty Spot
        const spotGeo = new THREE.CircleGeometry(0.25, 32);
        const spot = new THREE.Mesh(spotGeo, lineMat);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(0, 0.02, 0);
        this.scene.add(spot);
    }

    // ------------------------------------------
    // 3D GOAL POST BUILDER
    // ------------------------------------------
    buildGoal() {
        this.goalGroup = new THREE.Group();
        const postMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3, metalness: 0.8 });
        
        const postRadius = 0.12;
        const width = 7.32;
        const height = 2.44;

        // Left & Right Vertical Posts
        const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, height, 16);
        const leftPost = new THREE.Mesh(postGeo, postMat);
        leftPost.position.set(-width / 2, height / 2, -15);
        leftPost.castShadow = true;

        const rightPost = new THREE.Mesh(postGeo, postMat);
        rightPost.position.set(width / 2, height / 2, -15);
        rightPost.castShadow = true;

        // Top Crossbar
        const barGeo = new THREE.CylinderGeometry(postRadius, postRadius, width, 16);
        const crossbar = new THREE.Mesh(barGeo, postMat);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.position.set(0, height, -15);
        crossbar.castShadow = true;

        // Net Mesh Simulation
        const netGeo = new THREE.BoxGeometry(width, height, 2);
        const netMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });
        const net = new THREE.Mesh(netGeo, netMat);
        net.position.set(0, height / 2, -16);

        this.goalGroup.add(leftPost, rightPost, crossbar, net);
        this.scene.add(this.goalGroup);

        // Save Goal Bounding Box dimensions for collision checks
        this.goalBounds = {
            minX: -width / 2 + postRadius,
            maxX: width / 2 - postRadius,
            minY: 0,
            maxY: height - postRadius,
            z: -15
        };
    }

    // ------------------------------------------
    // 3D FOOTBALL BUILDER
    // ------------------------------------------
    buildBall() {
        const ballRadius = 0.24;
        const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);

        // Generate Soccer Pentagon Canvas Texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#111111';
        
        // Draw decorative pentagons
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 256, Math.random() * 256, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        const ballTexture = new THREE.CanvasTexture(canvas);
        const ballMat = new THREE.MeshStandardMaterial({
            map: ballTexture,
            roughness: 0.4,
            metalness: 0.1
        });

        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.castShadow = true;
        this.scene.add(this.ball);

        this.ballRadius = ballRadius;
        this.resetBall();
    }

    resetBall() {
        this.ball.position.set(0, this.ballRadius, 0); // At penalty spot
        this.ballVelocity = new THREE.Vector3(0, 0, 0);
        this.ballSpin = new THREE.Vector3(0, 0, 0);
        this.isShooting = false;
        this.isReplay = false;

        // Reset camera
        if (this.camera) {
            this.camera.position.copy(this.cameraResetPos);
            this.camera.lookAt(0, 1.8, -15);
        }
    }

    // ------------------------------------------
    // 3D GOALKEEPER BUILDER & AI
    // ------------------------------------------
    buildKeeper() {
        this.keeperGroup = new THREE.Group();
        
        // Torso
        const bodyGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeff00, roughness: 0.5 }); // Bright Yellow keeper kit
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.3;
        body.castShadow = true;

        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.95;
        head.castShadow = true;

        // Gloves
        const gloveGeo = new THREE.SphereGeometry(0.15, 12, 12);
        const gloveMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
        this.rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
        this.leftGlove.position.set(-0.5, 1.3, 0);
        this.rightGlove.position.set(0.5, 1.3, 0);

        this.keeperGroup.add(body, head, this.leftGlove, this.rightGlove);
        this.keeperGroup.position.set(0, 0, -14.8); // Standing on goal line
        this.scene.add(this.keeperGroup);

        this.keeperBasePos = new THREE.Vector3(0, 0, -14.8);
        this.keeperVelocity = new THREE.Vector3(0, 0, 0);
    }

    resetKeeper() {
        this.keeperGroup.position.copy(this.keeperBasePos);
        this.keeperVelocity.set(0, 0, 0);
        this.leftGlove.position.set(-0.5, 1.3, 0);
        this.rightGlove.position.set(0.5, 1.3, 0);
    }

    // AI Dive Decision
    triggerKeeperDive(targetX, targetY) {
        // Difficulty scaling based on streak
        const reactionDelay = Math.max(100, 300 - this.streak * 30); 

        setTimeout(() => {
            // Predict dive trajectory towards target with slight inaccuracy
            const inaccuracy = (Math.random() - 0.5) * 1.2;
            const diveX = targetX + inaccuracy;
            const diveY = Math.max(0.5, targetY);

            const diveDirX = diveX - this.keeperGroup.position.x;
            const diveDirY = diveY - 1.2;

            this.keeperVelocity.set(diveDirX * 3.5, diveDirY * 2.8, 0);
            
            // Extend arms
            this.leftGlove.position.x = diveX < 0 ? -1.2 : -0.3;
            this.rightGlove.position.x = diveX > 0 ? 1.2 : 0.3;

            // Audio reaction
            gameAudio.playCrowdRoar(0.8);
        }, reactionDelay);
    }

    // ------------------------------------------
    // 3D DEFENSIVE WALL BUILDER
    // ------------------------------------------
    buildWall() {
        this.wallGroup = new THREE.Group();
        const playerMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 }); // Opposition kit

        for (let i = 0; i < 3; i++) {
            const pGroup = new THREE.Group();
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.7, 12), playerMat);
            body.position.y = 0.85;
            body.castShadow = true;
            
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: 0x8d5524 }));
            head.position.y = 1.8;
            head.castShadow = true;

            pGroup.add(body, head);
            pGroup.position.x = (i - 1) * 0.65;
            this.wallGroup.add(pGroup);
        }

        this.wallGroup.position.set(1.5, 0, -6); // 6 meters ahead
        this.wallGroup.visible = false;
        this.scene.add(this.wallGroup);
    }

    updateWall() {
        // Show wall only when streak >= 2 or higher levels
        if (this.streak >= 2) {
            this.wallGroup.visible = true;
            this.wallGroup.position.x = (Math.random() - 0.5) * 3;
        } else {
            this.wallGroup.visible = false;
        }
    }

    // ------------------------------------------
    // EVENT LISTENERS & USER INPUT CONTROLS
    // ------------------------------------------
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const dom = this.renderer.domElement;

        // Pointer / Touch Swipe Events for Shot Control
        dom.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        dom.addEventListener('pointermove', (e) => this.onPointerMove(e));
        dom.addEventListener('pointerup', (e) => this.onPointerUp(e));

        // UI Buttons
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('save-score-btn').addEventListener('click', () => this.saveScore());

        // Sound Toggle
        document.getElementById('sound-toggle-btn').addEventListener('click', () => {
            const muted = gameAudio.toggleSound();
            document.getElementById('sound-toggle-btn').innerHTML = muted ? 
                '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        });

        // Team Selector Buttons
        document.querySelectorAll('.team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.team-btn').forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.selectedTeam.name = target.dataset.team;
                document.getElementById('hud-home-name').innerText = target.dataset.team.toUpperCase();
            });
        });

        // Mode Selector Cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.mode = target.dataset.mode;
            });
        });
    }

    onPointerDown(e) {
        if (!this.isPlaying || this.isShooting || this.shotsLeft <= 0) return;
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.dragStart.time = performance.now();
    }

    onPointerMove(e) {
        if (!this.isDragging) return;
        this.dragCurrent.x = e.clientX;
        this.dragCurrent.y = e.clientY;
    }

    onPointerUp(e) {
        if (!this.isDragging || this.isShooting) return;
        this.isDragging = false;

        const duration = (performance.now() - this.dragStart.time) / 1000;
        const deltaX = e.clientX - this.dragStart.x;
        const deltaY = e.clientY - this.dragStart.y; // Upwards swipe is negative Y

        // Minimum swipe threshold check
        if (deltaY < -20 && duration < 0.8) {
            this.executeShot(deltaX, deltaY, duration);
        }
    }

    // ------------------------------------------
    // SHOT PHYSICS ENGINE (BALL VELOCITY & CURVE)
    // ------------------------------------------
    executeShot(deltaX, deltaY, duration) {
        this.isShooting = true;
        gameAudio.playKick();

        // Calculate Speed & Power
        const power = Math.min(28, Math.abs(deltaY) / duration / 18);
        
        // Target direction calculation towards goal at z = -15
        const targetX = (deltaX / window.innerWidth) * 14;
        const targetY = Math.min(3.2, (Math.abs(deltaY) / window.innerHeight) * 6);

        // Ball Initial Velocities
        this.ballVelocity.x = targetX * 0.85;
        this.ballVelocity.y = Math.max(2.5, targetY * 1.1);
        this.ballVelocity.z = -power; // Forward towards goal

        // Curve Spin (Magnus Effect) based on horizontal swipe deviation
        this.ballSpin.x = (deltaX * 0.05);

        // Trigger Goalkeeper Dive AI
        this.triggerKeeperDive(targetX, targetY);

        // Jump Defensive Wall if active
        if (this.wallGroup.visible) {
            this.wallJump();
        }

        // Show Commentary
        this.showCommentary("Zarba berildi! Ball uchmoqda... 🔥");
    }

    wallJump() {
        let jumpHeight = 0;
        const jumpInterval = setInterval(() => {
            jumpHeight += 0.08;
            this.wallGroup.position.y = Math.sin(jumpHeight) * 0.7;
            if (jumpHeight >= Math.PI) {
                clearInterval(jumpInterval);
                this.wallGroup.position.y = 0;
            }
        }, 20);
    }

    // ------------------------------------------
    // GAMEPLAY LOOPS & ANIMATION
    // ------------------------------------------
    animate() {
        requestAnimationFrame(this.animate);

        const dt = 0.016; // approx 60fps frame delta

        if (this.isShooting) {
            // Apply Physics & Gravity
            this.ball.position.addScaledVector(this.ballVelocity, dt);
            this.ballVelocity.y -= 9.8 * dt * 0.4; // Gravity

            // Apply Magnus Curve Effect
            this.ballVelocity.x += this.ballSpin.x * dt;

            // Ball Rotation animation
            this.ball.rotation.x += this.ballVelocity.z * dt;
            this.ball.rotation.y += this.ballVelocity.x * dt;

            // Goalkeeper Movement physics
            this.keeperGroup.position.addScaledVector(this.keeperVelocity, dt);

            // Dynamic Follow Camera during Shot
            if (!this.isReplay) {
                this.camera.position.z = Math.max(-5, this.ball.position.z + 8);
                this.camera.position.x = this.ball.position.x * 0.3;
                this.camera.lookAt(this.ball.position);
            }

            // Collisions Checks
            this.checkCollisions();
        }

        this.renderer.render(this.scene, this.camera);
    }

    // ------------------------------------------
    // COLLISION DETECTION & GOAL LOGIC
    // ------------------------------------------
    checkCollisions() {
        const b = this.ball.position;

        // 1. Check Goalkeeper Save Collision
        const keeperPos = this.keeperGroup.position;
        const distToKeeper = b.distanceTo(keeperPos.clone().add(new THREE.Vector3(0, 1.2, 0)));
        if (distToKeeper < 0.9) {
            this.handleShotResult(false, "DARVOZABON DAHSHATLI SEYV AMALGA OSHIRDI! 🧤");
            gameAudio.playPostHit();
            return;
        }

        // 2. Check Wall Collision
        if (this.wallGroup.visible && Math.abs(b.z - this.wallGroup.position.z) < 0.4) {
            if (Math.abs(b.x - this.wallGroup.position.x) < 1.2 && b.y < 2.0) {
                this.handleShotResult(false, "TO'P JONLI DEVORGA TEGDI! 🛑");
                gameAudio.playKick();
                return;
            }
        }

        // 3. Check Goal Crossbar / Posts Hit
        if (Math.abs(b.z - this.goalBounds.z) < 0.3) {
            // Post checks
            if ((Math.abs(b.x - this.goalBounds.minX) < 0.3 || Math.abs(b.x - this.goalBounds.maxX) < 0.3) && b.y < 2.6) {
                this.handleShotResult(false, "USTUN! DARVOZA USTUNI ZARBANI QAYTARDI! 💥");
                gameAudio.playPostHit();
                return;
            }

            // 4. Check GOAL Scored!
            if (b.x > this.goalBounds.minX && b.x < this.goalBounds.maxX &&
                b.y > this.goalBounds.minY && b.y < this.goalBounds.maxY) {
                this.handleShotResult(true, "GOOOOOOOOL! DAHS HATLI ZARBA! ⚽🔥");
                return;
            } else {
                // Out / Missed Goal
                this.handleShotResult(false, "NOANIQ ZARBA! TO'P MAYDON TASHQARISIGA CHIQDI ❌");
                return;
            }
        }

        // 5. Ball hit ground or went too far
        if (b.y <= this.ballRadius || b.z < -20) {
            this.handleShotResult(false, "DARVOZA YONIDAN O'TIB KETDI 💨");
        }
    }

    handleShotResult(isGoal, message) {
        this.isShooting = false;
        this.shotsLeft--;
        document.getElementById('shots-left-count').innerText = this.shotsLeft;

        if (isGoal) {
            this.goals++;
            this.streak++;
            const pointsGained = 100 + (this.streak * 50);
            this.score += pointsGained;

            document.getElementById('hud-home-score').innerText = this.goals;
            document.getElementById('current-score-count').innerText = this.score;
            document.getElementById('streak-count').innerText = 'x' + this.streak;

            // Audio & Replay
            gameAudio.playGoalSound();
            this.triggerGoalReplayAnimation();
            this.triggerConfetti();
        } else {
            this.streak = 0;
            document.getElementById('streak-count').innerText = 'x0';
            gameAudio.playWhistle();
        }

        this.showCommentary(message);

        // Prepare next shot or Game Over
        setTimeout(() => {
            if (this.shotsLeft > 0) {
                this.resetBall();
                this.resetKeeper();
                this.updateWall();
            } else {
                this.endGame();
            }
        }, isGoal ? 3500 : 2000);
    }

    triggerGoalReplayAnimation() {
        this.isReplay = true;
        const goalOverlay = document.getElementById('goal-announcement');
        goalOverlay.classList.remove('hidden');

        // Cinematic Panning Slow-Mo Camera
        this.camera.position.set(5, 1.5, -12);
        this.camera.lookAt(this.ball.position);

        setTimeout(() => {
            goalOverlay.classList.add('hidden');
        }, 3000);
    }

    triggerConfetti() {
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    showCommentary(text) {
        const banner = document.getElementById('commentary-banner');
        const txtEl = document.getElementById('commentary-text');
        txtEl.innerText = text;
        banner.classList.remove('hidden');

        setTimeout(() => {
            banner.classList.add('hidden');
        }, 3000);
    }

    // ------------------------------------------
    // GAME LIFECYCLE MANAGEMENT
    // ------------------------------------------
    startGame() {
        this.score = 0;
        this.goals = 0;
        this.shotsLeft = 5;
        this.streak = 0;
        this.isPlaying = true;

        document.getElementById('hud-home-score').innerText = '0';
        document.getElementById('hud-away-score').innerText = '0';
        document.getElementById('current-score-count').innerText = '0';
        document.getElementById('shots-left-count').innerText = '5';
        document.getElementById('streak-count').innerText = 'x0';

        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');

        this.resetBall();
        this.resetKeeper();
        this.updateWall();
        gameAudio.playWhistle();
    }

    endGame() {
        this.isPlaying = false;
        document.getElementById('game-hud').classList.add('hidden');
        document.getElementById('game-over-modal').classList.remove('hidden');

        document.getElementById('final-score-val').innerText = this.score;
        document.getElementById('final-goals-val').innerText = this.goals;
    }

    // ------------------------------------------
    // REST API LEADERBOARD INTEGRATION
    // ------------------------------------------
    async loadLeaderboard() {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                const data = await res.json();
                this.renderLeaderboard(data);
            }
        } catch (err) {
            console.log('Leaderboard offline or dev mode');
        }
    }

    renderLeaderboard(list) {
        const container = document.getElementById('leaderboard-list');
        if (!container) return;
        container.innerHTML = '';

        list.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'lb-item';
            row.innerHTML = `
                <span class="lb-rank">#${index + 1}</span>
                <span class="lb-name">${item.name} (${item.club})</span>
                <span class="lb-score">${item.score} pts</span>
            `;
            container.appendChild(row);
        });
    }

    async saveScore() {
        const nameInput = document.getElementById('player-name-input');
        const name = nameInput.value.trim() || 'Kapitan';
        
        try {
            const res = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score: this.score, club: this.selectedTeam.name })
            });

            if (res.ok) {
                const data = await res.json();
                this.renderLeaderboard(data.leaderboard);
                alert('Natijangiz muvaffaqiyatli saqlandi! 🏆');
                document.getElementById('game-over-modal').classList.add('hidden');
                document.getElementById('main-menu').classList.remove('hidden');
            }
        } catch (err) {
            alert('Xatolik yuz berdi. Backend bilan aloqani tekshiring.');
        }
    }
}

// Instantiate game on window load
window.addEventListener('load', () => {
    window.gameInstance = new FootballGame();
});
