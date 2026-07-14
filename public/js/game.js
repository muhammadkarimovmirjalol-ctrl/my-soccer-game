// ===================================================
// FC MOBILE 3D - UNIFIED SOLID GAME ENGINE v3.0
// Programmatic Audio Synthesizer, 5v5 Formations, Goalkeepers,
// Active Switching, Weather Physics, and Kickoff Immunity.
// ===================================================

// --- PROGRAMMATIC AUDIO SYNTHESIZER ---
class AudioSynth {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playWhistle() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.15);
        osc.frequency.setValueAtTime(1300, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    playKick() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playGoalSound() {
        this.init();
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 450;
        filter.Q.value = 1.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
        noise.stop(this.ctx.currentTime + 1.5);
    }
}

const gameAudio = new AudioSynth();

// --- MAIN GAME CONTROLLER ---
class UltraFootballMatch {
    constructor() {
        this.container = document.getElementById('webgl-container');
        
        // Match settings
        this.selectedTeam = 'POR';
        this.selectedOpponent = 'BRA';
        this.weather = 'night';
        this.isTraining = false;

        // Scores & Time
        this.homeScore = 0;
        this.awayScore = 0;
        this.matchTime = 0; // seconds
        this.isPlaying = false;
        
        // Active control state
        this.activePlayer = null;
        this.hasBallControl = false;
        this.stamina = 100;

        // Referee immunity & cooldown
        this.kickoffImmunityTime = 5.0; // immunity at start
        this.foulCooldown = 0;

        // Field size
        this.fieldWidth = 70;
        this.fieldLength = 110;
        this.ballRadius = 0.35;

        // Teams database
        this.teamsDb = {
            UZB: { name: 'O\'ZBEKISTON', flag: '🇺🇿', color: 0x00c3ff, rating: 4 },
            POR: { name: 'PORTUGAL', flag: '🇵🇹', color: 0xff0000, rating: 5 },
            BRA: { name: 'BRAZIL', flag: '🇧🇷', color: 0xe6c300, rating: 5 },
            ARG: { name: 'ARGENTINA', flag: '🇦🇷', color: 0x009ee3, rating: 5 },
            ESP: { name: 'SPAIN', flag: '🇪🇸', color: 0xd91a1a, rating: 5 },
            GER: { name: 'GERMANY', flag: '🇩🇪', color: 0x222222, rating: 4 },
            FRA: { name: 'FRANCE', flag: '🇫🇷', color: 0x002395, rating: 5 },
            ITA: { name: 'ITALY', flag: '🇮🇹', color: 0x008c45, rating: 4 }
        };

        // Inputs
        this.keys = { w: false, a: false, s: false, d: false };
        this.joystick = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0, maxLimit: 50 };

        // Init
        this.initSocket();
        this.initThree();
        this.buildStadium();
        this.buildGoals();
        this.buildBall();
        this.buildPlayers();
        this.buildSelectorArrow();
        this.setupEventListeners();
        this.setupJoystick();
        this.loadLeaderboard();
        this.renderMenuTeams();
        this.bindMenuButtons();

        // Loader simulation
        this.simulateLoader();

