// ===================================================
// FC MOBILE 3D - ULTIMATE UNIFIED MATCH ENGINE v3.1
// Featuring programmatic Canvas pitch, synthesized audio,
// 5v5 teams, GK box limits, and 4 interactive drills.
// ===================================================

// --- PROGRAMMATIC SOUND SYNTHESIZER ---
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
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
        osc.frequency.setValueAtTime(1400, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(1700, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    playKick() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(155, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
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
        filter.frequency.value = 460;
        filter.Q.value = 1.2;

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

// --- ULTRA FOOTBALL MATCH ENGINE ---
class UltraFootballMatch {
    constructor() {
        this.container = document.getElementById('webgl-container');
        
        // Settings
        this.selectedTeam = 'POR';
        this.selectedOpponent = 'BRA';
        this.weather = 'night';
        this.selectedMode = 'match'; // 'match' or 'training'
        this.selectedDrill = 'dribble'; // 'dribble', 'pass', 'shoot', 'tackle'
        this.isTraining = false;
        this.cameraModes = ['broadcast', 'action', 'tactical'];
        this.cameraModeIdx = 0;

        // States
        this.homeScore = 0;
        this.awayScore = 0;
        this.matchTime = 0;
        this.isPlaying = false;
        this.activePlayer = null;
        this.hasBallControl = false;
        this.stamina = 100;

        // Rules
        this.kickoffImmunityTime = 5.0;
        this.foulCooldown = 0;

        // Dimensions
        this.fieldWidth = 70;
        this.fieldLength = 110;
        this.ballRadius = 0.24;

        // Database
        this.teamsDb = {
            UZB: { name: 'O\'ZBEKISTON', flag: '🇺🇿', color: 0x00c3ff },
            POR: { name: 'PORTUGAL', flag: '🇵🇹', color: 0xff0000 },
            BRA: { name: 'BRAZIL', flag: '🇧🇷', color: 0xe6c300 },
            ARG: { name: 'ARGENTINA', flag: '🇦🇷', color: 0x009ee3 },
            ESP: { name: 'SPAIN', flag: '🇪🇸', color: 0xd91a1a },
            GER: { name: 'GERMANY', flag: '🇩🇪', color: 0x222222 },
            FRA: { name: 'FRANCE', flag: '🇫🇷', color: 0x002395 },
            ITA: { name: 'ITALY', flag: '🇮🇹', color: 0x008c45 }
        };

        // Controls
        this.keys = { w: false, a: false, s: false, d: false };
        this.joystick = { active: false, startX: 0, startY: 0, moveX: 0, moveY: 0, maxLimit: 50 };

        this.trainingProps = [];

        // Build WebGL & scene
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

        // 3D Intro settings
        this.introRunning = true;
        this.introTime = 0;
        this.introKicked = false;
        this.introGoalScored = false;
        this.setupIntroPositions();

        // Animation loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupIntroPositions() {
        if (!this.homeTeamPlayers || this.homeTeamPlayers.length < 5) return;
        
        const ronaldo = this.homeTeamPlayers[3]; // C. Ronaldo
        const gk = this.homeTeamPlayers[0]; // GK

        ronaldo.position.set(0, 0, 31);
        this.ball.position.set(0, this.ballRadius, 36.5);
        
        const gkOpponent = this.awayTeamPlayers[0];
        gkOpponent.position.set(0, 0, 54.5);
        gkOpponent.rotation.set(0, 0, 0);

        this.homeTeamPlayers.forEach(p => {
            if (p !== ronaldo && p !== gk) p.position.set(0, -50, 0);
        });
        this.awayTeamPlayers.forEach(p => {
            if (p !== gkOpponent) p.position.set(0, -50, 0);
        });

        this.camera.position.set(-6, 3.8, 25);
        this.camera.lookAt(0, 1.5, 42);
    }

    updateIntro(dt) {
        this.introTime += dt;

        const pBar = document.getElementById('progress-bar');
        const progress = Math.min(100, Math.floor((this.introTime / 3.8) * 100));
        if (pBar) pBar.style.width = progress + '%';

        const ronaldo = this.homeTeamPlayers[3];
        const gkOpponent = this.awayTeamPlayers[0];

        this.camera.position.set(-6, 3.8, 25);
        this.camera.lookAt(0, 1.5, 42);

        if (this.introTime < 1.1) {
            ronaldo.position.z += 5.2 * dt;
            const cycle = Date.now() * 0.015;
            ronaldo.userData.leftLegGroup.rotation.x = Math.sin(cycle) * 0.75;
            ronaldo.userData.rightLegGroup.rotation.x = -Math.sin(cycle) * 0.75;
        }
        else if (!this.introKicked) {
            this.introKicked = true;
            ronaldo.userData.leftLegGroup.rotation.x = 0;
            ronaldo.userData.rightLegGroup.rotation.x = 0;
            this.ballVelocity.set(1.15, 2.55, 17.5);
            gameAudio.playKick();
        }

        if (this.introKicked && this.introTime < 2.5) {
            gkOpponent.position.x -= 2.0 * dt;
            gkOpponent.position.y += 0.8 * dt;
            gkOpponent.rotation.z += 0.35 * dt;
        }

        if (this.ball.position.z > 54.5 && !this.introGoalScored) {
            this.introGoalScored = true;
            gameAudio.playGoalSound();
            if (window.confetti) window.confetti({ particleCount: 70, spread: 50 });
        }

        if (this.introTime >= 3.8) {
            this.introRunning = false;
            document.getElementById('loading-screen').classList.add('hidden');
            this.resetBall();
            
            if (!localStorage.getItem('fc_mobile_3d_profile_configured')) {
                document.getElementById('profile-setup-modal').classList.remove('hidden');
            } else {
                document.getElementById('main-menu').classList.remove('hidden');
                this.renderDashboard();
            }
        }
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05080e, 0.0055);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
        this.cameraOffset = new THREE.Vector3(0, 13, 19);
        this.camera.position.set(0, 15, 25);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.58);
        this.scene.add(this.ambientLight);

        this.floodLight = new THREE.DirectionalLight(0xffffff, 1.45);
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
        if (this.pitch) {
            this.scene.remove(this.pitch);
            if (this.pitch.geometry) this.pitch.geometry.dispose();
            if (this.pitch.material) {
                if (this.pitch.material.map) this.pitch.material.map.dispose();
                this.pitch.material.dispose();
            }
        }

        if (this.stands) {
            this.stands.forEach(obj => this.scene.remove(obj));
        }
        this.stands = [];

        const texture = this.generateFieldTexture();
        const pitchGeo = new THREE.PlaneGeometry(this.fieldWidth + 20, this.fieldLength + 20);
        const pitchMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.85
        });
        
        this.pitch = new THREE.Mesh(pitchGeo, pitchMat);
        this.pitch.rotation.x = -Math.PI / 2;
        this.pitch.receiveShadow = true;
        this.scene.add(this.pitch);

        // Build sideline stands
        const standMat = new THREE.MeshStandardMaterial({ color: 0x1f232a, roughness: 0.8 });
        
        const leftStand = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, this.fieldLength + 10),
            standMat
        );
        leftStand.position.set(-this.fieldWidth/2 - 7, 2.5, 0);
        leftStand.receiveShadow = true;
        this.scene.add(leftStand);
        this.stands.push(leftStand);

        const rightStand = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, this.fieldLength + 10),
            standMat
        );
        rightStand.position.set(this.fieldWidth/2 + 7, 2.5, 0);
        rightStand.receiveShadow = true;
        this.scene.add(rightStand);
        this.stands.push(rightStand);

        // Populate colorful crowd capsule spectators
        const specGeo = new THREE.SphereGeometry(0.18, 6, 6);
        const colors = [0xff3333, 0x3333ff, 0x33ff33, 0xffff33, 0xff33ff, 0x33ffff, 0xffffff, 0xaaaaaa];
        
        for (let z = -this.fieldLength/2; z < this.fieldLength/2; z += 3.8) {
            // Left stands fans
            const f1 = new THREE.Mesh(specGeo, new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random()*colors.length)] }));
            f1.position.set(-this.fieldWidth/2 - 5.5, 5.2, z);
            this.scene.add(f1);
            this.stands.push(f1);

            const f2 = new THREE.Mesh(specGeo, new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random()*colors.length)] }));
            f2.position.set(-this.fieldWidth/2 - 7.5, 5.6, z + 1);
            this.scene.add(f2);
            this.stands.push(f2);

            // Right stands fans
            const f3 = new THREE.Mesh(specGeo, new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random()*colors.length)] }));
            f3.position.set(this.fieldWidth/2 + 5.5, 5.2, z);
            this.scene.add(f3);
            this.stands.push(f3);

            const f4 = new THREE.Mesh(specGeo, new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random()*colors.length)] }));
            f4.position.set(this.fieldWidth/2 + 7.5, 5.6, z + 1);
            this.scene.add(f4);
            this.stands.push(f4);
        }
    }

    generateFieldTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');

        const isDesert = (this.weather === 'desert');
        const isRain = (this.weather === 'rain');

        // Choose beautiful alternating stripe shades based on stadium theme
        let col1 = '#1d5422';
        let col2 = '#236128';
        if (isDesert) {
            col1 = '#d8b68a';
            col2 = '#cfab7f';
        } else if (isRain) {
            col1 = '#133d17';
            col2 = '#184b1d';
        }

        ctx.fillStyle = col1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 18 grass stripes
        const stripes = 18;
        const stripeHeight = canvas.height / stripes;
        for (let i = 0; i < stripes; i++) {
            ctx.fillStyle = (i % 2 === 0) ? col2 : col1;
            ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
        }

        // Draw professional white lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 14;

        const padX = 40;
        const padY = 60;
        const w = canvas.width - padX * 2;
        const h = canvas.height - padY * 2;

        // Boundary lines
        ctx.strokeRect(padX, padY, w, h);

        // Center line
        ctx.beginPath();
        ctx.moveTo(padX, canvas.height / 2);
        ctx.lineTo(canvas.width - padX, canvas.height / 2);
        ctx.stroke();

        // Center circle
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 160, 0, Math.PI * 2);
        ctx.stroke();

        // Center spot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Penalty boxes
        const boxWidth = 440;
        const boxHeight = 220;
        const goalAreaWidth = 180;
        const goalAreaHeight = 70;

        // Bottom Penalty Box (Home)
        ctx.strokeRect(canvas.width / 2 - boxWidth / 2, canvas.height - padY - boxHeight, boxWidth, boxHeight);
        ctx.strokeRect(canvas.width / 2 - goalAreaWidth / 2, canvas.height - padY - goalAreaHeight, goalAreaWidth, goalAreaHeight);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height - padY - boxHeight, 70, Math.PI, 2 * Math.PI);
        ctx.stroke();

        // Top Penalty Box (Away)
        ctx.strokeRect(canvas.width / 2 - boxWidth / 2, padY, boxWidth, boxHeight);
        ctx.strokeRect(canvas.width / 2 - goalAreaWidth / 2, padY, goalAreaWidth, goalAreaHeight);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, padY + boxHeight, 70, 0, Math.PI);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        return tex;
    }

    buildGoals() {
        const goalFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 5, 8);
        const barGeo = new THREE.CylinderGeometry(0.12, 0.12, 10, 8);

        // Home goal
        const postLeftH = new THREE.Mesh(postGeo, goalFrameMat);
        postLeftH.position.set(-5, 2.5, 55);
        const postRightH = new THREE.Mesh(postGeo, goalFrameMat);
        postRightH.position.set(5, 2.5, 55);
        const barH = new THREE.Mesh(barGeo, goalFrameMat);
        barH.rotation.z = Math.PI / 2;
        barH.position.set(0, 5, 55);
        this.scene.add(postLeftH, postRightH, barH);

        // Away goal
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
        const tex = this.generateBallTexture();
        const ballGeo = new THREE.SphereGeometry(this.ballRadius, 16, 16);
        const ballMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.15
        });
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.castShadow = true;
        this.ball.position.set(0, this.ballRadius, 0);
        this.scene.add(this.ball);

        this.ballVelocity = new THREE.Vector3(0, 0, 0);
    }

    generateBallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // White ball base
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw classic Telstar soccer spots
        ctx.fillStyle = '#1e1e24';
        const rows = 4;
        const cols = 8;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c) % 2 === 0) {
                    const x = (c + 0.5) * (canvas.width / cols);
                    const y = (r + 0.5) * (canvas.height / rows);
                    
                    // pentagon center spot
                    ctx.beginPath();
                    ctx.arc(x, y, 22, 0, Math.PI * 2);
                    ctx.fill();

                    // seam outline
                    ctx.strokeStyle = '#cccccc';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, 32, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Seams grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < canvas.width; i += 64) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    buildPlayers() {
        if (this.homeTeamPlayers) {
            this.homeTeamPlayers.forEach(p => this.scene.remove(p));
            this.awayTeamPlayers.forEach(p => this.scene.remove(p));
        }

        this.homeTeamPlayers = [];
        this.awayTeamPlayers = [];

        const db = window.gameDb;
        const profile = db.state.profile;
        const squad = db.getActiveSquadPlayers();
        const formation = profile.activeFormation;

        const hColor = profile.logoColor;
        const aColor = this.teamsDb[this.selectedOpponent].color;

        // HOME TEAM
        const gkHome = this.createPlayerMesh(0xff9900, "GK", squad.GK.name);
        gkHome.position.set(0, 0, 48);

        const dfHome = this.createPlayerMesh(hColor, "DF", squad.DF.name);
        const mfHome = this.createPlayerMesh(hColor, "MF", squad.MF.name);
        const fwHome = this.createPlayerMesh(hColor, "FW", squad.FW.name);
        const subHome = this.createPlayerMesh(hColor, "SUB", squad.SUB.name);

        if (formation === '4-4-2') {
            dfHome.position.set(-6, 0, 25);
            mfHome.position.set(-8, 0, 12);
            fwHome.position.set(-3, 0, 2);
            subHome.position.set(8, 0, 12);
        } else if (formation === '3-5-2') {
            dfHome.position.set(0, 0, 25);
            mfHome.position.set(-8, 0, 10);
            fwHome.position.set(-3, 0, 2);
            subHome.position.set(8, 0, 10);
        } else { // 4-3-3 (default)
            dfHome.position.set(0, 0, 25);
            mfHome.position.set(-8, 0, 12);
            fwHome.position.set(0, 0, 2);
            subHome.position.set(8, 0, 10);
        }

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

        this.activePlayer = fwHome;
    }

    createPlayerMesh(shirtColor, role, name) {
        const group = new THREE.Group();

        // 1. Torso Jersey (Slightly enlarged height and thickness)
        const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.58 });
        const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.22, 1.05, 10),
            torsoMat
        );
        torso.position.y = 1.05;
        torso.castShadow = true;
        group.add(torso);

        // 2. Shorts (Enlarged)
        const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.65 });
        const shorts = new THREE.Mesh(
            new THREE.CylinderGeometry(0.27, 0.27, 0.28, 10),
            shortsMat
        );
        shorts.position.y = 0.62;
        group.add(shorts);

        // 3. Head & skin (Enlarged)
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.72 });
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.21, 10, 10),
            skinMat
        );
        head.position.y = 1.72;
        group.add(head);

        // 4. Hair (Enlarged)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x2d1d17, roughness: 0.8 });
        const hair = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 8, 8),
            hairMat
        );
        hair.position.set(0, 1.82, -0.05);
        group.add(hair);

        // 5. Left Leg Group (pivot at hip joint Y = 0.55)
        const socksMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const bootsMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.45 });

        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.14, 0.55, 0);

        const leftLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.48, 8),
            socksMat
        );
        leftLeg.position.y = -0.24;
        leftLegGroup.add(leftLeg);

        const leftBoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.1, 0.24),
            bootsMat
        );
        leftBoot.position.set(0, -0.48, 0.06);
        leftLegGroup.add(leftBoot);
        group.add(leftLegGroup);

        // 6. Right Leg Group
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.14, 0.55, 0);

        const rightLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.48, 8),
            socksMat
        );
        rightLeg.position.y = -0.24;
        rightLegGroup.add(rightLeg);

        const rightBoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.1, 0.24),
            bootsMat
        );
        rightBoot.position.set(0, -0.48, 0.06);
        rightLegGroup.add(rightBoot);
        group.add(rightLegGroup);

        // 7. Arms (Enlarged)
        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.65, 8),
            torsoMat
        );
        leftArm.position.set(-0.38, 1.1, 0);
        leftArm.rotation.z = 0.2;
        group.add(leftArm);

        const rightArm = leftArm.clone();
        rightArm.position.set(0.38, 1.1, 0);
        rightArm.rotation.z = -0.2;
        group.add(rightArm);

        // 8. Face Eyes (Black spheres looking forward Z > 0)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const eyeGeo = new THREE.SphereGeometry(0.035, 4, 4);
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.07, 1.76, 0.17);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.07, 1.76, 0.17);
        group.add(rightEye);

        // 9. Hands (Skin colored spheres at the end of arms)
        const handGeo = new THREE.SphereGeometry(0.06, 6, 6);
        
        const leftHand = new THREE.Mesh(handGeo, skinMat);
        leftHand.position.set(-0.43, 0.78, 0.06);
        group.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, skinMat);
        rightHand.position.set(0.43, 0.78, 0.06);
        group.add(rightHand);

        // 10. Squad Number / Name strings
        let numStr = "10";
        if (role === 'GK') numStr = "1";
        else if (role === 'DF') numStr = "4";
        else if (role === 'FW') numStr = "7";
        else if (role === 'SUB') numStr = "12";

        // FRONT Jersey Chest Number (small, left chest area)
        const frontCanvas = document.createElement('canvas');
        frontCanvas.width = 64;
        frontCanvas.height = 64;
        const frontCtx = frontCanvas.getContext('2d');
        frontCtx.clearRect(0, 0, 64, 64);
        frontCtx.fillStyle = '#ffffff';
        frontCtx.font = 'bold 44px sans-serif';
        frontCtx.textAlign = 'center';
        frontCtx.textBaseline = 'middle';
        frontCtx.fillText(numStr, 32, 32);

        const frontTex = new THREE.CanvasTexture(frontCanvas);
        const frontPlate = new THREE.Mesh(
            new THREE.PlaneGeometry(0.12, 0.12),
            new THREE.MeshBasicMaterial({ map: frontTex, transparent: true, side: THREE.DoubleSide })
        );
        frontPlate.position.set(-0.11, 1.22, 0.29); // left chest
        group.add(frontPlate);

        // BACK Jersey: Player Name + large Squad Number (Z < 0)
        const backCanvas = document.createElement('canvas');
        backCanvas.width = 128;
        backCanvas.height = 128;
        const backCtx = backCanvas.getContext('2d');
        backCtx.clearRect(0, 0, 128, 128);
        
        // Render name (shortened)
        const displayName = name.split(" ")[0].toUpperCase();
        backCtx.fillStyle = '#ffffff';
        backCtx.font = 'bold 20px sans-serif';
        backCtx.textAlign = 'center';
        backCtx.textBaseline = 'middle';
        backCtx.fillText(displayName, 64, 28);

        // Render squad number
        backCtx.font = 'bold 68px sans-serif';
        backCtx.fillText(numStr, 64, 78);

        const backTex = new THREE.CanvasTexture(backCanvas);
        const backPlate = new THREE.Mesh(
            new THREE.PlaneGeometry(0.35, 0.35),
            new THREE.MeshBasicMaterial({ map: backTex, transparent: true, side: THREE.DoubleSide })
        );
        backPlate.position.set(0, 1.15, -0.29);
        backPlate.rotation.y = Math.PI; // facing backward
        group.add(backPlate);

        group.userData = {
            role,
            name,
            speed: 8.5,
            isSliding: false,
            stunTime: 0,
            leftLegGroup,
            rightLegGroup
        };

        return group;
    }

    buildSelectorArrow() {
        const geo = new THREE.ConeGeometry(0.2, 0.5, 4);
        geo.rotateX(Math.PI);
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

        this.buildStadium();
    }

    // --- MAIN ENGINE LOOP ---
    animate(timestamp) {
        requestAnimationFrame(this.animate);
        const dt = 0.016;

        if (this.introRunning) {
            this.updateIntro(dt);
            this.updateWeatherParticles();
        }
        else if (this.penaltyModeActive) {
            this.updateHeroPenalty(dt);
            this.updateWeatherParticles();
        }
        else if (this.isPlaying) {
            this.updatePlayerMovement(dt);
            this.updateAI(dt);
            this.updateBallPhysics(dt);
            this.updateCamera();
            this.updateHUD(dt);
            this.checkTackleFouls(dt);
            this.updateWeatherParticles();
            this.updateRadar();
            this.animatePlayerLegs(dt);

            if (this.selectedMode === 'training') {
                this.checkTrainingCollisions(dt);
            }
        }

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
        } else {
            this.stamina = Math.min(100, this.stamina + dt * 8.0);
        }

        this.activePlayer.position.x = THREE.MathUtils.clamp(this.activePlayer.position.x, -this.fieldWidth / 2 + 1, this.fieldWidth / 2 - 1);
        this.activePlayer.position.z = THREE.MathUtils.clamp(this.activePlayer.position.z, -this.fieldLength / 2 + 1, this.fieldLength / 2 - 1);
    }

    updateAI(dt) {
        this.homeTeamPlayers.forEach(p => {
            if (p === this.activePlayer) return;
            if (p.userData.role === 'GK') {
                this.runGoalkeeperAI(p, true, dt);
            } else {
                this.runTeammateAI(p, false, dt);
            }
        });

        this.awayTeamPlayers.forEach(p => {
            if (p.userData.role === 'GK') {
                this.runGoalkeeperAI(p, false, dt);
            } else {
                if (this.selectedMode !== 'training') {
                    this.runTeammateAI(p, true, dt);
                }
            }
        });
    }

    runGoalkeeperAI(gk, isHome, dt) {
        const targetZ = isHome ? 50 : -50;
        const distToBall = gk.position.distanceTo(this.ball.position);

        if (distToBall < 11.0) {
            const dir = this.ball.position.clone().sub(gk.position);
            dir.y = 0;
            if (dir.length() > 0.4) {
                gk.position.addScaledVector(dir.normalize(), 6.0 * dt);
                gk.rotation.y = Math.atan2(dir.x, dir.z);
            } else {
                const clearDir = new THREE.Vector3(Math.random() * 2 - 1, 0.4, isHome ? -1 : 1).normalize();
                this.ball.position.copy(gk.position).add(clearDir.clone().multiplyScalar(0.8));
                this.ballVelocity.copy(clearDir.multiplyScalar(17.5));
                this.hasBallControl = false;
                gameAudio.playKick();
            }
        } else {
            const defaultPos = new THREE.Vector3(0, 0, targetZ);
            const dir = defaultPos.clone().sub(gk.position);
            dir.y = 0;
            if (dir.length() > 0.4) {
                gk.position.addScaledVector(dir.normalize(), 4.0 * dt);
            }
        }

        gk.position.x = THREE.MathUtils.clamp(gk.position.x, -5.5, 5.5);
        gk.position.z = isHome ? THREE.MathUtils.clamp(gk.position.z, 44, 53) : THREE.MathUtils.clamp(gk.position.z, -53, -44);
    }

    runTeammateAI(p, isOpponent, dt) {
        if (p.userData.stunTime > 0) {
            p.userData.stunTime -= dt;
            return;
        }

        const distToBall = p.position.distanceTo(this.ball.position);
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
            let defaultZ = isOpponent ? -15 : 15;
            if (p.userData.role === 'DF') defaultZ = isOpponent ? -25 : 25;
            else if (p.userData.role === 'MF') defaultZ = isOpponent ? -10 : 10;

            const homePos = new THREE.Vector3(p.userData.role === 'MF' ? -6 : 6, 0, defaultZ);
            const dir = homePos.clone().sub(p.position);
            dir.y = 0;
            if (dir.length() > 0.6) {
                p.position.addScaledVector(dir.normalize(), p.userData.speed * 0.65 * dt);
            }
        }
    }

    updateBallPhysics(dt) {
        const grassFriction = this.weather === 'rain' ? 0.991 : 0.982;
        const distToActive = this.ball.position.distanceTo(this.activePlayer.position);
        
        if (distToActive < 1.15 && this.ballVelocity.length() < 3.2) {
            const offset = new THREE.Vector3(0, 0, 0.75).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
            this.ball.position.copy(this.activePlayer.position).add(offset);
            this.ball.position.y = this.ballRadius;
            this.hasBallControl = true;
            document.getElementById('hud-active-player').innerText = this.activePlayer.userData.name;
        } else {
            this.ballVelocity.multiplyScalar(grassFriction);
            this.ball.position.addScaledVector(this.ballVelocity, dt);

            if (this.ball.position.y > this.ballRadius) {
                this.ballVelocity.y -= 9.81 * dt;
            } else {
                this.ball.position.y = this.ballRadius;
                this.ballVelocity.y = -this.ballVelocity.y * 0.45;
            }

            const halfW = this.fieldWidth / 2;
            const halfL = this.fieldLength / 2;

            if (Math.abs(this.ball.position.x) > halfW) {
                this.ball.position.x = Math.sign(this.ball.position.x) * halfW;
                this.ballVelocity.x *= -0.7;
            }

            if (Math.abs(this.ball.position.z) > halfL) {
                if (Math.abs(this.ball.position.x) < 5.0) {
                    if (this.ball.position.z < -halfL) {
                        this.triggerGoal(true);
                    } else if (this.ball.position.z > halfL) {
                        this.triggerGoal(false);
                    }
                } else {
                    this.ball.position.z = Math.sign(this.ball.position.z) * halfL;
                    this.ballVelocity.z *= -0.7;
                }
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

        if (this.activePlayer && this.activePlayer.userData.isSliding) {
            this.awayTeamPlayers.forEach(opponent => {
                if (opponent.userData.role !== 'GK') {
                    const dist = this.activePlayer.position.distanceTo(opponent.position);
                    if (dist < 1.25 && Math.random() < 0.65) {
                        this.foulCooldown = 5.0;
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
                positions[i] -= 0.5;
                if (positions[i] < 0) {
                    positions[i] = Math.random() * 30 + 3;
                }
            }
            this.rainSystem.geometry.attributes.position.needsUpdate = true;
        }
    }

    updateCamera() {
        const mode = this.cameraModes[this.cameraModeIdx];
        const targetPos = new THREE.Vector3();

        if (mode === 'broadcast') {
            targetPos.set(this.activePlayer.position.x, 14, this.activePlayer.position.z + 18);
            this.camera.position.lerp(targetPos, 0.1);
            this.camera.lookAt(this.activePlayer.position.x, 1.0, this.activePlayer.position.z - 3);
        } else if (mode === 'action') {
            const angle = this.activePlayer.rotation.y;
            const backX = this.activePlayer.position.x - Math.sin(angle) * 7.5;
            const backZ = this.activePlayer.position.z - Math.cos(angle) * 7.5;
            targetPos.set(backX, 4.5, backZ);
            this.camera.position.lerp(targetPos, 0.15);
            this.camera.lookAt(this.activePlayer.position.x + Math.sin(angle) * 3, 1.2, this.activePlayer.position.z + Math.cos(angle) * 3);
        } else if (mode === 'tactical') {
            targetPos.set(this.activePlayer.position.x, 28, this.activePlayer.position.z + 0.1);
            this.camera.position.lerp(targetPos, 0.08);
            this.camera.lookAt(this.activePlayer.position.x, 0, this.activePlayer.position.z);
        }
    }

    executeFeint() {
        if (!this.activePlayer || this.activePlayer.userData.stunTime > 0 || this.activePlayer.userData.isFeinting) return;
        this.activePlayer.userData.isFeinting = true;

        const origSpeed = this.activePlayer.userData.speed;
        this.activePlayer.userData.speed = origSpeed * 1.85;

        // Programmatic synth sound (pitch sweep)
        gameAudio.init();
        if (gameAudio.ctx) {
            const now = gameAudio.ctx.currentTime;
            const osc = gameAudio.ctx.createOscillator();
            const gain = gameAudio.ctx.createGain();
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(1100, now + 0.22);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(gameAudio.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        }

        // Spin player
        let spinCount = 0;
        const spinInterval = setInterval(() => {
            if (this.activePlayer) {
                this.activePlayer.rotation.y += 0.63;
            }
            spinCount++;
            if (spinCount >= 10) {
                clearInterval(spinInterval);
                if (this.activePlayer && this.activePlayer.userData) {
                    this.activePlayer.userData.isFeinting = false;
                    this.activePlayer.userData.speed = origSpeed;
                }
            }
        }, 25);
    }

    updateRadar() {
        const canvas = document.getElementById('radar-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Radar background and field boundaries
        ctx.fillStyle = 'rgba(3, 6, 12, 0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

        ctx.beginPath();
        ctx.moveTo(8, canvas.height / 2);
        ctx.lineTo(canvas.width - 8, canvas.height / 2);
        ctx.stroke();

        // Mapping coordinate ratio helpers (Field width 70, length 110)
        const mapX = (x) => {
            const ratio = (x + 35) / 70;
            return 8 + ratio * (canvas.width - 16);
        };
        const mapZ = (z) => {
            const ratio = (z + 55) / 110;
            return 8 + ratio * (canvas.height - 16);
        };

        // Draw home players (blue / green active)
        if (this.homeTeamPlayers) {
            this.homeTeamPlayers.forEach(p => {
                ctx.fillStyle = (p === this.activePlayer) ? '#02f87b' : '#1e90ff';
                ctx.beginPath();
                ctx.arc(mapX(p.position.x), mapZ(p.position.z), (p === this.activePlayer) ? 4.5 : 3, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw away players (red)
        if (this.awayTeamPlayers && this.selectedMode !== 'training') {
            this.awayTeamPlayers.forEach(p => {
                ctx.fillStyle = '#ff3333';
                ctx.beginPath();
                ctx.arc(mapX(p.position.x), mapZ(p.position.z), 3, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw ball (white)
        if (this.ball) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(mapX(this.ball.position.x), mapZ(this.ball.position.z), 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    updateHUD(dt) {
        this.matchTime += dt;
        const mins = Math.floor(this.matchTime / 60).toString().padStart(2, '0');
        const secs = Math.floor(this.matchTime % 60).toString().padStart(2, '0');
        document.getElementById('match-timer').innerText = `${mins}:${secs}`;
        document.getElementById('stamina-fill').style.width = this.stamina + '%';

        // Add some random commentary during the game
        if (Math.random() < 0.0015) {
            const comments = [
                "Jamoalar to'p uchun keskin kurash olib borishmoqda!",
                "Ajoyib paslar uzatilmoqda, stadion gulduramoqda!",
                "Muxlislar hayqirig'i jamoalarga kuch bag'ishlayapti!",
                "Darvozabon xushyorlikni yo'qotganicha yo'q!"
            ];
            this.addCommentary(comments[Math.floor(Math.random() * comments.length)]);
        }

        if (this.matchTime >= 90) {
            this.isPlaying = false;
            document.getElementById('final-goals-val').innerText = this.homeScore;
            document.getElementById('final-opp-goals-val').innerText = this.awayScore;
            document.getElementById('game-over-modal').classList.remove('hidden');
            document.getElementById('game-hud').classList.add('hidden');
            
            // Record stats in local database
            window.gameDb.updateStats(this.homeScore > this.awayScore);
            window.gameDb.incrementGoals(this.homeScore);
        }
    }

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
        const slideDir = new THREE.Vector3(0, 0, 0.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.activePlayer.rotation.y);
        this.activePlayer.position.addScaledVector(slideDir, 4.5);
        this.activePlayer.userData.isSliding = true;

        setTimeout(() => {
            if (this.activePlayer && this.activePlayer.userData) {
                this.activePlayer.userData.isSliding = false;
            }
        }, 500);

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
        if (isHome) {
            this.homeScore++;
            window.gameDb.incrementGoals(1);
            this.addCommentary(`GOOOOL!!! ${this.activePlayer.userData.name} raqib darvozasini ishg'ol etdi!`);
        } else {
            this.awayScore++;
            this.addCommentary("Gol! Raqib jamoa hisobni o'zgartirdi!");
        }

        document.getElementById('hud-home-score').innerText = this.homeScore;
        document.getElementById('hud-away-score').innerText = this.awayScore;

        gameAudio.playGoalSound();
        if (window.confetti) window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

        const speedText = document.getElementById('goal-speed-text');
        if (speedText) {
            const scorerName = isHome ? this.activePlayer.userData.name : "OPPONENT FW";
            speedText.innerHTML = `GOL MUALLIFI: <span style="color:#02f87b; font-weight:900">${scorerName}</span> ⚽🔥`;
        }

        const overlay = document.getElementById('goal-announcement');
        if (overlay) overlay.classList.remove('hidden');

        this.startReplaySequence(isHome);
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
        this.kickoffImmunityTime = 5.0;

        const db = window.gameDb;
        const profile = db.state.profile;
        const formation = profile.activeFormation;

        if (this.homeTeamPlayers && this.homeTeamPlayers.length >= 5) {
            this.homeTeamPlayers[0].position.set(0, 0, 48); // GK
            
            if (formation === '4-4-2') {
                this.homeTeamPlayers[1].position.set(-6, 0, 25); // DF
                this.homeTeamPlayers[2].position.set(-8, 0, 12); // MF
                this.homeTeamPlayers[3].position.set(-3, 0, 2);  // FW
                this.homeTeamPlayers[4].position.set(8, 0, 12);  // SUB (active second MF)
            } else if (formation === '3-5-2') {
                this.homeTeamPlayers[1].position.set(0, 0, 25);  // DF
                this.homeTeamPlayers[2].position.set(-8, 0, 10); // MF
                this.homeTeamPlayers[3].position.set(-3, 0, 2);  // FW
                this.homeTeamPlayers[4].position.set(8, 0, 10);  // SUB (active second MF)
            } else { // 4-3-3 (default)
                this.homeTeamPlayers[1].position.set(0, 0, 25);  // DF
                this.homeTeamPlayers[2].position.set(-8, 0, 12); // MF
                this.homeTeamPlayers[3].position.set(0, 0, 2);   // FW
                this.homeTeamPlayers[4].position.set(8, 0, 10);  // SUB (active second winger)
            }
            this.activePlayer = this.homeTeamPlayers[3];
        }

        if (this.awayTeamPlayers && this.awayTeamPlayers.length >= 5) {
            this.awayTeamPlayers[0].position.set(0, 0, -48); // GK
            this.awayTeamPlayers[1].position.set(0, 0, -25); // DF
            this.awayTeamPlayers[2].position.set(8, 0, -10);  // MF
            this.awayTeamPlayers[3].position.set(0, 0, -2);  // FW
            this.awayTeamPlayers[4].position.set(-8, 0, -15); // SUB
        }

        // Reset rotations of all player meshes and joints
        const allPlayers = [...(this.homeTeamPlayers || []), ...(this.awayTeamPlayers || [])];
        allPlayers.forEach(p => {
            p.rotation.set(0, 0, 0);
            if (p.userData.leftLegGroup) p.userData.leftLegGroup.rotation.set(0, 0, 0);
            if (p.userData.rightLegGroup) p.userData.rightLegGroup.rotation.set(0, 0, 0);
        });
    }

    // --- INPUTS ---
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
            if (k === 'w' || e.key === 'ArrowUp') this.keys.w = true;
            if (k === 's' || e.key === 'ArrowDown') this.keys.s = true;
            if (k === 'a' || e.key === 'ArrowLeft') this.keys.a = true;
            if (k === 'd' || e.key === 'ArrowRight') this.keys.d = true;
            if (k === 'q') this.switchActivePlayer();
            if (k === 'k') this.executePass();
            if (k === 'i') this.executeThroughPass();
            if (k === ' ') this.executeShoot();
            if (k === 'o') this.executeSlideTackle();
            if (e.key === 'Shift') this.executeFeint();
        });

        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            if (k === 'w' || e.key === 'ArrowUp') this.keys.w = false;
            if (k === 's' || e.key === 'ArrowDown') this.keys.s = false;
            if (k === 'a' || e.key === 'ArrowLeft') this.keys.a = false;
            if (k === 'd' || e.key === 'ArrowRight') this.keys.d = false;
        });

        document.getElementById('btn-switch').addEventListener('pointerdown', () => this.switchActivePlayer());
        document.getElementById('btn-shoot').addEventListener('pointerdown', () => this.executeShoot());
        document.getElementById('btn-through').addEventListener('pointerdown', () => this.executeThroughPass());
        document.getElementById('btn-pass').addEventListener('pointerdown', () => this.executePass());
        document.getElementById('btn-sprint').addEventListener('pointerdown', () => {
            this.stamina = Math.max(0, this.stamina - 20);
        });
        
        const btnFeint = document.getElementById('btn-feint');
        if (btnFeint) {
            btnFeint.addEventListener('pointerdown', () => this.executeFeint());
        }

        const btnCam = document.getElementById('btn-camera-view');
        if (btnCam) {
            btnCam.addEventListener('pointerdown', () => {
                this.cameraModeIdx = (this.cameraModeIdx + 1) % this.cameraModes.length;
                console.log(`[Camera] Switch to: ${this.cameraModes[this.cameraModeIdx]}`);
            });
        }

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.isPlaying = false;
            document.getElementById('main-menu').classList.remove('hidden');
            document.getElementById('game-hud').classList.add('hidden');
        });
    }

    getFlagImg(code) {
        const mapping = {
            UZB: 'uz', POR: 'pt', BRA: 'br', ARG: 'ar', ESP: 'es', GER: 'de', FRA: 'fr', ITA: 'it',
            ENG: 'gb', NLD: 'nl', BEL: 'be', USA: 'us', JPN: 'jp', KOR: 'kr', MAR: 'ma', UZ: 'uz',
            PT: 'pt', BR: 'br', AR: 'ar', ES: 'es', DE: 'de', FR: 'fr', IT: 'it', US: 'us'
        };
        const c = mapping[code] || code.substring(0, 2).toLowerCase();
        return `<img src="https://flagcdn.com/w40/${c}.png" class="flag-icon-img" alt="${code}" style="width:24px; height:15px; border-radius:2px; object-fit:cover; vertical-align:middle; margin-right:6px; border:1px solid rgba(255,255,255,0.15)">`;
    }

    renderMenuTeams() {
        const grid = document.getElementById('teams-selector-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        Object.keys(this.teamsDb).forEach(id => {
            const t = this.teamsDb[id];
            const btn = document.createElement('button');
            btn.className = `team-btn ${id === this.selectedTeam ? 'active' : ''}`;
            btn.innerHTML = `${this.getFlagImg(id)} ${t.name}`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('#teams-selector-grid .team-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTeam = id;
                const opps = Object.keys(this.teamsDb).filter(x => x !== id);
                this.selectedOpponent = opps[Math.floor(Math.random() * opps.length)];
            });
            grid.appendChild(btn);
        });
    }

    bindMenuButtons() {
        // Tab switching logic
        document.querySelectorAll('.menu-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.menu-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
                
                const tabId = e.currentTarget.dataset.tab;
                e.currentTarget.classList.add('active');
                document.getElementById(tabId).classList.add('active-tab');
                
                this.renderDashboard();
            });
        });

        // --- ONBOARDING WIZARD NAVIGATION ---
        document.querySelectorAll('.next-step-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nextStep = e.currentTarget.dataset.next;
                
                if (nextStep === '2') {
                    const nick = document.getElementById('setup-nickname').value.trim() || 'Kapitan';
                    window.gameDb.state.profile.nickname = nick;
                    window.gameDb.save();
                }

                document.querySelectorAll('.wizard-step-content').forEach(w => w.classList.remove('active-step'));
                document.getElementById(`wizard-step-${nextStep}`).classList.add('active-step');

                document.querySelectorAll('.step-indicator').forEach(ind => {
                    const stepNum = parseInt(ind.dataset.step);
                    if (stepNum < parseInt(nextStep)) {
                        ind.classList.add('completed');
                        ind.classList.remove('active');
                    } else if (stepNum === parseInt(nextStep)) {
                        ind.classList.add('active');
                        ind.classList.remove('completed');
                    } else {
                        ind.classList.remove('active', 'completed');
                    }
                });
            });
        });

        // Avatar selection
        document.querySelectorAll('.avatar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-item').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const avatar = e.currentTarget.dataset.avatar;
                window.gameDb.state.profile.avatar = avatar;
                window.gameDb.save();
                
                const avatarLabel = document.getElementById('club-avatar-label');
                if (avatarLabel) avatarLabel.innerText = avatar;
            });
        });

        // Country selection
        document.querySelectorAll('.flag-setup-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.flag-setup-item').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const flag = e.currentTarget.dataset.flag;
                const code = e.currentTarget.dataset.code;
                
                window.gameDb.state.profile.country = flag;
                window.gameDb.state.profile.countryCode = code;
                
                // Set default club names based on selected country
                const countryClubs = window.gameDb.countriesDb[code]?.clubs || [];
                if (countryClubs.length > 0) {
                    window.gameDb.state.profile.clubName = countryClubs[0].name;
                    window.gameDb.state.profile.logoColor = countryClubs[0].color;
                }
                window.gameDb.save();
            });
        });

        // Open Starter pack button
        const openPackBtn = document.getElementById('open-pack-btn');
        if (openPackBtn) {
            openPackBtn.addEventListener('click', () => {
                document.getElementById('starter-pack-box').classList.add('hidden');
                document.getElementById('pack-rewards-result').classList.remove('hidden');
                
                window.gameDb.state.profile.coins = 1200;
                window.gameDb.state.ownedPlayers = ['gk_1', 'df_1', 'mf_5', 'fw_3', 'mf_1'];
                window.gameDb.save();
            });
        }

        // Finish onboarding button
        const finishOnboardingBtn = document.getElementById('finish-onboarding-btn');
        if (finishOnboardingBtn) {
            finishOnboardingBtn.addEventListener('click', () => {
                localStorage.setItem('fc_mobile_3d_profile_configured', 'true');
                document.getElementById('profile-setup-modal').classList.add('hidden');
                
                this.buildPlayers();
                this.startHeroPenaltyIntro();
            });
        }

        // --- HERO PENALTY KICKOFF INTERACTIVE BUTTONS ---
        const penaltyLeft = document.getElementById('penalty-target-left');
        if (penaltyLeft) {
            penaltyLeft.addEventListener('click', () => {
                this.takePenaltyShot('left');
            });
        }

        const penaltyRight = document.getElementById('penalty-target-right');
        if (penaltyRight) {
            penaltyRight.addEventListener('click', () => {
                this.takePenaltyShot('right');
            });
        }

        // --- LOBBY CHAT MESSAGE POSTING ---
        const chatSend = document.getElementById('chat-send-btn');
        const chatInput = document.getElementById('chat-message-input');
        if (chatSend && chatInput) {
            const sendMsg = () => {
                const text = chatInput.value.trim();
                if (!text) return;
                
                const profile = window.gameDb.state.profile;
                window.gameDb.state.chatLogs.push({
                    sender: profile.nickname,
                    club: profile.clubName,
                    flag: profile.country,
                    text: text
                });
                chatInput.value = '';
                window.gameDb.save();
                this.renderDashboard();

                // Simulated automated reply
                setTimeout(() => {
                    const randomReplies = [
                        "Daxshatli fikr! 👍",
                        "Jamoangiz juda kuchli ko'rindi!",
                        "Transfer bozorida yangi o'yinchilar chiqdi, ko'rdingizmi?",
                        "Hozirgina g'alaba qozondim! 🏆",
                        "Kimda Eldor FW kartasi bor? Zarbalari daxshat!"
                    ];
                    window.gameDb.state.chatLogs.push({
                        sender: "Pro_Gamer",
                        club: "Madrid Rebels",
                        flag: "🇪🇸",
                        text: randomReplies[Math.floor(Math.random() * randomReplies.length)]
                    });
                    window.gameDb.save();
                    this.renderDashboard();
                }, 1800);
            };
            chatSend.addEventListener('click', sendMsg);
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') sendMsg();
            });
        }

        // Formation selections
        document.querySelectorAll('.formation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const formStr = e.currentTarget.dataset.formation;
                window.gameDb.state.profile.activeFormation = formStr;
                window.gameDb.save();
                this.renderDashboard();
                this.buildPlayers();
            });
        });

        // 2D Tactical Pitch slot selections to open Swap Dialog
        document.querySelectorAll('.field-player-slot').forEach(slot => {
            slot.addEventListener('click', (e) => {
                const role = e.currentTarget.dataset.role;
                this.openSwapModal(role);
            });
        });

        // Close Swap Modal button
        const closeSwapBtn = document.getElementById('btn-close-swap');
        if (closeSwapBtn) {
            closeSwapBtn.addEventListener('click', () => {
                document.getElementById('player-swap-modal').classList.add('hidden');
            });
        }

        // Weather selections
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                const t = e.currentTarget;
                t.classList.add('active');
                this.setupStadiumTheme(t.dataset.weather);
            });
        });

        // Mode selections
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                const t = e.currentTarget;
                t.classList.add('active');
                this.selectedMode = t.dataset.mode;
                
                const drillsSec = document.getElementById('drills-section');
                if (this.selectedMode === 'training') {
                    drillsSec.classList.remove('hidden');
                } else {
                    drillsSec.classList.add('hidden');
                }
            });
        });

        // Drills selections
        document.querySelectorAll('.drill-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.drill-btn').forEach(b => b.classList.remove('active'));
                const t = e.currentTarget;
                t.classList.add('active');
                this.selectedDrill = t.dataset.drill;
            });
        });

        // Start match
        document.getElementById('start-game-btn').addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-hud').classList.remove('hidden');

            const customProfile = window.gameDb.state.profile;
            const aTeam = this.teamsDb[this.selectedOpponent];

            document.getElementById('hud-home-name').innerText = customProfile.clubName.substring(0, 10).toUpperCase();
            document.getElementById('hud-away-name').innerText = this.selectedOpponent;
            document.getElementById('hud-home-flag').innerHTML = this.getFlagImg(customProfile.countryCode);
            document.getElementById('hud-away-flag').innerHTML = this.getFlagImg(this.selectedOpponent);

            document.getElementById('hud-home-score').innerText = '0';
            document.getElementById('hud-away-score').innerText = '0';

            this.homeScore = 0;
            this.awayScore = 0;
            this.matchTime = 0;
            this.stamina = 100;
            this.isTraining = (this.selectedMode === 'training');
            
            this.buildPlayers();
            this.resetBall();
            this.buildTrainingProps();

            gameAudio.playWhistle();
            this.addCommentary("Hakam hushtagi chalindi! O'yin boshlandi! 🏁");

            const banner = document.getElementById('referee-whistle-banner');
            if (banner) {
                banner.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${this.isTraining ? 'TRAINING STARTED!' : 'MATCH STARTED!'} 🏁`;
                banner.classList.remove('hidden');
                setTimeout(() => {
                    banner.classList.add('hidden');
                }, 2000);
            }

            this.isPlaying = true;
        });

        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => {
            if (this.trainingProps) {
                this.trainingProps.forEach(obj => this.scene.remove(obj));
                this.trainingProps = [];
            }
            document.getElementById('game-over-modal').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
            this.renderDashboard();
        });
    }

    renderDashboard() {
        const db = window.gameDb;
        const profile = db.state.profile;

        // Update top info displays
        const coinsVal = document.getElementById('club-coins-val');
        if (coinsVal) coinsVal.innerText = profile.coins;
        const flagLabel = document.getElementById('club-flag-label');
        if (flagLabel) flagLabel.innerHTML = this.getFlagImg(profile.countryCode);
        const nameLabel = document.getElementById('club-name-label');
        if (nameLabel) nameLabel.innerText = profile.clubName;
        const avatarLabel = document.getElementById('club-avatar-label');
        if (avatarLabel && profile.avatar) avatarLabel.innerText = profile.avatar;

        // Level badge and progress
        const lvlVal = document.getElementById('profile-level-val');
        if (lvlVal) lvlVal.innerText = `LVL ${profile.level}`;
        const xpFill = document.getElementById('profile-xp-fill');
        if (xpFill) {
            const nextLvlThreshold = profile.level * 1000;
            const pct = Math.min(100, Math.floor((profile.xp / nextLvlThreshold) * 100));
            xpFill.style.width = `${pct}%`;
        }

        // Stats card display
        const gpVal = document.getElementById('stats-games-played');
        if (gpVal) gpVal.innerText = profile.matchesPlayed;
        const gwVal = document.getElementById('stats-games-won');
        if (gwVal) gwVal.innerText = profile.wins;
        const glVal = document.getElementById('stats-games-lost');
        if (glVal) glVal.innerText = profile.losses;
        const gtVal = document.getElementById('stats-trophies');
        if (gtVal) gtVal.innerText = profile.xp; // use XP as overall ranking indicator!

        // Render active squad on tactical pitch
        const squad = db.getActiveSquadPlayers();
        const activeFormation = profile.activeFormation;

        // Sync active formation button class
        document.querySelectorAll('.formation-btn').forEach(btn => {
            if (btn.dataset.formation === activeFormation) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const nameFw = document.querySelector('.slot-fw .slot-player-name');
        const ratFw = document.querySelector('.slot-fw .slot-player-rating');
        if (nameFw && ratFw) {
            nameFw.innerText = squad.FW.name;
            ratFw.innerText = squad.FW.rating;
        }

        const nameMf = document.querySelector('.slot-mf .slot-player-name');
        const ratMf = document.querySelector('.slot-mf .slot-player-rating');
        if (nameMf && ratMf) {
            nameMf.innerText = squad.MF.name;
            ratMf.innerText = squad.MF.rating;
        }

        const nameDf = document.querySelector('.slot-df .slot-player-name');
        const ratDf = document.querySelector('.slot-df .slot-player-rating');
        if (nameDf && ratDf) {
            nameDf.innerText = squad.DF.name;
            ratDf.innerText = squad.DF.rating;
        }

        const nameGk = document.querySelector('.slot-gk .slot-player-name');
        const ratGk = document.querySelector('.slot-gk .slot-player-rating');
        if (nameGk && ratGk) {
            nameGk.innerText = squad.GK.name;
            ratGk.innerText = squad.GK.rating;
        }

        const nameSub = document.querySelector('.slot-sub .slot-player-name');
        const ratSub = document.querySelector('.slot-sub .slot-player-rating');
        if (nameSub && ratSub) {
            nameSub.innerText = squad.SUB.name;
            ratSub.innerText = squad.SUB.rating;
        }

        // Render owned roster list card items
        const rosterContainer = document.getElementById('owned-roster-list');
        if (rosterContainer) {
            rosterContainer.innerHTML = '';
            db.state.ownedPlayers.forEach(id => {
                const p = db.getPlayer(id);
                if (!p) return;
                const card = document.createElement('div');
                card.className = 'player-list-card';
                card.innerHTML = `
                    <div class="player-card-info-left">
                        <span class="card-rating-badge">${p.rating}</span>
                        <div>
                            <div class="card-name-title">${p.country} ${p.name}</div>
                            <div class="card-role-title">${p.role}</div>
                        </div>
                    </div>
                    <div class="player-card-stats-right">
                        <span>PAC ${p.pac}</span>
                        <span>SHO ${p.sho}</span>
                        <span>PAS ${p.pas}</span>
                        <span>DEF ${p.def}</span>
                    </div>
                `;
                rosterContainer.appendChild(card);
            });
        }

        // Render Transfer Market cards
        const marketContainer = document.getElementById('market-cards-grid');
        if (marketContainer) {
            marketContainer.innerHTML = '';
            db.fictionalPlayers.forEach(p => {
                const isOwned = db.state.ownedPlayers.includes(p.id);
                const card = document.createElement('div');
                card.className = 'market-player-card';
                card.innerHTML = `
                    <span class="market-card-rating">${p.rating}</span>
                    <span class="market-card-flag">${p.country}</span>
                    <div class="market-card-avatar"><i class="fa-solid fa-shirt"></i></div>
                    <div class="market-card-name">${p.name}</div>
                    <div class="market-card-role">${p.role}</div>
                    <div class="market-card-stats-grid">
                        <div><span>${p.pac}</span><span>PAC</span></div>
                        <div><span>${p.sho}</span><span>SHO</span></div>
                        <div><span>${p.pas}</span><span>PAS</span></div>
                        <div><span>${p.def}</span><span>DEF</span></div>
                        <div><span>${p.phy}</span><span>PHY</span></div>
                    </div>
                    <button class="market-buy-btn" data-id="${p.id}" ${isOwned ? 'disabled' : ''}>
                        ${isOwned ? 'Sotib olingan' : `<i class="fa-solid fa-coins"></i> ${p.price}`}
                    </button>
                `;
                marketContainer.appendChild(card);
            });

            marketContainer.querySelectorAll('.market-buy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const res = db.buyPlayerPack(id);
                    alert(res.msg);
                    this.renderDashboard();
                });
            });
        }

        // Render Season Pass tiers
        const passContainer = document.getElementById('season-pass-grid');
        if (passContainer) {
            passContainer.innerHTML = '';
            
            const passTiers = [
                { idx: 1, req: 0, title: "Boshlang'ich Tanga", coins: 300, cardId: null },
                { idx: 2, req: 500, title: "200 Tanga + Ramos (DF)", coins: 200, cardId: "df_2" },
                { idx: 3, req: 1200, title: "De Bruyne (MF)", coins: 0, cardId: "mf_4" },
                { idx: 4, req: 2000, title: "500 Tanga + Buffo (GK)", coins: 500, cardId: "gk_2" },
                { idx: 5, req: 3000, title: "L. Messi (FW) Legend", coins: 1000, cardId: "fw_2" }
            ];

            const passXpCounter = document.getElementById('pass-xp-counter');
            if (passXpCounter) passXpCounter.innerText = db.state.seasonPass.xpProgress;

            passTiers.forEach(tier => {
                const isClaimed = db.state.seasonPass.claimedTiers.includes(tier.idx);
                const isUnlocked = db.state.seasonPass.xpProgress >= tier.req;
                
                const row = document.createElement('div');
                row.className = `season-pass-tier-row ${isUnlocked ? 'unlocked' : ''}`;
                row.innerHTML = `
                    <div class="tier-info-left">
                        <div class="tier-number-badge">${tier.idx}</div>
                        <div>
                            <div class="tier-reward-title">${tier.title}</div>
                            <div class="tier-req-xp">Talab etiladi: ${tier.req} XP</div>
                        </div>
                    </div>
                    <button class="claim-tier-btn ${isClaimed ? 'claimed' : ''}" data-idx="${tier.idx}" data-req="${tier.req}" data-coins="${tier.coins}" data-card="${tier.cardId || ''}" ${isClaimed || !isUnlocked ? 'disabled' : ''}>
                        ${isClaimed ? 'OLINGAN' : isUnlocked ? 'OLISH 🎁' : 'YOPIN'}
                    </button>
                `;
                
                row.querySelector('button').addEventListener('click', (e) => {
                    const t = e.currentTarget;
                    const res = db.claimSeasonPassTier(
                        parseInt(t.dataset.idx),
                        parseInt(t.dataset.req),
                        parseInt(t.dataset.coins),
                        t.dataset.card || null
                    );
                    alert(res.msg);
                    this.renderDashboard();
                });

                passContainer.appendChild(row);
            });
        }

        // Render Chat Lobby list
        const chatContainer = document.getElementById('chat-messages-container');
        if (chatContainer) {
            chatContainer.innerHTML = '';
            db.state.chatLogs.forEach(msg => {
                const row = document.createElement('div');
                row.className = 'chat-message-row';
                row.innerHTML = `
                    <div class="chat-sender-header">
                        <span>${msg.flag}</span>
                        <span>${msg.sender}</span>
                        <span class="chat-sender-club">[${msg.club}]</span>
                    </div>
                    <div class="chat-msg-text" style="color: #fff; margin-top:2px">${msg.text}</div>
                `;
                chatContainer.appendChild(row);
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Render Daily Quests
        const questsContainer = document.getElementById('quests-list-container');
        if (questsContainer) {
            questsContainer.innerHTML = '';
            db.state.quests.forEach(q => {
                const item = document.createElement('div');
                item.className = `achievement-item ${q.completed ? 'completed' : ''}`;
                item.innerHTML = `
                    <div class="ach-item-left">
                        <div class="ach-title">
                            <i class="fa-solid ${q.completed ? 'fa-circle-check text-primary' : 'fa-circle-dot text-sub'}"></i>
                            ${q.title}
                        </div>
                        <div class="ach-desc">${q.desc}</div>
                    </div>
                    <button class="claim-tier-btn" data-id="${q.id}" ${q.completed ? 'disabled style="opacity:0.5"' : ''}>
                        ${q.completed ? 'BAJARILDI' : `OLISH (+${q.reward} T)`}
                    </button>
                `;

                if (!q.completed) {
                    item.querySelector('button').addEventListener('click', (e) => {
                        const id = e.currentTarget.dataset.id;
                        const res = db.completeQuest(id);
                        alert(res.msg);
                        this.renderDashboard();
                    });
                }

                questsContainer.appendChild(item);
            });
        }

        // Render achievements
        const achContainer = document.getElementById('achievements-list');
        if (achContainer) {
            achContainer.innerHTML = '';
            db.state.achievements.forEach(ach => {
                let progressHtml = '';
                if (ach.target !== undefined) {
                    const pct = Math.min(100, Math.floor((ach.current / ach.target) * 100));
                    progressHtml = `
                        <div class="ach-progress-bar-container">
                            <div class="ach-progress-bar-fill" style="width: ${pct}%"></div>
                        </div>
                        <span style="font-size:0.75rem; color:var(--text-sub)">${ach.current} / ${ach.target} gol</span>
                    `;
                }
                const item = document.createElement('div');
                item.className = `achievement-item ${ach.completed ? 'completed' : ''}`;
                item.innerHTML = `
                    <div class="ach-item-left">
                        <div class="ach-title">
                            <i class="fa-solid ${ach.completed ? 'fa-circle-check text-primary' : 'fa-circle-dot text-sub'}"></i>
                            ${ach.title}
                        </div>
                        <div class="ach-desc">${ach.desc}</div>
                        ${progressHtml}
                    </div>
                    <div class="ach-reward-badge">
                        <i class="fa-solid fa-coins"></i> +${ach.reward} Tanga
                    </div>
                `;
                achContainer.appendChild(item);
            });
        }
    }

    openSwapModal(role) {
        document.getElementById('swap-role-label').innerText = role;
        const optionsGrid = document.getElementById('swap-options-grid');
        if (!optionsGrid) return;
        optionsGrid.innerHTML = '';

        const db = window.gameDb;
        db.state.ownedPlayers.forEach(id => {
            const p = db.getPlayer(id);
            if (!p) return;
            const opt = document.createElement('div');
            opt.className = 'player-list-card';
            opt.innerHTML = `
                <div class="player-card-info-left">
                    <span class="card-rating-badge">${p.rating}</span>
                    <div>
                        <div class="card-name-title">${p.country} ${p.name}</div>
                        <div class="card-role-title">${p.role}</div>
                    </div>
                </div>
                <button class="glow-btn" style="width:auto; padding:6px 12px; font-size:0.8rem; margin:0;" data-id="${p.id}">TANLASH</button>
            `;
            
            opt.querySelector('button').addEventListener('click', (e) => {
                const pId = e.currentTarget.dataset.id;
                const res = db.assignSquadPlayer(role, pId);
                alert(res.msg);
                document.getElementById('player-swap-modal').classList.add('hidden');
                this.renderDashboard();
                this.buildPlayers();
            });
            
            optionsGrid.appendChild(opt);
        });

        document.getElementById('player-swap-modal').classList.remove('hidden');
    }

    addCommentary(msg) {
        const textEl = document.getElementById('commentary-text');
        if (textEl) {
            textEl.innerText = msg;
            const banner = document.getElementById('commentary-banner');
            if (banner) {
                banner.style.opacity = '1';
                banner.style.filter = 'drop-shadow(0 0 10px rgba(0, 195, 255, 0.4))';
                setTimeout(() => {
                    banner.style.filter = 'none';
                }, 400);
            }
        }
    }

    startReplaySequence(isHome) {
        this.isPlaying = false;
        
        const replayTape = document.getElementById('replay-tape-banner');
        if (replayTape) replayTape.classList.remove('hidden');

        const goalBallPos = this.ball.position.clone();
        let replayFrame = 0;
        const maxReplayFrames = 150; 

        this.replayInterval = setInterval(() => {
            replayFrame++;
            const t = replayFrame / maxReplayFrames;

            const camStart = new THREE.Vector3(-12, 4.5, isHome ? 32 : -32);
            const camEnd = new THREE.Vector3(0, 2.0, isHome ? 54.5 : -54.5);
            this.camera.position.lerpVectors(camStart, camEnd, t * 0.85);
            this.camera.lookAt(goalBallPos);

            this.ball.rotation.x += 0.05;

            if (replayFrame >= maxReplayFrames) {
                clearInterval(this.replayInterval);
                
                if (replayTape) replayTape.classList.add('hidden');
                const overlay = document.getElementById('goal-announcement');
                if (overlay) overlay.classList.add('hidden');

                this.resetBall();
                this.isPlaying = true;
            }
        }, 16); 
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
        const score = (this.homeScore * 150) + 100;
        const club = this.teamsDb[this.selectedTeam].name;

        fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, score, club })
        })
        .then(res => res.json())
        .then(() => {
            alert("Natijangiz saqlandi!");
            this.loadLeaderboard();
            document.getElementById('game-over-modal').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        })
        .catch(err => alert("Xatolik yuz berdi."));
    }

    buildTrainingProps() {
        if (this.trainingProps) {
            this.trainingProps.forEach(obj => this.scene.remove(obj));
        }
        this.trainingProps = [];

        if (this.selectedMode !== 'training') return;

        if (this.selectedDrill === 'dribble') {
            const conePoints = [
                { x: 0, z: 10 },
                { x: 4, z: 16 },
                { x: -4, z: 22 },
                { x: 4, z: 28 },
                { x: -4, z: 34 },
                { x: 4, z: 40 },
                { x: 0, z: 46 }
            ];

            conePoints.forEach(pos => {
                const group = new THREE.Group();
                const base = new THREE.Mesh(
                    new THREE.BoxGeometry(0.8, 0.1, 0.8),
                    new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.5 })
                );
                const body = new THREE.Mesh(
                    new THREE.ConeGeometry(0.25, 0.7, 8),
                    new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.5 })
                );
                body.position.y = 0.35;
                const stripe = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.12, 0.16, 0.15, 8),
                    new THREE.MeshStandardMaterial({ color: 0xffffff })
                );
                stripe.position.y = 0.35;

                group.add(base, body, stripe);
                group.position.set(pos.x, 0.05, pos.z);
                this.scene.add(group);
                this.trainingProps.push(group);
            });
        } 
        else if (this.selectedDrill === 'pass') {
            const ringPoints = [
                { x: -12, z: 15 },
                { x: 12, z: 25 },
                { x: -6, z: 35 }
            ];

            ringPoints.forEach(pos => {
                const geo = new THREE.RingGeometry(1.6, 1.8, 16);
                geo.rotateX(-Math.PI / 2);
                const mat = new THREE.MeshBasicMaterial({ color: 0x02f87b, side: THREE.DoubleSide });
                const ring = new THREE.Mesh(geo, mat);
                ring.position.set(pos.x, 0.08, pos.z);
                this.scene.add(ring);

                ring.userData = { type: 'ring', collected: false };
                this.trainingProps.push(ring);
            });
        }
        else if (this.selectedDrill === 'shoot') {
            const targetPoints = [
                { x: -4.2, y: 4.2, z: 54.8 },
                { x: 4.2, y: 4.2, z: 54.8 },
                { x: 0, y: 2.2, z: 54.8 }
            ];

            targetPoints.forEach(pos => {
                const group = new THREE.Group();
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(0.9, 0.9, 0.15),
                    new THREE.MeshStandardMaterial({ color: 0xff4500, roughness: 0.2 })
                );
                const dot = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8),
                    new THREE.MeshStandardMaterial({ color: 0xffffff })
                );
                dot.rotation.x = Math.PI / 2;

                group.add(box, dot);
                group.position.set(pos.x, pos.y, pos.z);
                this.scene.add(group);

                group.userData = { type: 'target', hit: false };
                this.trainingProps.push(group);
            });
        }
        else if (this.selectedDrill === 'tackle') {
            const dummyPoints = [
                { x: -5, z: 12 },
                { x: 5, z: 24 },
                { x: 0, z: 36 }
            ];

            dummyPoints.forEach(pos => {
                const group = new THREE.Group();
                const body = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.3, 1.4, 12),
                    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 })
                );
                body.position.y = 0.7;
                const stripe = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.31, 0.31, 0.2, 12),
                    new THREE.MeshStandardMaterial({ color: 0xff0000 })
                );
                stripe.position.y = 0.7;
                const head = new THREE.Mesh(
                    new THREE.SphereGeometry(0.2, 12, 12),
                    new THREE.MeshStandardMaterial({ color: 0xbbbbbb })
                );
                head.position.y = 1.5;

                group.add(body, stripe, head);
                group.position.set(pos.x, 0.05, pos.z);
                this.scene.add(group);

                group.userData = { type: 'dummy', hit: false };
                this.trainingProps.push(group);
            });
        }
    }

    checkTrainingCollisions(dt) {
        if (!this.trainingProps) return;

        const player = this.activePlayer;
        const ball = this.ball;

        if (this.selectedDrill === 'dribble') {
            this.trainingProps.forEach(cone => {
                const dist = player.position.distanceTo(cone.position);
                if (dist < 0.9) {
                    const pushDir = player.position.clone().sub(cone.position).normalize();
                    player.position.addScaledVector(pushDir, 0.4);
                    this.stamina = Math.max(0, this.stamina - 15);
                }
            });
        }
        else if (this.selectedDrill === 'pass') {
            this.trainingProps.forEach(ring => {
                if (!ring.userData.collected) {
                    const dist = ball.position.distanceTo(ring.position);
                    if (dist < 2.0) {
                        ring.userData.collected = true;
                        this.homeScore++;
                        document.getElementById('hud-home-score').innerText = this.homeScore;
                        gameAudio.playWhistle();
                        
                        if (window.confetti) window.confetti({ particleCount: 30, spread: 45 });

                        setTimeout(() => {
                            ring.position.set(
                                Math.random() * 40 - 20,
                                0.08,
                                Math.random() * 30 + 10
                            );
                            ring.userData.collected = false;
                        }, 1200);
                    }
                }
            });
        }
        else if (this.selectedDrill === 'shoot') {
            this.trainingProps.forEach(target => {
                if (!target.userData.hit) {
                    const dist = ball.position.distanceTo(target.position);
                    if (dist < 1.15) {
                        target.userData.hit = true;
                        this.homeScore++;
                        document.getElementById('hud-home-score').innerText = this.homeScore;
                        gameAudio.playWhistle();
                        if (window.confetti) window.confetti({ particleCount: 80, spread: 60 });

                        target.position.y = -10;
                        setTimeout(() => {
                            target.position.set(
                                Math.random() > 0.5 ? -4.2 : 4.2,
                                Math.random() > 0.5 ? 4.2 : 2.0,
                                54.8
                            );
                            target.userData.hit = false;
                        }, 2000);
                    }
                }
            });
        }
        else if (this.selectedDrill === 'tackle') {
            this.trainingProps.forEach(dummy => {
                if (!dummy.userData.hit && player.userData.isSliding) {
                    const dist = player.position.distanceTo(dummy.position);
                    if (dist < 1.6) {
                        dummy.userData.hit = true;
                        this.homeScore++;
                        document.getElementById('hud-home-score').innerText = this.homeScore;
                        gameAudio.playKick();
                        
                        const spinInterval = setInterval(() => {
                            dummy.rotation.z += 0.15;
                            dummy.position.y -= 0.05;
                            if (dummy.position.y < -1) {
                                clearInterval(spinInterval);
                            }
                        }, 30);

                        setTimeout(() => {
                            dummy.position.set(
                                Math.random() * 30 - 15,
                                0.05,
                                Math.random() * 30 + 10
                            );
                            dummy.rotation.set(0, 0, 0);
                            dummy.userData.hit = false;
                        }, 3000);
                    }
                }
            });
        }
    }

    animatePlayerLegs(dt) {
        if (!this.homeTeamPlayers || !this.awayTeamPlayers) return;
        const allPlayers = [...this.homeTeamPlayers, ...this.awayTeamPlayers];
        allPlayers.forEach(p => {
            if (!p.userData.leftLegGroup || !p.userData.rightLegGroup) return;

            // Handle sliding pose
            if (p.userData.isSliding) {
                p.userData.leftLegGroup.rotation.x = -Math.PI / 3.5;
                p.userData.rightLegGroup.rotation.x = Math.PI / 4.5;
                return;
            }

            // Stunned pose
            if (p.userData.stunTime > 0) {
                p.userData.leftLegGroup.rotation.x = 0.2;
                p.userData.rightLegGroup.rotation.x = -0.2;
                return;
            }

            // Measure position changes
            const prevPos = p.userData.prevPos || p.position.clone();
            const dist = p.position.distanceTo(prevPos);
            p.userData.prevPos = p.position.clone();

            if (dist > 0.02) {
                // Running swing
                const speedMult = p === this.activePlayer ? 1.5 : 1.1;
                const cycle = Date.now() * 0.012 * speedMult;
                p.userData.leftLegGroup.rotation.x = Math.sin(cycle) * 0.65;
                p.userData.rightLegGroup.rotation.x = -Math.sin(cycle) * 0.65;
            } else {
                // Idle recovery
                p.userData.leftLegGroup.rotation.x = THREE.MathUtils.lerp(p.userData.leftLegGroup.rotation.x, 0, 0.15);
                p.userData.rightLegGroup.rotation.x = THREE.MathUtils.lerp(p.userData.rightLegGroup.rotation.x, 0, 0.15);
            }
        });
    }

    startHeroPenaltyIntro() {
        this.introRunning = false;
        this.penaltyModeActive = true;
        this.penaltyShotTaken = false;
        this.penaltyGoalScored = false;

        // Position camera behind the penalty spot looking at the net
        this.camera.position.set(0, 3.8, 25);
        this.camera.lookAt(0, 1.8, 55);

        // Position player and ball
        if (this.homeTeamPlayers && this.homeTeamPlayers.length >= 5) {
            const fw = this.homeTeamPlayers[3];
            fw.position.set(0, 0, 31);
            fw.rotation.set(0, 0, 0);
            this.homeTeamPlayers.forEach(p => {
                if (p !== fw) p.position.set(0, -50, 0);
            });
        }
        
        const gkOpponent = this.awayTeamPlayers[0];
        if (gkOpponent) {
            gkOpponent.position.set(0, 0, 54.5);
            gkOpponent.rotation.set(0, 0, 0);
            this.awayTeamPlayers.forEach(p => {
                if (p !== gkOpponent) p.position.set(0, -50, 0);
            });
        }

        this.ball.position.set(0, this.ballRadius, 36.5);
        this.ballVelocity.set(0, 0, 0);

        document.getElementById('hero-penalty-overlay').classList.remove('hidden');
    }

    takePenaltyShot(direction) {
        if (this.penaltyShotTaken) return;
        this.penaltyShotTaken = true;
        this.penaltyShootDir = direction;

        gameAudio.playKick();

        // Target coordinates
        if (direction === 'left') {
            this.ballVelocity.set(-2.8, 3.5, 23.0);
        } else {
            this.ballVelocity.set(2.8, 3.5, 23.0);
        }

        // Hide overlay buttons immediately
        const overlayBtns = document.querySelectorAll('.penalty-target-btn');
        overlayBtns.forEach(btn => btn.style.display = 'none');
    }

    updateHeroPenalty(dt) {
        if (!this.penaltyShotTaken) return;

        // Apply physics to ball
        this.ball.position.addScaledVector(this.ballVelocity, dt);
        if (this.ball.position.y > this.ballRadius) {
            this.ballVelocity.y -= 9.81 * dt;
        } else {
            this.ball.position.y = this.ballRadius;
            this.ballVelocity.y = -this.ballVelocity.y * 0.4;
        }

        // Animate keeper dive opposite to target
        const gkOpponent = this.awayTeamPlayers[0];
        if (gkOpponent) {
            if (this.penaltyShootDir === 'left') {
                // Dive right (positive X)
                gkOpponent.position.x += 3.8 * dt;
                gkOpponent.position.y = Math.max(0, gkOpponent.position.y + 1.8 * dt);
                gkOpponent.rotation.z -= 0.6 * dt;
            } else {
                // Dive left (negative X)
                gkOpponent.position.x -= 3.8 * dt;
                gkOpponent.position.y = Math.max(0, gkOpponent.position.y + 1.8 * dt);
                gkOpponent.rotation.z += 0.6 * dt;
            }
        }

        // Check for goal
        if (this.ball.position.z >= 54.5 && !this.penaltyGoalScored) {
            this.penaltyGoalScored = true;
            this.ballVelocity.set(0, 0, 0); // Stop ball in net
            
            gameAudio.playGoalSound();
            if (window.confetti) window.confetti({ particleCount: 150, spread: 80 });

            const overlay = document.getElementById('goal-announcement');
            if (overlay) overlay.classList.remove('hidden');

            // Render slow motion camera sweep
            let frameCount = 0;
            const interval = setInterval(() => {
                frameCount++;
                this.camera.position.lerp(new THREE.Vector3(0, 2.0, 56.5), 0.05);
                this.camera.lookAt(this.ball.position);
                
                if (frameCount >= 120) {
                    clearInterval(interval);
                    
                    if (overlay) overlay.classList.add('hidden');
                    document.getElementById('hero-penalty-overlay').classList.add('hidden');
                    
                    this.penaltyModeActive = false;
                    
                    // Show main dashboard!
                    document.getElementById('main-menu').classList.remove('hidden');
                    this.renderDashboard();
                    this.resetBall();
                }
            }, 16);
        }
    }
}

// Instantiate
window.addEventListener('DOMContentLoaded', () => {
    window.matchInstance = new UltraFootballMatch();
});
