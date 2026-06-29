// ===================================================
// ULTRA-REALISTIC 3D FOOTBALL MATCH ENGINE v2.0
// Featuring Grand Stadium, Cameramen, Animated Crowd, 360° Physics & Socket.io
// ===================================================

class UltraFootballMatch {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.mode = 'full_match'; // 'full_match' or 'online'
        this.weather = 'night'; // 'night', 'sunny', 'rain'
        this.selectedTeam = { name: 'Real Madrid', color: 0xffffff, hex: '#ffffff' };
        this.playerName = 'Kapitan';

        // Match States
        this.homeScore = 0;
        this.awayScore = 0;
        this.matchTime = 0; // seconds
        this.isPlaying = false;
        this.isOnline = false;
        this.stamina = 100;
        
        // Input Controls State
        this.keys = { w: false, a: false, s: false, d: false, space: false, k: false };
        
        // Soccer Field Dimensions
        this.fieldWidth = 70;
        this.fieldLength = 110;

        // Init Engine
        this.initSocket();
        this.initThree();
        this.buildStadium();
        this.buildCrowd();
        this.buildCameramen();
        this.buildGoals();
        this.buildBall();
        this.buildPlayers();

        // Setup Events & HUD
        this.setupEventListeners();
        this.setupRadar();
        this.loadLeaderboard();
        this.simulateLoadingScreen();