        // Run Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    simulateLoader() {
        let progress = 0;
        const pBar = document.getElementById('progress-bar');
        const interval = setInterval(() => {
            progress += 20;
            if (pBar) pBar.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    document.getElementById('loading-screen').classList.add('hidden');
                    document.getElementById('main-menu').classList.remove('hidden');
                }, 300);
            }
        }, 120);
    }

    initSocket() {
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.socket.on('opponent_move', (data) => {
                const opponent = this.awayTeamPlayers[3]; // FW opponent representation
                if (opponent) {
                    opponent.position.set(data.x, data.y, data.z);
                    opponent.rotation.y = data.rot;
                }
            });
            this.socket.on('opponent_ball_sync', (data) => {
                this.ball.position.set(data.x, data.y, data.z);
            });
        }
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05080e, 0.006);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
        this.cameraOffset = new THREE.Vector3(0, 13, 19);
        this.camera.position.set(0, 15, 25);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.6);
        this.scene.add(this.ambientLight);

        this.floodLight = new THREE.DirectionalLight(0xffffff, 1.4);
        this.floodLight.position.set(40, 70, 30);
        this.floodLight.castShadow = true;
        this.floodLight.shadow.mapSize.width = 1024;
        this.floodLight.shadow.mapSize.height = 1024;
        this.floodLight.shadow.camera.near = 0.5;
        this.floodLight.shadow.camera.far = 250;
        this.floodLight.shadow.camera.left = -60;
        this.floodLight.shadow.camera.right = 60;
        this.scene.add(this.floodLight);
    }

    buildStadium() {
        // Turf pitch
        const pitchGeo = new THREE.PlaneGeometry(this.fieldWidth + 20, this.fieldLength + 20);
        const pitchMat = new THREE.MeshStandardMaterial({
            color: this.weather === 'desert' ? 0xd2b48c : 0x1f5c22,
            roughness: 0.9
        });
        const pitch = new THREE.Mesh(pitchGeo, pitchMat);
        pitch.rotation.x = -Math.PI / 2;
        pitch.receiveShadow = true;
        this.scene.add(pitch);

        // Grid lines helper
        const gridLines = new THREE.GridHelper(120, 30, 0xffffff, 0x334e35);
        gridLines.position.y = 0.01;
        this.scene.add(gridLines);
    }

    buildGoals() {
        const goalFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 8);
        const barGeo = new THREE.CylinderGeometry(0.12, 0.12, 10, 8);

        // Home goal (Z = 55)
        const postLeftH = new THREE.Mesh(postGeo, goalFrameMat);
        postLeftH.position.set(-5, 2.5, 55);
        const postRightH = new THREE.Mesh(postGeo, goalFrameMat);
        postRightH.position.set(5, 2.5, 55);
        const barH = new THREE.Mesh(barGeo, goalFrameMat);
        barH.rotation.z = Math.PI / 2;
        barH.position.set(0, 5, 55);
        this.scene.add(postLeftH, postRightH, barH);

        // Away goal (Z = -55)
        const postLeftA = new THREE.Mesh(postGeo, goalFrameMat);
        postLeftA.position.set(-5, 2.5, -55);
        const postRightA = new THREE.Mesh(postGeo, goalFrameMat);
        postRightA.position.set(5, 2.5, -55);
        const barA = new THREE.Mesh(barGeo, goalFrameMat);
        barA.rotation.z = Math.PI / 2;
        barA.position.set(0, 5, -55);
        this.scene.add(postLeftA, postRightA, barA);
    }

    buildBall() {
        const ballGeo = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.castShadow = true;
        this.ball.position.set(0, this.ballRadius, 0);
        this.scene.add(this.ball);

        this.ballVelocity = new THREE.Vector3(0, 0, 0);
    }

    buildPlayers() {
        if (this.homeTeamPlayers) {
            this.homeTeamPlayers.forEach(p => this.scene.remove(p));
            this.awayTeamPlayers.forEach(p => this.scene.remove(p));
        }

        this.homeTeamPlayers = [];
        this.awayTeamPlayers = [];

        const hColor = this.teamsDb[this.selectedTeam].color;
        const aColor = this.teamsDb[this.selectedOpponent].color;

        // HOME TEAM
        const gkHome = this.createPlayerMesh(0xff9900, "GK", "H_GK");
        gkHome.position.set(0, 0, 48);
        const dfHome = this.createPlayerMesh(hColor, "DF", "H_DF");
        dfHome.position.set(0, 0, 25);
        const mfHome = this.createPlayerMesh(hColor, "MF", "H_MF");
        mfHome.position.set(-8, 0, 10);
        const fwHome = this.createPlayerMesh(hColor, "FW", "C. RONALDO");
        fwHome.position.set(0, 0, 2);
        const subHome = this.createPlayerMesh(hColor, "SUB", "H_SUB");
        subHome.position.set(8, 0, 15);

        this.homeTeamPlayers.push(gkHome, dfHome, mfHome, fwHome, subHome);
        this.homeTeamPlayers.forEach(p => this.scene.add(p));

        // AWAY TEAM
        const gkAway = this.createPlayerMesh(0x00ccff, "GK", "A_GK");
        gkAway.position.set(0, 0, -48);
        const dfAway = this.createPlayerMesh(aColor, "DF", "A_DF");
        dfAway.position.set(0, 0, -25);
        const mfAway = this.createPlayerMesh(aColor, "MF", "A_MF");
        mfAway.position.set(8, 0, -10);
        const fwAway = this.createPlayerMesh(aColor, "FW", "OPPONENT");
        fwAway.position.set(0, 0, -2);
        const subAway = this.createPlayerMesh(aColor, "SUB", "A_SUB");
        subAway.position.set(-8, 0, -15);

        this.awayTeamPlayers.push(gkAway, dfAway, mfAway, fwAway, subAway);
        this.awayTeamPlayers.forEach(p => this.scene.add(p));

        this.activePlayer = fwHome; // User controls Ronaldo initially
    }

    createPlayerMesh(shirtColor, role, name) {
        const group = new THREE.Group();
        
        // Torso cylinder
        const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.26, 0.22, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.6 })
        );
        torso.position.y = 0.8;
        torso.castShadow = true;

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 })
        );
        head.position.y = 1.5;

        // Shorts
        const shorts = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12),
            new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 })
        );
        shorts.position.y = 0.4;

        group.add(torso, head, shorts);
        
        group.userData = {
            role,
            name,
            speed: 8.5,
            isSliding: false,
            stunTime: 0
        };

        return group;
    }

    buildSelectorArrow() {
        const geo = new THREE.ConeGeometry(0.2, 0.5, 4);
        geo.rotateX(Math.PI); // point down
        const mat = new THREE.MeshBasicMaterial({ color: 0x02f87b });
        this.selectorArrow = new THREE.Mesh(geo, mat);
        this.scene.add(this.selectorArrow);
    }

    buildWeatherEffects(weather) {
        if (this.rainSystem) this.scene.remove(this.rainSystem);

        if (weather === 'rain') {
            const count = 1000;
            const geo = new THREE.BufferGeometry();
            const positions = [];
            for (let i = 0; i < count; i++) {
                positions.push(
                    Math.random() * 100 - 50,
                    Math.random() * 30 + 3,
                    Math.random() * 120 - 60
                );
            }
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            const mat = new THREE.PointsMaterial({
                color: 0xaaccff,
                size: 0.15,
                transparent: true,
                opacity: 0.5
            });
            this.rainSystem = new THREE.Points(geo, mat);
            this.scene.add(this.rainSystem);
        }
    }

    setupStadiumTheme(theme) {
        this.weather = theme;
        this.buildWeatherEffects(theme);

        if (theme === 'sunny') {
            this.scene.background = new THREE.Color(0x87ceeb);
            this.renderer.setClearColor(0x87ceeb);
            this.floodLight.color.setHex(0xffffff);
            this.floodLight.intensity = 1.3;
            this.ambientLight.intensity = 0.85;
        } else if (theme === 'rain') {
            this.scene.background = new THREE.Color(0x2d3a4d);
            this.renderer.setClearColor(0x2d3a4d);
            this.floodLight.color.setHex(0x99aacc);
            this.floodLight.intensity = 0.7;
            this.ambientLight.intensity = 0.45;
        } else if (theme === 'desert') {
            this.scene.background = new THREE.Color(0xeedcb3);
            this.renderer.setClearColor(0xeedcb3);
            this.floodLight.color.setHex(0xffeedd);
            this.floodLight.intensity = 1.2;
            this.ambientLight.intensity = 0.75;
        } else {
            // night
            this.scene.background = new THREE.Color(0x05080e);
            this.renderer.setClearColor(0x05080e);
            this.floodLight.color.setHex(0xffffff);
            this.floodLight.intensity = 1.4;
            this.ambientLight.intensity = 0.6;
        }

        // Rebuild turf color
        this.buildStadium();
    }

    // --- GAME ENGINE LOOP ---
    animate(timestamp) {
        requestAnimationFrame(this.animate);
        const dt = 0.016;

        if (this.isPlaying) {
            this.updatePlayerMovement(dt);
            this.updateAI(dt);
            this.updateBallPhysics(dt);
            this.updateCamera();
            this.updateHUD(dt);
            this.checkTackleFouls(dt);
            this.updateWeatherParticles();
        }

        // Update indicator pointer above player
        if (this.activePlayer && this.selectorArrow) {
            this.selectorArrow.position.copy(this.activePlayer.position);
            this.selectorArrow.position.y = 2.3 + Math.sin(Date.now() * 0.005) * 0.12;
            this.selectorArrow.rotation.y += 0.02;
        }

        this.renderer.render(this.scene, this.camera);
    }

    updatePlayerMovement(dt) {
        if (!this.activePlayer) return;

        const dir = new THREE.Vector3(0, 0, 0);
        if (this.joystick.active) {
            dir.x = this.joystick.moveX;
            dir.z = this.joystick.moveY;
        } else {
            if (this.keys.w) dir.z -= 1;
            if (this.keys.s) dir.z += 1;
            if (this.keys.a) dir.x -= 1;
            if (this.keys.d) dir.x += 1;
        }

        if (dir.lengthSq() > 0) {
            dir.normalize();
            const speed = (this.stamina > 10) ? this.activePlayer.userData.speed * 1.35 : this.activePlayer.userData.speed * 0.8;
            this.activePlayer.position.addScaledVector(dir, speed * dt);
            this.activePlayer.rotation.y = Math.atan2(dir.x, dir.z);

            this.stamina = Math.max(0, this.stamina - dt * 5.0);

            // Sync online multiplayer if socket is active
            if (this.socket) {
                this.socket.emit('player_move', {
                    x: this.activePlayer.position.x,
                    y: this.activePlayer.position.y,
                    z: this.activePlayer.position.z,
                    rot: this.activePlayer.rotation.y
                });
            }
        } else {
            this.stamina = Math.min(100, this.stamina + dt * 8.0);
        }

        // Limit inside pitch
        this.activePlayer.position.x = THREE.MathUtils.clamp(this.activePlayer.position.x, -this.fieldWidth / 2 + 1, this.fieldWidth / 2 - 1);
        this.activePlayer.position.z = THREE.MathUtils.clamp(this.activePlayer.position.z, -this.fieldLength / 2 + 1, this.fieldLength / 2 - 1);
    }

    updateAI(dt) {
        const ball = this.ball;

        // HOME TEAM AI
        this.homeTeamPlayers.forEach(p => {
            if (p === this.activePlayer) return;
            if (p.userData.role === 'GK') {
                this.runGoalkeeperAI(p, true, dt);
            } else {
                this.runTeammateAI(p, false, dt);
            }
        });

        // AWAY TEAM AI (Opponents)
        this.awayTeamPlayers.forEach(p => {
            if (p.userData.role === 'GK') {
                this.runGoalkeeperAI(p, false, dt);
            } else {
                this.runTeammateAI(p, true, dt);
            }
        });
    }

    runGoalkeeperAI(gk, isHome, dt) {
        const targetZ = isHome ? 50 : -50;
        const distToBall = gk.position.distanceTo(this.ball.position);

        if (distToBall < 11.0) {
            // GK rushes to ball
            const dir = this.ball.position.clone().sub(gk.position);
            dir.y = 0;
            if (dir.length() > 0.4) {
                gk.position.addScaledVector(dir.normalize(), 6.0 * dt);
                gk.rotation.y = Math.atan2(dir.x, dir.z);
            } else {
                // Clear kick
                const clearDir = new THREE.Vector3(Math.random() * 2 - 1, 0.4, isHome ? -1 : 1).normalize();
                this.ball.position.copy(gk.position).add(clearDir.clone().multiplyScalar(0.8));
                this.ballVelocity.copy(clearDir.multiplyScalar(17.5));
                this.hasBallControl = false;
                gameAudio.playKick();
            }
        } else {
            // Stay inside box
            const defaultPos = new THREE.Vector3(0, 0, targetZ);
            const dir = defaultPos.clone().sub(gk.position);
            dir.y = 0;
            if (dir.length() > 0.4) {
                gk.position.addScaledVector(dir.normalize(), 4.0 * dt);
            }
        }

        // GK boundary limit
        gk.position.x = THREE.MathUtils.clamp(gk.position.x, -5.5, 5.5);
        gk.position.z = isHome ? THREE.MathUtils.clamp(gk.position.z, 44, 53) : THREE.MathUtils.clamp(gk.position.z, -53, -44);
    }

    runTeammateAI(p, isOpponent, dt) {
        if (p.userData.stunTime > 0) {
            p.userData.stunTime -= dt;
            return;
        }

        const distToBall = p.position.distanceTo(this.ball.position);

        // Coach AI: closest outfield teammate presses ball
        const team = isOpponent ? this.awayTeamPlayers : this.homeTeamPlayers;
        let isPressing = true;
        team.forEach(mate => {
            if (mate !== p && mate.userData.role !== 'GK') {
                if (mate.position.distanceTo(this.ball.position) < distToBall) {
                    isPressing = false;
                }
            }
        });

        if (isPressing && distToBall > 0.8) {
            const dir = this.ball.position.clone().sub(p.position);
            dir.y = 0;
            p.position.addScaledVector(dir.normalize(), p.userData.speed * dt);
            p.rotation.y = Math.atan2(dir.x, dir.z);
        } else {
            // Return to positional formation zone
            let defaultZ = 0;
            if (p.userData.role === 'DF') defaultZ = isOpponent ? -25 : 25;
            else if (p.userData.role === 'MF') defaultZ = isOpponent ? -10 : 10;
            else defaultZ = isOpponent ? -15 : 15;

            const homePos = new THREE.Vector3(p.userData.role === 'MF' ? -6 : 6, 0, defaultZ);
            const dir = homePos.clone().sub(p.position);
            dir.y = 0;
            if (dir.length() > 0.6) {
                p.position.addScaledVector(dir.normalize(), p.userData.speed * 0.65 * dt);
            }
        }
    }

    updateBallPhysics(dt) {
        // Rainy ob-havo grass friction = 0.991 (rolls faster/longer), normal = 0.982
        const grassFriction = this.weather === 'rain' ? 0.991 : 0.982;

        const distToActive = this.ball.position.distanceTo(this.activePlayer.position);
        
        if (distToActive < 1.15 && this.ballVelocity.length() < 3.2) {
            // Stick to user feet
            const offset = new THREE.Vector3(0, 0, 0.75).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ball.position.copy(this.activePlayer.position).add(offset);
            this.ball.position.y = this.ballRadius;
            this.hasBallControl = true;
            document.getElementById('hud-active-player').innerText = this.activePlayer.userData.name;
        } else {
            // Free movement physics
            this.ballVelocity.multiplyScalar(grassFriction);
            this.ball.position.addScaledVector(this.ballVelocity, dt);

            // Gravity height bounce
            if (this.ball.position.y > this.ballRadius) {
                this.ballVelocity.y -= 9.81 * dt;
            } else {
                this.ball.position.y = this.ballRadius;
                this.ballVelocity.y = -this.ballVelocity.y * 0.45; // damp bounce
            }

            // Boundary rebounds
            const halfW = this.fieldWidth / 2;
            const halfL = this.fieldLength / 2;

            if (Math.abs(this.ball.position.x) > halfW) {
                this.ball.position.x = Math.sign(this.ball.position.x) * halfW;
                this.ballVelocity.x *= -0.7;
            }

            if (Math.abs(this.ball.position.z) > halfL) {
                // Goal mouth check (width 10m)
                if (Math.abs(this.ball.position.x) < 5.0) {
                    if (this.ball.position.z < -halfL) {
                        this.triggerGoal(true); // Home scored
                    } else if (this.ball.position.z > halfL) {
                        this.triggerGoal(false); // Opponent scored
                    }
                } else {
                    this.ball.position.z = Math.sign(this.ball.position.z) * halfL;
                    this.ballVelocity.z *= -0.7;
                }
            }

            // Sync ball online if socket active
            if (this.socket && this.hasBallControl) {
                this.socket.emit('ball_sync', { x: this.ball.position.x, y: this.ball.position.y, z: this.ball.position.z });
            }
        }
    }

    checkTackleFouls(dt) {
        if (this.kickoffImmunityTime > 0) {
            this.kickoffImmunityTime -= dt;
            return;
        }
        if (this.foulCooldown > 0) {
            this.foulCooldown -= dt;
            return;
        }

        // Verify active slide contact
        if (this.activePlayer && this.activePlayer.userData.isSliding) {
            this.awayTeamPlayers.forEach(opponent => {
                if (opponent.userData.role !== 'GK') {
                    const dist = this.activePlayer.position.distanceTo(opponent.position);
                    
                    // Proximity < 1.25, high slide velocity, 65% chance of referee whistle
                    if (dist < 1.25 && Math.random() < 0.65) {
                        this.foulCooldown = 5.0; // cooldown
                        this.triggerFoul(this.activePlayer);
                    }
                }
            });
        }
    }

    updateWeatherParticles() {
        if (this.weather === 'rain' && this.rainSystem) {
            const positions = this.rainSystem.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.5; // speed
                if (positions[i] < 0) {
                    positions[i] = Math.random() * 30 + 3; // wrap
                }
            }
            this.rainSystem.geometry.attributes.position.needsUpdate = true;
        }
    }

    updateCamera() {
        const target = this.activePlayer.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(target, 0.1);
        this.camera.lookAt(this.activePlayer.position.x, 1.0, this.activePlayer.position.z - 4);
    }

    updateHUD(dt) {
        this.matchTime += dt;
        const mins = Math.floor(this.matchTime / 60).toString().padStart(2, '0');
        const secs = Math.floor(this.matchTime % 60).toString().padStart(2, '0');
        document.getElementById('match-timer').innerText = `${mins}:${secs}`;

        document.getElementById('stamina-fill').style.width = this.stamina + '%';

        // Check Match Over (90 seconds game time)
        if (this.matchTime >= 90) {
            this.isPlaying = false;
            document.getElementById('final-goals-val').innerText = this.homeScore;
            document.getElementById('final-opp-goals-val').innerText = this.awayScore;
            document.getElementById('game-over-modal').classList.remove('hidden');
            document.getElementById('game-hud').classList.add('hidden');
        }
    }

    // --- GAMEPLAY ACTIONS ---
    switchActivePlayer() {
        if (!this.homeTeamPlayers) return;
        const outfields = this.homeTeamPlayers.filter(p => p.userData.role !== 'GK');
        let currentIdx = outfields.indexOf(this.activePlayer);
        let nextIdx = (currentIdx + 1) % outfields.length;
        this.activePlayer = outfields[nextIdx];
        console.log(`[Switch] Control shifted to: ${this.activePlayer.userData.name}`);
    }

    executePass() {
        if (this.hasBallControl) {
            gameAudio.playKick();
            const dir = new THREE.Vector3(0, 0.08, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ballVelocity.copy(dir.multiplyScalar(17));
            this.hasBallControl = false;
        }
    }

    executeThroughPass() {
        if (this.hasBallControl) {
            gameAudio.playKick();
            const dir = new THREE.Vector3(0, 0.12, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ballVelocity.copy(dir.multiplyScalar(22));
            this.hasBallControl = false;
        }
    }

    executeShoot() {
        if (this.hasBallControl) {
            gameAudio.playKick();
            const dir = new THREE.Vector3(0, 0.35, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ballVelocity.copy(dir.multiplyScalar(27));
            this.hasBallControl = false;
        }
    }

    executeSlideTackle() {
        // Slide forward
        const slideDir = new THREE.Vector3(0, 0, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
        this.activePlayer.position.addScaledVector(slideDir, 4.5);
        this.activePlayer.userData.isSliding = true;

        setTimeout(() => {
            if (this.activePlayer && this.activePlayer.userData) {
                this.activePlayer.userData.isSliding = false;
            }
        }, 500);

        // Intercept/steal close opponent ball
        this.awayTeamPlayers.forEach(bot => {
            const dist = this.activePlayer.position.distanceTo(bot.position);
            if (dist < 1.8) {
                bot.userData.stunTime = 1.4;
                this.hasBallControl = true;
                this.ball.position.copy(this.activePlayer.position).add(new THREE.Vector3(0, 0.1, 0.5));
                this.ballVelocity.set(0,0,0);
                gameAudio.playKick();
            }
        });
    }

    triggerGoal(isHome) {
        if (isHome) this.homeScore++;
        else this.awayScore++;

        document.getElementById('hud-home-score').innerText = this.homeScore;
        document.getElementById('hud-away-score').innerText = this.awayScore;

        gameAudio.playGoalSound();
        if (window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

        const overlay = document.getElementById('goal-announcement');
        if (overlay) overlay.classList.remove('hidden');

        this.isPlaying = false;
        setTimeout(() => {
            if (overlay) overlay.classList.add('hidden');
            this.resetBall();
            this.isPlaying = true;
        }, 3000);
    }

    triggerFoul(player) {
        this.isPlaying = false;
        gameAudio.playWhistle();

        const overlay = document.getElementById('referee-card-overlay');
        const cardVisual = document.getElementById('card-type-visual');
        const nameEl = document.getElementById('card-player-name');

        if (nameEl) nameEl.innerText = player.userData.name;

        const isYellow = Math.random() > 0.45;
        if (cardVisual && overlay) {
            cardVisual.className = isYellow ? "ref-card yellow-card" : "ref-card red-card";
            overlay.classList.remove('hidden');

            if (!isYellow) {
                // Sent off the pitch
                setTimeout(() => {
                    player.position.set(0, -60, 0);
                }, 1000);
            }
        }

        setTimeout(() => {
            if (overlay) overlay.classList.add('hidden');
            this.resetBall();
            this.isPlaying = true;
        }, 3000);
    }

    resetBall() {
        this.ball.position.set(0, this.ballRadius, 0);
        this.ballVelocity.set(0, 0, 0);
        this.hasBallControl = false;

        this.kickoffImmunityTime = 5.0; // reset immunity!

        // Position home
        if (this.homeTeamPlayers && this.homeTeamPlayers.length >= 5) {
            this.homeTeamPlayers[0].position.set(0, 0, 48); // GK
            this.homeTeamPlayers[1].position.set(0, 0, 25); // DF
            this.homeTeamPlayers[2].position.set(-8, 0, 10); // MF
            this.homeTeamPlayers[3].position.set(0, 0, 2); // FW
            this.homeTeamPlayers[4].position.set(8, 0, 15); // SUB
            this.activePlayer = this.homeTeamPlayers[3];
        }

        // Position away
        if (this.awayTeamPlayers && this.awayTeamPlayers.length >= 5) {
            this.awayTeamPlayers[0].position.set(0, 0, -48); // GK
            this.awayTeamPlayers[1].position.set(0, 0, -25); // DF
            this.awayTeamPlayers[2].position.set(8, 0, -10);  // MF
            this.awayTeamPlayers[3].position.set(0, 0, -2);  // FW
            this.awayTeamPlayers[4].position.set(-8, 0, -15); // SUB
        }
    }

    // --- INTERACTIVE EVENTS & INPUTS ---
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
            const dx = e.clientX - this.joystick.startX;
            const dy = e.clientY - this.joystick.startY;
            const d = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const mx = Math.min(d, this.joystick.maxLimit) * Math.cos(angle);
            const my = Math.min(d, this.joystick.maxLimit) * Math.sin(angle);

            thumb.style.transform = `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`;
            this.joystick.moveX = mx / this.joystick.maxLimit;
            this.joystick.moveY = my / this.joystick.maxLimit;
        });

        window.addEventListener('pointerup', () => {
            this.joystick.active = false;
            this.joystick.moveX = 0;
            this.joystick.moveY = 0;
            thumb.style.transform = 'translate(-50%, -50%)';
        });
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w') this.keys.w = true;
            if (k === 's') this.keys.s = true;
            if (k === 'a') this.keys.a = true;
            if (k === 'd') this.keys.d = true;
            if (k === 'q') this.switchActivePlayer();
            if (k === 'k') this.executePass();
            if (k === 'i') this.executeThroughPass();
            if (k === ' ') this.executeShoot(); // Spacebar Shoot
            if (k === 'o') this.executeSlideTackle();
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w') this.keys.w = false;
            if (k === 's') this.keys.s = false;
            if (k === 'a') this.keys.a = false;
            if (k === 'd') this.keys.d = false;
        });

        // Mobile buttons
        document.getElementById('btn-switch').addEventListener('pointerdown', () => this.switchActivePlayer());
        document.getElementById('btn-shoot').addEventListener('pointerdown', () => this.executeShoot());
        document.getElementById('btn-through').addEventListener('pointerdown', () => this.executeThroughPass());
        document.getElementById('btn-pass').addEventListener('pointerdown', () => this.executePass());
        document.getElementById('btn-sprint').addEventListener('pointerdown', () => {
            this.stamina = Math.max(0, this.stamina - 20);
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.isPlaying = false;
            document.getElementById('main-menu').classList.remove('hidden');
            document.getElementById('game-hud').classList.add('hidden');
        });
    }

    renderMenuTeams() {
        const grid = document.getElementById('teams-selector-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        Object.keys(this.teamsDb).forEach(id => {
            const t = this.teamsDb[id];
            const btn = document.createElement('button');
            btn.className = `team-btn ${id === this.selectedTeam ? 'active' : ''}`;
            btn.innerHTML = `<span style="font-size:1.6rem">${t.flag}</span> ${t.name}`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('#teams-selector-grid .team-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTeam = id;
                // pick different random opponent
                const opps = Object.keys(this.teamsDb).filter(x => x !== id);
                this.selectedOpponent = opps[Math.floor(Math.random() * opps.length)];
                console.log(`Selected team: ${this.selectedTeam}, Opponent: ${this.selectedOpponent}`);
            });
            grid.appendChild(btn);
        });
    }

    bindMenuButtons() {
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                const t = e.currentTarget;
                t.classList.add('active');
                this.setupStadiumTheme(t.dataset.weather);
            });
        });

        document.getElementById('start-game-btn').addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-hud').classList.remove('hidden');

            const hTeam = this.teamsDb[this.selectedTeam];
            const aTeam = this.teamsDb[this.selectedOpponent];

            // Render HUD info
            document.getElementById('hud-home-name').innerText = this.selectedTeam;
            document.getElementById('hud-away-name').innerText = this.selectedOpponent;
            document.getElementById('hud-home-flag').innerText = hTeam.flag;
            document.getElementById('hud-away-flag').innerText = aTeam.flag;

            document.getElementById('hud-home-score').innerText = '0';
            document.getElementById('hud-away-score').innerText = '0';

            this.homeScore = 0;
            this.awayScore = 0;
            this.matchTime = 0;
            this.stamina = 100;
            
            // Build players & trigger kickoff whistle
            this.buildPlayers();
            this.resetBall();

            gameAudio.playWhistle();

            const banner = document.getElementById('referee-whistle-banner');
            banner.classList.remove('hidden');
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 2000);

            this.isPlaying = true;
        });

        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => {
            document.getElementById('game-over-modal').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        });
    }

    loadLeaderboard() {
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                const list = document.getElementById('leaderboard-list');
                if (!list) return;
                list.innerHTML = '';
                data.forEach((item, index) => {
                    const row = document.createElement('div');
                    row.className = 'leaderboard-item';
                    row.innerHTML = `<span>#${index+1} ${item.name}</span> <span style="color:var(--primary); font-weight:bold">${item.score} pts</span>`;
                    list.appendChild(row);
                });
            })
            .catch(err => console.warn("Leaderboard loading failed:", err));
    }

    saveScore() {
        const input = document.getElementById('player-name-input');
        const name = input ? input.value.trim() : "Kapitan";
        const score = (this.homeScore * 150) + 100; // calculate simple performance score
        const club = this.teamsDb[this.selectedTeam].name;

        fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score, club })
        })
        .then(res => res.json())
        .then(() => {
            alert("Sizning natijangiz muvaffaqiyatli saqlandi!");
            this.loadLeaderboard();
            document.getElementById('game-over-modal').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        })
        .catch(err => alert("Natija saqlashda xatolik yuz berdi."));
    }
}

// Instantiate on startup
window.addEventListener('DOMContentLoaded', () => {
    window.matchInstance = new UltraFootballMatch();
});
