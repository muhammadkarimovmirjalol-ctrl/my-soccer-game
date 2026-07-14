// ===================================================
// ULTRA-REALISTIC 3D EA FC MOBILE MATCH ENGINE v3.0
// Featuring Walkout Intro, Coach Whistle, Brand Ads, Foul/Card Rules, and FC HUD
// ===================================================

class UltraFootballMatch {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.mode = 'full_match'; // 'full_match' or 'online'
        this.weather = 'night'; // 'night', 'sunny', 'rain'
        this.selectedTeam = 'POR'; // POR, ESP, BRA, USA
        this.selectedTeamName = 'PORTUGAL';
        this.opponentTeamName = 'BRAZIL';

        // Match States
        this.homeScore = 0;
        this.awayScore = 0;
        this.matchTime = 0; // seconds
        this.isPlaying = false;
        this.isOnline = false;
        this.stamina = 100;
        this.isWalkout = true;
        this.walkoutTimer = 0;

        // Player & Ball Control States
        this.hasBallControl = false;
        this.lastKickedBy = null; // 'home' or 'away'
        this.activePlayer = null;
        this.cardCount = { homeYellow: 0, homeRed: 0, awayYellow: 0, awayRed: 0 };
        this.matchPhase = 'walkout'; // 'walkout', 'play', 'foul', 'penalty', 'offside'