        // Start Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    simulateLoadingScreen() {
        let p = 0;
        const pBar = document.getElementById('progress-bar');
        const interval = setInterval(() => {
            p += 20;
            if (pBar) pBar.style.width = p + '%';
            if (p >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.add('hidden');
                }, 400);
            }
        }, 100);
    }

    // ---------------------------------------------------
    // SOCKET.IO REAL-TIME MULTIPLAYER INTEGRATION
    // ---------------------------------------------------
    initSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();

            this.socket.on('match_waiting', (data) => {
                document.getElementById('match-waiting-modal').classList.remove('hidden');
            });

            this.socket.on('start_online_match', (data) => {
                document.getElementById('match-waiting-modal').classList.add('hidden');
                this.isOnline = true;
                this.startMatch();
            });

            this.socket.on('opponent_move', (data) => {
                if (this.awayPlayer) {
                    this.awayPlayer.position.set(data.x, data.y, data.z);
                    this.awayPlayer.rotation.y = data.rot;
                }
            });

            this.socket.on('opponent_ball_sync', (data) => {
                if (this.ball && !this.hasBallControl) {
                    this.ball.position.set(data.x, data.y, data.z);
                }
            });
        }
    }

    // ---------------------------------------------------
    // THREE.JS ENVIRONMENT SETUP
    // ---------------------------------------------------
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070a12);
        this.scene.fog = new THREE.FogExp2(0x070a12, 0.005);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
        this.cameraOffset = new THREE.Vector3(0, 14, 22); // Broadcast Tele-camera view

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.6);
        this.scene.add(this.ambientLight);

        // Stadium Main Floodlights
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
        this.sunLight.position.set(40, 60, 30);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 200;
        this.sunLight.shadow.camera.left = -60;
        this.sunLight.shadow.camera.right = 60;
        this.sunLight.shadow.camera.top = 60;
        this.sunLight.shadow.camera.bottom = -60;
        this.scene.add(this.sunLight);
    }

    // ---------------------------------------------------
    // ULTRA-REALISTIC GRAND STADIUM BUILDER
    // ---------------------------------------------------
    buildStadium() {
        // Pitch Texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#237d35';
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.fillStyle = '#1b692b';
        for (let i = 0; i < 1024; i += 64) {
            ctx.fillRect(0, i, 1024, 32);
        }

        const grassTex = new THREE.CanvasTexture(canvas);
        grassTex.wrapS = THREE.RepeatWrapping;
        grassTex.wrapT = THREE.RepeatWrapping;
        grassTex.repeat.set(12, 20);

        const pitchMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.8 });
        const pitchGeo = new THREE.PlaneGeometry(this.fieldWidth + 20, this.fieldLength + 30);
        this.pitch = new THREE.Mesh(pitchGeo, pitchMat);
        this.pitch.rotation.x = -Math.PI / 2;
        this.pitch.receiveShadow = true;
        this.scene.add(this.pitch);

        // Pitch Markings
        this.buildPitchMarkings();

        // 3-Tier Surrounding Grandstands (Stadion Tribunasi va O'rindiqlar)
        this.buildGrandstands();
    }

    buildPitchMarkings() {
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Touchlines
        const perimeterGeo = new THREE.RingGeometry(0.1, 0.2, 4); // boundary helper
        const centerCircleGeo = new THREE.RingGeometry(9.15, 9.35, 64);
        const centerCircle = new THREE.Mesh(centerCircleGeo, lineMat);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.y = 0.02;
        this.scene.add(centerCircle);

        // Center Spot
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), lineMat);
        spot.rotation.x = -Math.PI / 2;
        spot.position.y = 0.02;
        this.scene.add(spot);
    }

    buildGrandstands() {
        const standMat = new THREE.MeshStandardMaterial({ color: 0x1a233a, roughness: 0.6 });
        const seatColors = [0xe63946, 0x1d3557, 0x457b9d, 0xf4a261, 0x2a9d8f];

        // Create 4 large surrounding stands (East, West, North, South)
        const sides = [
            { pos: [0, 12, -this.fieldLength / 2 - 25], rot: 0, w: 90, h: 25, d: 30 }, // North
            { pos: [0, 12, this.fieldLength / 2 + 25], rot: Math.PI, w: 90, h: 25, d: 30 }, // South
            { pos: [-this.fieldWidth / 2 - 25, 12, 0], rot: Math.PI / 2, w: 130, h: 25, d: 30 }, // West
            { pos: [this.fieldWidth / 2 + 25, 12, 0], rot: -Math.PI / 2, w: 130, h: 25, d: 30 } // East
        ];

        sides.forEach(s => {
            const standGroup = new THREE.Group();
            
            // Tier stepped structure
            for (let tier = 0; tier < 3; tier++) {
                const stepGeo = new THREE.BoxGeometry(s.w, 8, 10);
                const step = new THREE.Mesh(stepGeo, standMat);
                step.position.set(0, tier * 7, -tier * 8);
                step.receiveShadow = true;
                standGroup.add(step);

                // Add seat block color strips
                const seatGeo = new THREE.BoxGeometry(s.w * 0.95, 0.4, 8);
                const seatMat = new THREE.MeshStandardMaterial({ color: seatColors[tier % seatColors.length] });
                const seatBlock = new THREE.Mesh(seatGeo, seatMat);
                seatBlock.position.set(0, tier * 7 + 4.2, -tier * 8);
                standGroup.add(seatBlock);
            }

            standGroup.position.set(...s.pos);
            standGroup.rotation.y = s.rot;
            this.scene.add(standGroup);
        });
    }

    // ---------------------------------------------------
    // ANIMATED SPECTATOR CROWD (TOMOSHABINLAR)
    // ---------------------------------------------------
    buildCrowd() {
        this.crowdParticles = [];
        const crowdGroup = new THREE.Group();
        const crowdColors = [0xffffff, 0xff0000, 0x0000ff, 0xffff00, 0x00ff00, 0xffa500];

        // Spawn 600 dynamic spectator meshes on stands
        for (let i = 0; i < 600; i++) {
            const pGeo = new THREE.BoxGeometry(0.4, 0.7, 0.4);
            const pMat = new THREE.MeshBasicMaterial({ color: crowdColors[Math.floor(Math.random() * crowdColors.length)] });
            const spectator = new THREE.Mesh(pGeo, pMat);

            // Random position on surrounding grandstands
            const side = Math.floor(Math.random() * 4);
            const tier = Math.floor(Math.random() * 3);
            const offset = (Math.random() - 0.5) * 80;

            if (side === 0) spectator.position.set(offset, 6 + tier * 7, -this.fieldLength / 2 - 18 - tier * 8);
            else if (side === 1) spectator.position.set(offset, 6 + tier * 7, this.fieldLength / 2 + 18 + tier * 8);
            else if (side === 2) spectator.position.set(-this.fieldWidth / 2 - 18 - tier * 8, 6 + tier * 7, offset);
            else spectator.position.set(this.fieldWidth / 2 + 18 + tier * 8, 6 + tier * 7, offset);

            spectator.userData = { initialY: spectator.position.y, phase: Math.random() * Math.PI * 2 };
            crowdGroup.add(spectator);
            this.crowdParticles.push(spectator);
        }
        this.scene.add(crowdGroup);
    }

    updateCrowd(time) {
        // Animate spectators jumping and cheering
        this.crowdParticles.forEach(p => {
            p.position.y = p.userData.initialY + Math.sin(time * 6 + p.userData.phase) * 0.3;
        });
    }

    // ---------------------------------------------------
    // PROFESSIONAL 3D CAMERAMEN (KAMERAMANLAR)
    // ---------------------------------------------------
    buildCameramen() {
        const camGroup = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });

        const positions = [
            [-this.fieldWidth / 2 - 3, 0, -this.fieldLength / 2 + 5],
            [this.fieldWidth / 2 + 3, 0, -this.fieldLength / 2 + 5],
            [-this.fieldWidth / 2 - 3, 0, this.fieldLength / 2 - 5],
            [this.fieldWidth / 2 + 3, 0, this.fieldLength / 2 - 5],
            [0, 0, -this.fieldLength / 2 - 5] // Behind goal broadcast cam
        ];

        positions.forEach(pos => {
            const guy = new THREE.Group();
            
            // Cameraman body
            const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 12), bodyMat);
            body.position.y = 0.8;
            body.castShadow = true;

            // Tripod & Heavy Broadcast Camera
            const cameraBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.8), metalMat);
            cameraBox.position.set(0, 1.6, 0.3);
            cameraBox.castShadow = true;

            const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16), metalMat);
            lens.rotation.x = Math.PI / 2;
            lens.position.set(0, 1.6, 0.8);

            guy.add(body, cameraBox, lens);
            guy.position.set(...pos);
            guy.lookAt(0, 1, 0); // Face center field
            camGroup.add(guy);
        });

        this.scene.add(camGroup);
    }

    // ---------------------------------------------------
    // 3D GOALS & NETS
    // ---------------------------------------------------
    buildGoals() {
        this.goalGroup = new THREE.Group();
        const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.8 });
        
        const width = 7.32;
        const height = 2.44;

        [-this.fieldLength / 2, this.fieldLength / 2].forEach((zPos, i) => {
            const goal = new THREE.Group();
            
            const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, height, 16), postMat);
            leftPost.position.set(-width / 2, height / 2, 0);
            
            const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, height, 16), postMat);
            rightPost.position.set(width / 2, height / 2, 0);

            const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, width, 16), postMat);
            crossbar.rotation.z = Math.PI / 2;
            crossbar.position.set(0, height, 0);

            const net = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, 2),
                new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 })
            );
            net.position.set(0, height / 2, i === 0 ? -1 : 1);

            goal.add(leftPost, rightPost, crossbar, net);
            goal.position.set(0, 0, zPos);
            if (i === 1) goal.rotation.y = Math.PI;
            this.goalGroup.add(goal);
        });

        this.scene.add(this.goalGroup);
    }

    // ---------------------------------------------------
    // SINGLE MATCH FOOTBALL (MAYDONDA YAGONA TO'P)
    // ---------------------------------------------------
    buildBall() {
        const ballRadius = 0.24;
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, 22, 0, Math.PI * 2); ctx.fill();
        }

        const ballTex = new THREE.CanvasTexture(canvas);
        this.ball = new THREE.Mesh(
            new THREE.SphereGeometry(ballRadius, 32, 32),
            new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.4 })
        );
        this.ball.castShadow = true;
        this.scene.add(this.ball);

        this.ballRadius = ballRadius;
        this.ballVelocity = new THREE.Vector3(0, 0, 0);
        this.resetBall();
    }

    resetBall() {
        this.ball.position.set(0, this.ballRadius, 0);
        this.ballVelocity.set(0, 0, 0);
        this.hasBallControl = false;
    }

    // ---------------------------------------------------
    // 360° PLAYERS & AI TEAMS BUILDER
    // ---------------------------------------------------
    buildPlayers() {
        // User Main Player (Kapitan)
        this.homePlayer = this.createPlayerMesh(0x00ff88, "Kapitan");
        this.homePlayer.position.set(0, 0, 5);
        this.scene.add(this.homePlayer);

        // AI Rival Player
        this.awayPlayer = this.createPlayerMesh(0xff0055, "Rival Bot");
        this.awayPlayer.position.set(0, 0, -10);
        this.scene.add(this.awayPlayer);
    }

    createPlayerMesh(kitColorHex, labelText) {
        const pGroup = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: kitColorHex, roughness: 0.4 });

        // Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 1.4, 16), bodyMat);
        torso.position.y = 0.9;
        torso.castShadow = true;

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
        head.position.y = 1.8;
        head.castShadow = true;

        pGroup.add(torso, head);
        return pGroup;
    }

    // ---------------------------------------------------
    // USER CONTROLS & 360° MOVEMENT LOGIC
    // ---------------------------------------------------
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w' || e.key === 'ArrowUp') this.keys.w = true;
            if (k === 'a' || e.key === 'ArrowLeft') this.keys.a = true;
            if (k === 's' || e.key === 'ArrowDown') this.keys.s = true;
            if (k === 'd' || e.key === 'ArrowRight') this.keys.d = true;
            if (e.code === 'Space') { this.keys.space = true; this.executeKick(); }
            if (k === 'k' || e.shiftKey) { this.keys.k = true; this.executePass(); }
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w' || e.key === 'ArrowUp') this.keys.w = false;
            if (k === 'a' || e.key === 'ArrowLeft') this.keys.a = false;
            if (k === 's' || e.key === 'ArrowDown') this.keys.s = false;
            if (k === 'd' || e.key === 'ArrowRight') this.keys.d = false;
            if (e.code === 'Space') this.keys.space = false;
            if (k === 'k') this.keys.k = false;
        });

        document.getElementById('start-game-btn').addEventListener('click', () => {
            if (this.mode === 'online') {
                this.socket.emit('find_match', { name: this.playerName, team: this.selectedTeam.name });
            } else {
                this.startMatch();
            }
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => this.startMatch());
        document.getElementById('save-score-btn').addEventListener('click', () => this.saveScore());

        // Weather selector
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.setWeather(e.currentTarget.dataset.weather);
            });
        });

        // Mode cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.mode = e.currentTarget.dataset.mode;
            });
        });
    }

    setWeather(type) {
        this.weather = type;
        if (type === 'sunny') {
            this.scene.background.setHex(0x87ceeb);
            this.scene.fog.color.setHex(0x87ceeb);
            this.sunLight.intensity = 1.6;
        } else if (type === 'rain') {
            this.scene.background.setHex(0x2c3e50);
            this.scene.fog.color.setHex(0x2c3e50);
            this.sunLight.intensity = 0.8;
        } else {
            this.scene.background.setHex(0x070a12);
            this.scene.fog.color.setHex(0x070a12);
            this.sunLight.intensity = 1.3;
        }
    }

    // ---------------------------------------------------
    // GAME LOOPS & 360° PHYSICS UPDATES
    // ---------------------------------------------------
    animate(timestamp) {
        requestAnimationFrame(this.animate);
        const dt = 0.016;
        const time = timestamp * 0.001;

        if (this.isPlaying) {
            this.updatePlayerMovement(dt);
            this.updateAIOpponent(dt);
            this.updateBallPhysics(dt);
            this.updateCrowd(time);
            this.updateCamera();
            this.updateRadar();
        }

        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerMovement(dt) {
        const moveDir = new THREE.Vector3(0, 0, 0);
        if (this.keys.w) moveDir.z -= 1;
        if (this.keys.s) moveDir.z += 1;
        if (this.keys.a) moveDir.x -= 1;
        if (this.keys.d) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            const speed = 11;
            this.homePlayer.position.addScaledVector(moveDir, speed * dt);

            // 360° Smooth Rotation
            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            this.homePlayer.rotation.y = targetAngle;

            // Socket sync
            if (this.isOnline && this.socket) {
                this.socket.emit('player_move', {
                    x: this.homePlayer.position.x,
                    y: this.homePlayer.position.y,
                    z: this.homePlayer.position.z,
                    rot: this.homePlayer.rotation.y
                });
            }
        }

        // Keep inside field bounds
        this.homePlayer.position.x = THREE.MathUtils.clamp(this.homePlayer.position.x, -this.fieldWidth / 2 + 1, this.fieldWidth / 2 - 1);
        this.homePlayer.position.z = THREE.MathUtils.clamp(this.homePlayer.position.z, -this.fieldLength / 2 + 1, this.fieldLength / 2 - 1);
    }

    updateAIOpponent(dt) {
        if (this.isOnline) return; // Controlled by online opponent socket

        // AI pursues the ball
        const dirToBall = this.ball.position.clone().sub(this.awayPlayer.position);
        dirToBall.y = 0;

        if (dirToBall.length() > 0.8) {
            dirToBall.normalize();
            this.awayPlayer.position.addScaledVector(dirToBall, 8.5 * dt);
            this.awayPlayer.rotation.y = Math.atan2(dirToBall.x, dirToBall.z);
        }
    }

    updateBallPhysics(dt) {
        // Dribble Attachment Logic (Single ball control)
        const distHome = this.ball.position.distanceTo(this.homePlayer.position);
        const distAway = this.ball.position.distanceTo(this.awayPlayer.position);

        if (distHome < 1.2 && this.ballVelocity.length() < 3) {
            // Player is dribbling the ball
            const frontOffset = new THREE.Vector3(0, 0, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.homePlayer.rotation.y);
            this.ball.position.copy(this.homePlayer.position).add(frontOffset);
            this.ball.position.y = this.ballRadius;
            this.hasBallControl = true;
        } else {
            // Free ball physics
            this.ball.position.addScaledVector(this.ballVelocity, dt);
            this.ballVelocity.multiplyScalar(0.97); // Friction

            if (this.ball.position.y > this.ballRadius) {
                this.ballVelocity.y -= 9.8 * dt; // Gravity
            } else {
                this.ball.position.y = this.ballRadius;
                this.ballVelocity.y = -this.ballVelocity.y * 0.4; // Bounce
            }
        }

        // Check Goal Scored
        if (Math.abs(this.ball.position.x) < 3.66) {
            if (this.ball.position.z < -this.fieldLength / 2) {
                this.handleGoal(true); // Home goal
            } else if (this.ball.position.z > this.fieldLength / 2) {
                this.handleGoal(false); // Away goal
            }
        }
    }

    executeKick() {
        if (this.hasBallControl || this.ball.position.distanceTo(this.homePlayer.position) < 1.6) {
            gameAudio.playKick();
            const kickDir = new THREE.Vector3(0, 0.3, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.homePlayer.rotation.y);
            this.ballVelocity.copy(kickDir.multiplyScalar(26));
            this.hasBallControl = false;
        }
    }

    executePass() {
        if (this.hasBallControl || this.ball.position.distanceTo(this.homePlayer.position) < 1.6) {
            gameAudio.playKick();
            const passDir = new THREE.Vector3(0, 0.1, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.homePlayer.rotation.y);
            this.ballVelocity.copy(passDir.multiplyScalar(15));
            this.hasBallControl = false;
        }
    }

    handleGoal(isHome) {
        if (isHome) this.homeScore++;
        else this.awayScore++;

        document.getElementById('hud-home-score').innerText = this.homeScore;
        document.getElementById('hud-away-score').innerText = this.awayScore;

        gameAudio.playGoalSound();
        document.getElementById('goal-announcement').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('goal-announcement').classList.add('hidden');
            this.resetBall();
            this.homePlayer.position.set(0, 0, 5);
            this.awayPlayer.position.set(0, 0, -10);
        }, 3000);
    }

    updateCamera() {
        // Dynamic follow camera trailing behind home player
        const targetCamPos = this.homePlayer.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(targetCamPos, 0.1);
        this.camera.lookAt(this.homePlayer.position.x, 1.5, this.homePlayer.position.z - 4);
    }

    // ---------------------------------------------------
    // TACTICAL RADAR MINI-MAP
    // ---------------------------------------------------
    setupRadar() {
        this.radarCanvas = document.getElementById('radar-canvas');
        if (this.radarCanvas) this.radarCtx = this.radarCanvas.getContext('2d');
    }

    updateRadar() {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Map scale factors
        const mapX = (x) => (x + this.fieldWidth / 2) / this.fieldWidth * w;
        const mapZ = (z) => (z + this.fieldLength / 2) / this.fieldLength * h;

        // Draw Home Player (Green Dot)
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(mapX(this.homePlayer.position.x), mapZ(this.homePlayer.position.z), 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw Away Player (Red Dot)
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(mapX(this.awayPlayer.position.x), mapZ(this.awayPlayer.position.z), 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw Ball (White Dot)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mapX(this.ball.position.x), mapZ(this.ball.position.z), 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---------------------------------------------------
    // MATCH LIFECYCLE
    // ---------------------------------------------------
    startMatch() {
        this.homeScore = 0;
        this.awayScore = 0;
        this.isPlaying = true;

        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');

        this.resetBall();
        gameAudio.playWhistle();
    }

    async loadLeaderboard() {
        try {
            const res = await fetch('/api/leaderboard');
            if (res.ok) {
                const data = await res.json();
                const container = document.getElementById('leaderboard-list');
                if (container) {
                    container.innerHTML = '';
                    data.forEach((item, index) => {
                        const row = document.createElement('div');
                        row.className = 'lb-item';
                        row.innerHTML = `<span class="lb-rank">#${index + 1}</span><span class="lb-name">${item.name} (${item.club})</span><span class="lb-score">${item.score} pts</span>`;
                        container.appendChild(row);
                    });
                }
            }
        } catch (e) {}
    }

    async saveScore() {
        const nameInput = document.getElementById('player-name-input');
        const name = nameInput.value.trim() || 'Kapitan';
        try {
            await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score: this.homeScore * 150, club: this.selectedTeam.name })
            });
            alert('Natijangiz muvaffaqiyatli saqlandi! 🏆');
            document.getElementById('game-over-modal').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        } catch (e) {}
    }
}

window.addEventListener('load', () => {
    window.matchInstance = new UltraFootballMatch();
});