        // Touch Joystick state
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0,
            maxLimit: 50
        };

        // Keyboard Controls State
        this.keys = { w: false, a: false, s: false, d: false };

        // Field Specs
        this.fieldWidth = 70;
        this.fieldLength = 110;

        // Init
        this.initSocket();
        this.initThree();
        this.buildStadium();
        this.buildCrowd();
        this.buildCameramen();
        this.buildAdBoards();
        this.buildGoals();
        this.buildBall();
        this.buildCoach();
        this.buildPlayers();

        this.setupEventListeners();
        this.setupJoystick();
        this.setupRadar();
        this.loadLeaderboard();
        this.simulateLoadingScreen();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    simulateLoadingScreen() {
        let p = 0;
        const pBar = document.getElementById('progress-bar');
        const interval = setInterval(() => {
            p += 25;
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
    // MULTIPLAYER SYNC
    // ---------------------------------------------------
    initSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.socket.on('match_waiting', () => {
                document.getElementById('match-waiting-modal').classList.remove('hidden');
            });
            this.socket.on('start_online_match', (data) => {
                document.getElementById('match-waiting-modal').classList.add('hidden');
                this.isOnline = true;
                this.startWalkoutCinematic();
            });
            this.socket.on('opponent_move', (data) => {
                if (this.awayTeamPlayers && this.awayTeamPlayers[0]) {
                    this.awayTeamPlayers[0].position.set(data.x, data.y, data.z);
                    this.awayTeamPlayers[0].rotation.y = data.rot;
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
    // THREE.JS ENVIRONMENT
    // ---------------------------------------------------
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05080e);
        this.scene.fog = new THREE.FogExp2(0x05080e, 0.005);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
        this.cameraOffset = new THREE.Vector3(0, 13, 20); // EA FC Broadcast angle
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.65);
        this.scene.add(this.ambientLight);

        this.floodLight = new THREE.DirectionalLight(0xffffff, 1.4);
        this.floodLight.position.set(40, 70, 30);
        this.floodLight.castShadow = true;
        this.floodLight.shadow.mapSize.width = 2048;
        this.floodLight.shadow.mapSize.height = 2048;
        this.floodLight.shadow.camera.near = 0.5;
        this.floodLight.shadow.camera.far = 250;
        this.floodLight.shadow.camera.left = -60;
        this.floodLight.shadow.camera.right = 60;
        this.scene.add(this.floodLight);
    }

    // ---------------------------------------------------
    // ULTRA REAL STADIUM & AD BOARDS
    // ---------------------------------------------------
    buildStadium() {
        // High quality grass canvas pitch texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#227f2c';
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.fillStyle = '#1c6d25';
        for (let i = 0; i < 1024; i += 64) {
            ctx.fillRect(0, i, 1024, 32);
        }

        const grassTex = new THREE.CanvasTexture(canvas);
        grassTex.wrapS = THREE.RepeatWrapping;
        grassTex.wrapT = THREE.RepeatWrapping;
        grassTex.repeat.set(15, 25);

        const pitchMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.85 });
        const pitchGeo = new THREE.PlaneGeometry(this.fieldWidth + 24, this.fieldLength + 34);
        this.pitch = new THREE.Mesh(pitchGeo, pitchMat);
        this.pitch.rotation.x = -Math.PI / 2;
        this.pitch.receiveShadow = true;
        this.scene.add(this.pitch);

        this.buildPitchMarkings();
        this.buildGrandstands();
    }

    buildPitchMarkings() {
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Touchlines
        const boundaryGeo = new THREE.RingGeometry(0.1, 0.2, 4);
        
        // Center Circle
        const centerCircleGeo = new THREE.RingGeometry(9.15, 9.3, 64);
        const centerCircle = new THREE.Mesh(centerCircleGeo, lineMat);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.y = 0.02;
        this.scene.add(centerCircle);

        // Center Line
        const centerLineGeo = new THREE.PlaneGeometry(this.fieldWidth, 0.15);
        const centerLine = new THREE.Mesh(centerLineGeo, lineMat);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, 0.02, 0);
        this.scene.add(centerLine);

        // Center spot
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 32), lineMat);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(0, 0.03, 0);
        this.scene.add(spot);
    }

    buildGrandstands() {
        const standMat = new THREE.MeshStandardMaterial({ color: 0x0e172a, roughness: 0.7 });
        const seatColors = [0xd91a1a, 0x0f1c3f, 0xe6c300, 0x115934];

        const sides = [
            { pos: [0, 15, -this.fieldLength / 2 - 28], rot: 0, w: 90 },
            { pos: [0, 15, this.fieldLength / 2 + 28], rot: Math.PI, w: 90 },
            { pos: [-this.fieldWidth / 2 - 28, 15, 0], rot: Math.PI / 2, w: 130 },
            { pos: [this.fieldWidth / 2 + 28, 15, 0], rot: -Math.PI / 2, w: 130 }
        ];

        sides.forEach(s => {
            const standGroup = new THREE.Group();
            for (let tier = 0; tier < 3; tier++) {
                const step = new THREE.Mesh(new THREE.BoxGeometry(s.w, 9, 12), standMat);
                step.position.set(0, tier * 8, -tier * 9);
                standGroup.add(step);

                const seatGeo = new THREE.BoxGeometry(s.w * 0.96, 0.4, 10);
                const seatBlock = new THREE.Mesh(seatGeo, new THREE.MeshStandardMaterial({ color: seatColors[tier % seatColors.length] }));
                seatBlock.position.set(0, tier * 8 + 4.6, -tier * 9);
                standGroup.add(seatBlock);
            }
            standGroup.position.set(...s.pos);
            standGroup.rotation.y = s.rot;
            this.scene.add(standGroup);
        });
    }

    // ---------------------------------------------------
    // REAL BRAND ADVERTISING LED BOARDS (Nike, Adidas...)
    // ---------------------------------------------------
    buildAdBoards() {
        const brands = ["ADIDAS", "NIKE", "COCA-COLA", "EMIRATES", "FC ULTRA", "RENDER", "GITHUB"];
        const boardHeight = 1.0;
        const boardWidth = 6.0;

        const adGroup = new THREE.Group();

        // Place boards along side touchlines
        const zPositions = [-30, -18, -6, 6, 18, 30];
        const xPositions = [-this.fieldWidth / 2 - 1.5, this.fieldWidth / 2 + 1.5];

        xPositions.forEach((x, sideIdx) => {
            zPositions.forEach((z, idx) => {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                
                // Neon sports ad background
                ctx.fillStyle = '#081226';
                ctx.fillRect(0, 0, 256, 64);
                
                ctx.strokeStyle = '#dfb72c';
                ctx.lineWidth = 4;
                ctx.strokeRect(4, 4, 248, 56);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px Rajdhani';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const brand = brands[(idx + sideIdx) % brands.length];
                ctx.fillText(brand, 128, 32);

                const texture = new THREE.CanvasTexture(canvas);
                const mat = new THREE.MeshBasicMaterial({ map: texture });
                const board = new THREE.Mesh(new THREE.PlaneGeometry(boardWidth, boardHeight), mat);
                
                board.position.set(x, boardHeight / 2, z);
                board.rotation.y = sideIdx === 0 ? Math.PI / 2 : -Math.PI / 2;
                adGroup.add(board);
            });
        });

        this.scene.add(adGroup);
    }

    // ---------------------------------------------------
    // GOALS & NETS (2 Meters High)
    // ---------------------------------------------------
    buildGoals() {
        const width = 7.32;
        const height = 2.0; // Standard 2 meter goal net as requested
        const postRadius = 0.1;
        const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0.85 });

        [-this.fieldLength / 2, this.fieldLength / 2].forEach((zPos, idx) => {
            const goal = new THREE.Group();
            
            const left = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, height, 16), postMat);
            left.position.set(-width / 2, height / 2, 0);

            const right = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, height, 16), postMat);
            right.position.set(width / 2, height / 2, 0);

            const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, width, 16), postMat);
            crossbar.rotation.z = Math.PI / 2;
            crossbar.position.set(0, height, 0);

            const net = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, 1.8),
                new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.25 })
            );
            net.position.set(0, height / 2, idx === 0 ? -0.9 : 0.9);

            goal.add(left, right, crossbar, net);
            goal.position.set(0, 0, zPos);
            if (idx === 1) goal.rotation.y = Math.PI;
            this.scene.add(goal);
        });

        this.goalBounds = { minX: -width / 2, maxX: width / 2, yLimit: height };
    }

    // ---------------------------------------------------
    // DENSE STADIUM CROWD & CAMERAMEN
    // ---------------------------------------------------
    buildCrowd() {
        this.crowd = [];
        const colors = [0xff0044, 0x00d2ff, 0xdfb72c, 0xffffff, 0x105934];
        const crowdGroup = new THREE.Group();

        // Spawn 800 crowd spectators on stands
        for (let i = 0; i < 800; i++) {
            const spectator = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.65, 0.35),
                new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
            );

            const side = Math.floor(Math.random() * 4);
            const tier = Math.floor(Math.random() * 3);
            const offset = (Math.random() - 0.5) * 85;

            if (side === 0) spectator.position.set(offset, 9 + tier * 8, -this.fieldLength / 2 - 20 - tier * 9);
            else if (side === 1) spectator.position.set(offset, 9 + tier * 8, this.fieldLength / 2 + 20 + tier * 9);
            else if (side === 2) spectator.position.set(-this.fieldWidth / 2 - 20 - tier * 9, 9 + tier * 8, offset);
            else spectator.position.set(this.fieldWidth / 2 + 20 + tier * 9, 9 + tier * 8, offset);

            spectator.userData = { startY: spectator.position.y, phase: Math.random() * Math.PI * 2 };
            crowdGroup.add(spectator);
            this.crowd.push(spectator);
        }

        this.scene.add(crowdGroup);
    }

    updateCrowd(time) {
        this.crowd.forEach(s => {
            s.position.y = s.userData.startY + Math.sin(time * 5.5 + s.userData.phase) * 0.25;
        });
    }

    buildCameramen() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const camMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
        const positions = [
            [-this.fieldWidth / 2 - 2, 0, -30],
            [this.fieldWidth / 2 + 2, 0, 30],
            [-this.fieldWidth / 2 - 2, 0, 30],
            [this.fieldWidth / 2 + 2, 0, -30]
        ];

        positions.forEach(pos => {
            const camGroup = new THREE.Group();
            const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 1.4, 8), bodyMat);
            tripod.position.y = 0.7;
            const camera = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.75), camMat);
            camera.position.set(0, 1.45, 0.15);
            camera.lookAt(0, 1, 0);

            camGroup.add(tripod, camera);
            camGroup.position.set(...pos);
            this.scene.add(camGroup);
        });
    }

    // ---------------------------------------------------
    // FOOTBALL BALL (SHARED)
    // ---------------------------------------------------
    buildBall() {
        const r = 0.23;
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#111111';
        for (let i = 0; i < 7; i++) {
            ctx.beginPath(); ctx.arc(Math.random() * 256, Math.random() * 256, 20, 0, Math.PI * 2); ctx.fill();
        }

        const ballTex = new THREE.CanvasTexture(canvas);
        this.ball = new THREE.Mesh(
            new THREE.SphereGeometry(r, 32, 32),
            new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.4 })
        );
        this.ball.castShadow = true;
        this.scene.add(this.ball);

        this.ballRadius = r;
        this.ballVelocity = new THREE.Vector3(0, 0, 0);
        this.resetBall();
    }

    resetBall() {
        this.ball.position.set(0, this.ballRadius, 0);
        this.ballVelocity.set(0, 0, 0);
        this.hasBallControl = false;

        // Reposition 5v5 home team players
        if (this.homeTeamPlayers && this.homeTeamPlayers.length >= 5) {
            this.homeTeamPlayers[0].position.set(0, 0, 27); // GK
            this.homeTeamPlayers[1].position.set(0, 0, 14); // DF
            this.homeTeamPlayers[2].position.set(-4, 0, 6); // MF
            this.homeTeamPlayers[3].position.set(-1, 0, 1); // FW
            this.homeTeamPlayers[4].position.set(4, 0, 4);  // SUB
            this.activePlayer = this.homeTeamPlayers[3];
        }

        // Reposition 5v5 away team players
        if (this.awayTeamPlayers && this.awayTeamPlayers.length >= 5) {
            this.awayTeamPlayers[0].position.set(0, 0, -27); // GK
            this.awayTeamPlayers[1].position.set(0, 0, -14); // DF
            this.awayTeamPlayers[2].position.set(4, 0, -6);  // MF
            this.awayTeamPlayers[3].position.set(1, 0, -1);  // FW
            this.awayTeamPlayers[4].position.set(-4, 0, -4); // SUB
        }
    }

    // ---------------------------------------------------
    // COACH CHARACTER (TO'PNI OLIB CHIQISH)
    // ---------------------------------------------------
    buildCoach() {
        this.coach = new THREE.Group();
        const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }); // Dark navy suit
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });

        // Coach Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 1.4, 16), suitMat);
        torso.position.y = 0.85;

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
        head.position.y = 1.7;

        // Collar/Tie
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0xff0033 }));
        tie.position.set(0, 1.35, 0.28);

        this.coach.add(torso, head, tie);
        
        // Coach starts near touchline walkout gate
        this.coach.position.set(-this.fieldWidth / 2 - 4, 0, -8);
        this.scene.add(this.coach);
    }

    // ---------------------------------------------------
    // 3D PLAYER MODEL BUILDER (FORMASIDAGI O'YINCHILAR)
    // ---------------------------------------------------
    buildPlayers() {
        if (this.homeTeamPlayers) {
            this.homeTeamPlayers.forEach(p => this.scene.remove(p));
        }
        if (this.awayTeamPlayers) {
            this.awayTeamPlayers.forEach(p => this.scene.remove(p));
        }

        this.homeTeamPlayers = [];
        this.awayTeamPlayers = [];

        // PORTUGAL (Home Team)
        const gkHome = this.createRealisticPlayer(0xffaa00, 0x111111, "PATRICIO", "1", "GK");
        gkHome.position.set(0, 0, 27);
        
        const dfHome = this.createRealisticPlayer(0xff0000, 0xffd200, "PEPE", "3", "DF");
        dfHome.position.set(0, 0, 14);

        const mfHome = this.createRealisticPlayer(0xff0000, 0xffd200, "CASEMIRO", "5", "MF");
        mfHome.position.set(-4, 0, 6);

        const fwHome = this.createRealisticPlayer(0xff0000, 0xffd200, "C. RONALDO", "7", "FW");
        fwHome.position.set(2, 0, 2);

        const subHome = this.createRealisticPlayer(0xff0000, 0xffd200, "JOTA", "11", "FW");
        subHome.position.set(8, 0, 15);

        this.homeTeamPlayers.push(gkHome, dfHome, mfHome, fwHome, subHome);
        this.homeTeamPlayers.forEach(p => this.scene.add(p));

        // BRAZIL (Away Team)
        const gkAway = this.createRealisticPlayer(0x00aaff, 0x111111, "ALISSON", "1", "GK");
        gkAway.position.set(0, 0, -27);

        const dfAway = this.createRealisticPlayer(0x0f1c3f, 0xffffff, "MARQUINHOS", "4", "DF");
        dfAway.position.set(0, 0, -14);

        const mfAway = this.createRealisticPlayer(0x0f1c3f, 0xffffff, "NEYMAR", "10", "MF");
        mfAway.position.set(4, 0, -6);

        const fwAway = this.createRealisticPlayer(0x0f1c3f, 0xffffff, "JIMENEZ", "9", "FW");
        fwAway.position.set(-2, 0, -2);

        const subAway = this.createRealisticPlayer(0x0f1c3f, 0xffffff, "ANTONY", "19", "FW");
        subAway.position.set(-8, 0, -15);

        this.awayTeamPlayers.push(gkAway, dfAway, mfAway, fwAway, subAway);
        this.awayTeamPlayers.forEach(p => this.scene.add(p));

        this.activePlayer = fwHome; // Start controlling Ronaldo
        this.buildPlayerSelector();
    }

    buildPlayerSelector() {
        if (this.selectorRing) this.scene.remove(this.selectorRing);
        const geo = new THREE.ConeGeometry(0.18, 0.45, 4);
        geo.rotateX(Math.PI); // Point down
        const mat = new THREE.MeshBasicMaterial({ color: 0x02f87b });
        this.selectorRing = new THREE.Mesh(geo, mat);
        this.scene.add(this.selectorRing);
    }

    setupStadiumTheme(theme) {
        this.weather = theme;
        
        // Remove existing weather particles if any
        if (this.rainParticles) this.scene.remove(this.rainParticles);
        if (this.fireParticles) this.scene.remove(this.fireParticles);

        // Adjust grass physics in our physics module
        if (window.gamePhysics) {
            window.gamePhysics.setWeather(theme);
        }

        // Update lights based on theme
        if (theme === 'sunny') {
            if (this.floodLight) {
                this.floodLight.color.setHex(0xffffff);
                this.floodLight.intensity = 1.3;
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0xaaaaaa);
                this.ambientLight.intensity = 0.8;
            }
            this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
            this.renderer.setClearColor(0x87ceeb);
        } else if (theme === 'rain') {
            if (this.floodLight) {
                this.floodLight.color.setHex(0x8899aa);
                this.floodLight.intensity = 0.6;
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0x445566);
                this.ambientLight.intensity = 0.5;
            }
            this.scene.background = new THREE.Color(0x223344);
            this.renderer.setClearColor(0x223344);
            this.buildRainParticles();
        } else if (theme === 'desert') {
            if (this.floodLight) {
                this.floodLight.color.setHex(0xfff5ee);
                this.floodLight.intensity = 1.2;
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0xd2b48c);
                this.ambientLight.intensity = 0.7;
            }
            this.scene.background = new THREE.Color(0xeed5b7);
            this.renderer.setClearColor(0xeed5b7);
        } else if (theme === 'final') {
            if (this.floodLight) {
                this.floodLight.color.setHex(0xffffff);
                this.floodLight.intensity = 1.4;
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0xccaa88);
                this.ambientLight.intensity = 0.9;
            }
            this.scene.background = new THREE.Color(0x111122);
            this.renderer.setClearColor(0x111122);
            this.buildFireParticles();
        } else {
            // night
            if (this.floodLight) {
                this.floodLight.color.setHex(0xffffff);
                this.floodLight.intensity = 1.4;
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0xddeeff);
                this.ambientLight.intensity = 0.65;
            }
            this.scene.background = new THREE.Color(0x05080e);
            this.renderer.setClearColor(0x05080e);
        }
    }

    buildRainParticles() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        for (let i = 0; i < particleCount; i++) {
            positions.push(
                Math.random() * 120 - 60,  // x
                Math.random() * 40 + 5,   // y
                Math.random() * 160 - 80   // z
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.15,
            transparent: true,
            opacity: 0.6
        });
        
        this.rainParticles = new THREE.Points(geometry, material);
        this.scene.add(this.rainParticles);
    }

    buildFireParticles() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const torchLocations = [
            new THREE.Vector3(-36, 0.5, -45),
            new THREE.Vector3(36, 0.5, -45),
            new THREE.Vector3(-36, 0.5, 45),
            new THREE.Vector3(36, 0.5, 45)
        ];
        
        torchLocations.forEach(loc => {
            for (let i = 0; i < particleCount / 4; i++) {
                positions.push(
                    loc.x + (Math.random() * 0.4 - 0.2),
                    loc.y + (Math.random() * 3.0),
                    loc.z + (Math.random() * 0.4 - 0.2)
                );
            }
        });
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xff5500,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        this.fireParticles = new THREE.Points(geometry, material);
        this.scene.add(this.fireParticles);
    }

    createRealisticPlayer(shirtColor, shortColor, name, number, role = "FW") {
        const player = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });
        const shortsMat = new THREE.MeshStandardMaterial({ color: shortColor, roughness: 0.6 });

        // Torso
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 1.3, 16), shirtMat);
        torso.position.y = 0.9;
        torso.castShadow = true;

        // Shorts
        const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.35, 16), shortsMat);
        shorts.position.y = 0.45;

        // Head & Dark Hair
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skinMat);
        head.position.y = 1.7;
        
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
        hair.position.y = 1.75;
        head.add(hair);

        // Arms & Legs
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
        const leftArm = new THREE.Mesh(armGeo, skinMat);
        leftArm.position.set(-0.38, 0.95, 0);
        const rightArm = new THREE.Mesh(armGeo, skinMat);
        rightArm.position.set(0.38, 0.95, 0);

        const legGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.8, 8);
        const leftLeg = new THREE.Mesh(legGeo, shortsMat);
        leftLeg.position.set(-0.16, 0.2, 0);
        const rightLeg = new THREE.Mesh(legGeo, shortsMat);
        rightLeg.position.set(0.16, 0.2, 0);

        player.add(torso, shorts, head, leftArm, rightArm, leftLeg, rightLeg);
        
        player.userData = {
            name,
            number,
            speed: 10,
            hasYellowCard: false,
            role,
            stunTime: 0
        };

        return player;
    }

    // ---------------------------------------------------
    // WALKOUT CINEMATIC SEQUENCE (TUNNELDAN CHIQISH)
    // ---------------------------------------------------
    startWalkoutCinematic() {
        this.isWalkout = false;
        this.matchPhase = 'play';
        
        // Hide walkout card immediately, display game HUD
        const ws = document.getElementById('walkout-screen');
        if (ws) ws.classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');

        // Position coach directly on the touchline sideline to oversee/coach
        this.coach.position.set(0, 0, -this.fieldLength / 2 - 3);
        this.coach.lookAt(0, 0, 0);

        // Place ball directly at the center kickoff circle
        this.ball.position.set(0, this.ballRadius, 0);
        this.ballVelocity.set(0, 0, 0);

        // Position 5v5 home team players
        if (this.homeTeamPlayers && this.homeTeamPlayers.length >= 5) {
            this.homeTeamPlayers[0].position.set(0, 0, 27); // GK
            this.homeTeamPlayers[1].position.set(0, 0, 14); // DF
            this.homeTeamPlayers[2].position.set(-4, 0, 6); // MF
            this.homeTeamPlayers[3].position.set(-1, 0, 1); // FW (controlled)
            this.homeTeamPlayers[4].position.set(4, 0, 4);  // SUB/Wing
            this.activePlayer = this.homeTeamPlayers[3];
        }

        // Position 5v5 away team players
        if (this.awayTeamPlayers && this.awayTeamPlayers.length >= 5) {
            this.awayTeamPlayers[0].position.set(0, 0, -27); // GK
            this.awayTeamPlayers[1].position.set(0, 0, -14); // DF
            this.awayTeamPlayers[2].position.set(4, 0, -6);  // MF
            this.awayTeamPlayers[3].position.set(1, 0, -1);  // FW
            this.awayTeamPlayers[4].position.set(-4, 0, -4); // SUB/Wing
        }

        // Setup camera looking at center
        this.camera.position.set(0, 15, 25);
        this.camera.lookAt(0, 0, 0);

        // Whistle sound play immediately
        try {
            gameAudio.playWhistle();
        } catch (e) {
            console.warn(e);
        }

        // Activate Referee Kickoff Immunity
        if (window.gameReferee) {
            window.gameReferee.resetImmunity();
        }

        const banner = document.getElementById('referee-whistle-banner');
        if (banner) {
            banner.innerHTML = '<i class="fa-solid fa-bullhorn"></i> COACH WHISTLE! MATCH STARTED! 🏁';
            banner.classList.remove('hidden');
        }

        setTimeout(() => {
            if (banner) banner.classList.add('hidden');
        }, 2000);

        this.isPlaying = true;
    }

    switchActivePlayer() {
        if (!this.homeTeamPlayers) return;
        
        // Find outfield teammates
        const outfieldMates = this.homeTeamPlayers.filter(p => p.userData.role !== 'GK');
        if (outfieldMates.length === 0) return;

        // Get index of current active player
        let currentIndex = outfieldMates.indexOf(this.activePlayer);
        let nextIndex = (currentIndex + 1) % outfieldMates.length;

        this.activePlayer = outfieldMates[nextIndex];
        console.log(`[Switch] Controlled teammate switched to: ${this.activePlayer.userData.name} (${this.activePlayer.userData.role})`);
    }

    skipWalkout() {}

    updateWalkout(dt) {}

    completeKickoff() {}

    // ---------------------------------------------------
    // TACTICAL GAME ENGINE LOOP
    // ---------------------------------------------------
    animate(timestamp) {
        requestAnimationFrame(this.animate);
        const dt = 0.016;
        const time = timestamp * 0.001;

        if (this.isWalkout) {
            this.updateWalkout(dt);
        } else if (this.isPlaying) {
            this.updatePlayerMovement(dt);
            this.updateAIOpponents(dt);
            this.updateBallPhysics(dt);
            this.updateCamera();
            this.updateRadar();
            this.updateClock(dt);
            this.updateCrowd(time);

            // Update Weather Particles
            if (this.weather === 'rain' && this.rainParticles) {
                const positions = this.rainParticles.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] -= 0.6; // Rain fall speed
                    if (positions[i] < 0) positions[i] = Math.random() * 40 + 5;
                }
                this.rainParticles.geometry.attributes.position.needsUpdate = true;
            }

            if (this.weather === 'final' && this.fireParticles) {
                const positions = this.fireParticles.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] += Math.random() * 0.1 - 0.04;
                    if (positions[i] > 4.5) positions[i] = 0.5;
                }
                this.fireParticles.geometry.attributes.position.needsUpdate = true;
            }

            // Referee controller update
            if (window.gameReferee) {
                window.gameReferee.update(dt);

                // Run strict foul checking logic on contact
                if (!this.isTraining) {
                    this.homeTeamPlayers.forEach(hPlayer => {
                        this.awayTeamPlayers.forEach(aPlayer => {
                            if (hPlayer.userData.role !== 'GK' && aPlayer.userData.role !== 'GK') {
                                const dist = hPlayer.position.distanceTo(aPlayer.position);
                                if (dist < 1.4) {
                                    const relativeSpeed = 15.0; // Simulated speed threshold
                                    const isSliding = (hPlayer === this.activePlayer && this.activePlayer.userData.isSliding);
                                    
                                    if (window.gameReferee.checkTackleFoul(hPlayer, aPlayer, dist, relativeSpeed, isSliding)) {
                                        window.gameReferee.triggerFoul(hPlayer, this);
                                    }
                                }
                            }
                        });
                    });
                }
            }
        }

        // Bobbing & rotating selector arrow above controlled player
        if (this.activePlayer && this.selectorRing) {
            this.selectorRing.position.copy(this.activePlayer.position);
            this.selectorRing.position.y = 2.4 + Math.sin(Date.now() * 0.005) * 0.15;
            this.selectorRing.rotation.y += 0.02;
        }

        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerMovement(dt) {
        const moveDir = new THREE.Vector3(0, 0, 0);
        
        // Joystick inputs take priority, otherwise fallback to keyboard
        if (this.joystick.active) {
            moveDir.x = this.joystick.moveX;
            moveDir.z = this.joystick.moveY;
        } else {
            if (this.keys.w) moveDir.z -= 1;
            if (this.keys.s) moveDir.z += 1;
            if (this.keys.a) moveDir.x -= 1;
            if (this.keys.d) moveDir.x += 1;
        }

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            
            // Sprint multiplier based on stamina
            const speed = (this.stamina > 15) ? 12 : 7;
            this.activePlayer.position.addScaledVector(moveDir, speed * dt);
            this.activePlayer.rotation.y = Math.atan2(moveDir.x, moveDir.z);

            // Drain stamina while running
            this.stamina = Math.max(0, this.stamina - dt * 4);
            document.getElementById('stamina-fill').style.width = this.stamina + '%';

            // Sync multiplayer
            if (this.isOnline && this.socket) {
                this.socket.emit('player_move', {
                    x: this.activePlayer.position.x,
                    y: this.activePlayer.position.y,
                    z: this.activePlayer.position.z,
                    rot: this.activePlayer.rotation.y
                });
            }
        } else {
            // Restore stamina
            this.stamina = Math.min(100, this.stamina + dt * 6);
            document.getElementById('stamina-fill').style.width = this.stamina + '%';
        }

        // Keep inside bounds
        this.activePlayer.position.x = THREE.MathUtils.clamp(this.activePlayer.position.x, -this.fieldWidth / 2 + 1, this.fieldWidth / 2 - 1);
        this.activePlayer.position.z = THREE.MathUtils.clamp(this.activePlayer.position.z, -this.fieldLength / 2 + 1, this.fieldLength / 2 - 1);
    }

    updateAIOpponents(dt) {
        if (this.isOnline) return;

        // Update home AI teammates (excluding the active controlled player and GK)
        if (this.homeTeamPlayers) {
            this.homeTeamPlayers.forEach(p => {
                if (p !== this.activePlayer && p.userData.role !== 'GK') {
                    if (window.gameAI) window.gameAI.updateOutfieldAI(p, this.ball, false, dt, this.activePlayer);
                } else if (p.userData.role === 'GK') {
                    if (window.gameAI) window.gameAI.updateGoalkeeper(p, true, this.ball, this.ballRadius, this.fieldLength, dt);
                }
            });
        }

        // Update away AI opponents (with Goalkeeper bounds)
        if (this.awayTeamPlayers) {
            this.awayTeamPlayers.forEach(p => {
                if (p.userData.role !== 'GK') {
                    if (window.gameAI) window.gameAI.updateOutfieldAI(p, this.ball, true, dt, null);
                } else if (p.userData.role === 'GK') {
                    if (window.gameAI) window.gameAI.updateGoalkeeper(p, false, this.ball, this.ballRadius, this.fieldLength, dt);
                }
            });
        }
    }

    updateBallPhysics(dt) {
        const b = this.ball.position;

        // Dribbling proximity
        const distToActive = b.distanceTo(this.activePlayer.position);
        
        if (distToActive < 1.15 && this.ballVelocity.length() < 3.5) {
            // Stick to player feet
            const offset = new THREE.Vector3(0, 0, 0.75).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ball.position.copy(this.activePlayer.position).add(offset);
            this.ball.position.y = this.ballRadius;
            this.hasBallControl = true;
            this.lastKickedBy = 'home';
            document.getElementById('hud-active-player').innerText = this.activePlayer.userData.name;
        } else {
            // Free movement physics using gamePhysics module
            if (window.gamePhysics) {
                window.gamePhysics.updateBall(this.ball, this.ballVelocity, this.ballRadius, this.fieldWidth, this.fieldLength);
            }

            // Sync ball online
            if (this.isOnline && this.socket && this.hasBallControl) {
                this.socket.emit('ball_sync', { x: b.x, y: b.y, z: b.z });
            }
        }

        // Collision with Goals (Goal Check)
        if (Math.abs(b.x) < 3.66) {
            if (b.z < -this.fieldLength / 2) {
                this.triggerGoal(true); // Home goal
            } else if (b.z > this.fieldLength / 2) {
                this.triggerGoal(false); // Away goal
            }
        }
    }

    triggerGoal(isHome) {
        if (isHome) this.homeScore++;
        else this.awayScore++;

        document.getElementById('hud-home-score').innerText = this.homeScore;
        document.getElementById('hud-away-score').innerText = this.awayScore;

        try {
            gameAudio.playGoalSound();
        } catch (e) {
            console.warn(e);
        }
        const overlay = document.getElementById('goal-announcement');
        overlay.classList.remove('hidden');

        // Confetti celebration
        if (window.confetti) window.confetti({ particleCount: 120, spread: 75, origin: { y: 0.65 } });

        this.isPlaying = false;
        setTimeout(() => {
            overlay.classList.add('hidden');
            this.resetBall();
            this.isPlaying = true;
            
            // Reposition all 5v5 players correctly
            if (this.homeTeamPlayers && this.homeTeamPlayers.length >= 5) {
                this.homeTeamPlayers[0].position.set(0, 0, 27); // GK
                this.homeTeamPlayers[1].position.set(0, 0, 14); // DF
                this.homeTeamPlayers[2].position.set(-4, 0, 6); // MF
                this.homeTeamPlayers[3].position.set(-1, 0, 1); // FW
                this.homeTeamPlayers[4].position.set(4, 0, 4);  // SUB
            }
            if (this.awayTeamPlayers && this.awayTeamPlayers.length >= 5) {
                this.awayTeamPlayers[0].position.set(0, 0, -27); // GK
                this.awayTeamPlayers[1].position.set(0, 0, -14); // DF
                this.awayTeamPlayers[2].position.set(4, 0, -6);  // MF
                this.awayTeamPlayers[3].position.set(1, 0, -1);  // FW
                this.awayTeamPlayers[4].position.set(-4, 0, -4); // SUB
            }
            // Activate Referee Immunity
            if (window.gameReferee) window.gameReferee.resetImmunity();
        }, 3500);
    }

    // ---------------------------------------------------
    // REAL SOCCER MATCH RULES: OFFSIDE, FOUL, CARD
    // ---------------------------------------------------
    triggerOffside() {
        this.isPlaying = false;
        try {
            gameAudio.playWhistle();
        } catch (e) {
            console.warn(e);
        }

        const banner = document.getElementById('referee-whistle-banner');
        banner.innerHTML = '<i class="fa-solid fa-flag"></i> OFFSIDE CALL! 🚩';
        banner.classList.remove('hidden');

        setTimeout(() => {
            banner.classList.add('hidden');
            this.resetBall();
            this.ball.position.set(0, this.ballRadius, -15); // Opponent free kick
            this.isPlaying = true;
        }, 2500);
    }

    triggerFoul(player) {
        if (window.gameReferee) {
            window.gameReferee.triggerFoul(player, this);
        }
    }

    // ---------------------------------------------------
    // ACTIONS: PASS, THROUGH, SHOOT, TACKLE
    // ---------------------------------------------------
    executePass() {
        if (this.hasBallControl) {
            try {
                gameAudio.playKick();
            } catch (e) {}
            const passDir = new THREE.Vector3(0, 0.08, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ballVelocity.copy(passDir.multiplyScalar(17));
            this.hasBallControl = false;
        }
    }

    executeThroughPass() {
        if (this.hasBallControl) {
            try {
                gameAudio.playKick();
            } catch (e) {}
            const throughDir = new THREE.Vector3(0, 0.12, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ballVelocity.copy(throughDir.multiplyScalar(22));
            this.hasBallControl = false;
        }
    }

    executeShoot() {
        if (this.hasBallControl) {
            // Shoot at goal
            try {
                gameAudio.playKick();
            } catch (e) {}
            const shootDir = new THREE.Vector3(0, 0.35, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ballVelocity.copy(shootDir.multiplyScalar(28));
            this.hasBallControl = false;
        } else {
            // Execute slide tackle (Podkat)
            this.executeSlideTackle();
        }
    }

    executeSlideTackle() {
        // Player slides forward
        const slideDir = new THREE.Vector3(0, 0, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
        this.activePlayer.position.addScaledVector(slideDir, 5.0);
        this.activePlayer.userData.isSliding = true;

        setTimeout(() => {
            if (this.activePlayer && this.activePlayer.userData) {
                this.activePlayer.userData.isSliding = false;
            }
        }, 600);

        // Check if hit opponent (Steal ball and stun bot)
        this.awayTeamPlayers.forEach(bot => {
            const dist = this.activePlayer.position.distanceTo(bot.position);
            if (dist < 2.0) {
                if (!bot.userData) bot.userData = {};
                bot.userData.stunTime = 1.5; // Stun bot for 1.5s
                
                // Steal the ball and place it near player
                this.hasBallControl = true;
                this.ball.position.copy(this.activePlayer.position).add(new THREE.Vector3(0, 0.2, 0.6));
                this.ballVelocity.set(0, 0, 0);

                try {
                    gameAudio.playKick();
                } catch(e) {}
            }
        });
    }

    // ---------------------------------------------------
    // HUD RADAR MINI-MAP
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

        const toMapX = (x) => (x + this.fieldWidth / 2) / this.fieldWidth * w;
        const toMapZ = (z) => (z + this.fieldLength / 2) / this.fieldLength * h;

        // Home Team (Green)
        ctx.fillStyle = '#02f87b';
        this.homeTeamPlayers.forEach(p => {
            ctx.beginPath();
            ctx.arc(toMapX(p.position.x), toMapZ(p.position.z), 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Away Team (Red)
        ctx.fillStyle = '#ff0044';
        this.awayTeamPlayers.forEach(p => {
            ctx.beginPath();
            ctx.arc(toMapX(p.position.x), toMapZ(p.position.z), 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Ball (White)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(toMapX(this.ball.position.x), toMapZ(this.ball.position.z), 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---------------------------------------------------
    // JOYSTICK HANDLERS
    // ---------------------------------------------------
    setupJoystick() {
        const boundary = document.getElementById('joystick-boundary');
        const thumb = document.getElementById('joystick-thumb');

        if (!boundary) return;

        boundary.addEventListener('pointerdown', (e) => {
            this.joystick.active = true;
            this.joystick.startX = e.clientX;
            this.joystick.startY = e.clientY;
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.joystick.active) return;

            const deltaX = e.clientX - this.joystick.startX;
            const deltaY = e.clientY - this.joystick.startY;
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const angle = Math.atan2(deltaY, deltaX);
            const moveX = Math.min(dist, this.joystick.maxLimit) * Math.cos(angle);
            const moveY = Math.min(dist, this.joystick.maxLimit) * Math.sin(angle);

            thumb.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;

            // Map to movement vectors
            this.joystick.moveX = moveX / this.joystick.maxLimit;
            this.joystick.moveY = moveY / this.joystick.maxLimit;
        });

        window.addEventListener('pointerup', () => {
            this.joystick.active = false;
            this.joystick.moveX = 0;
            this.joystick.moveY = 0;
            thumb.style.transform = 'translate(-50%, -50%)';
        });
    }

    // ---------------------------------------------------
    // EVENT BINDINGS & MATCH SETUP
    // ---------------------------------------------------
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w') this.keys.w = true;
            if (k === 's') this.keys.s = true;
            if (k === 'a') this.keys.a = true;
            if (k === 'd') this.keys.d = true;
            if (k === 'q') this.switchActivePlayer(); // Switch controlled teammate
            if (k === 'k') this.executePass();
            if (k === 'i') this.executeThroughPass();
            if (k === 'o') this.executeShoot();
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w') this.keys.w = false;
            if (k === 's') this.keys.s = false;
            if (k === 'a') this.keys.a = false;
            if (k === 'd') this.keys.d = false;
        });

        // Mobile HUD buttons
        const btnShoot = document.getElementById('btn-shoot');
        if (btnShoot) btnShoot.addEventListener('pointerdown', () => this.executeShoot());
        
        const btnThrough = document.getElementById('btn-through');
        if (btnThrough) btnThrough.addEventListener('pointerdown', () => this.executeThroughPass());
        
        const btnPass = document.getElementById('btn-pass');
        if (btnPass) btnPass.addEventListener('pointerdown', () => this.executePass());
        
        const btnSprint = document.getElementById('btn-sprint');
        if (btnSprint) {
            btnSprint.addEventListener('pointerdown', () => {
                this.stamina = Math.max(0, this.stamina - 20);
            });
        }

        const btnSwitch = document.getElementById('btn-switch');
        if (btnSwitch) {
            btnSwitch.addEventListener('pointerdown', () => {
                this.switchActivePlayer();
            });
        }

        // Scoreboard Menu Button (Pause Game)
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                if (window.gameMenu) window.gameMenu.showScreen('main-menu');
            });
        }
    }

    updateCamera() {
        const target = this.activePlayer.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(target, 0.1);
        this.camera.lookAt(this.activePlayer.position.x, 1.2, this.activePlayer.position.z - 3);
    }

    updateClock(dt) {
        this.matchTime += dt;
        const mins = Math.floor(this.matchTime / 60);
        const secs = Math.floor(this.matchTime % 60);
        document.getElementById('match-timer').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
}

window.addEventListener('load', () => {
    window.matchInstance = new UltraFootballMatch();
});
