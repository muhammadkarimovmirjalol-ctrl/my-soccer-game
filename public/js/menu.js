class MenuController {
    constructor() {
        this.selectedTeam = 'POR';
        this.selectedOpponent = 'BRA';
        this.selectedStadium = 'night';
        this.selectedMode = 'full_match'; // 'full_match', 'training', 'tournament'
        this.currentDifficulty = 'medium';

        // 12 tournament teams
        this.tournamentTeams = [
            { id: 'UZB', name: 'O\'ZBEKISTON', flag: '🇺🇿', rating: 4, captain: 'Shomurodov', color: '#00c3ff' },
            { id: 'POR', name: 'PORTUGAL', flag: '🇵🇹', rating: 5, captain: 'C. Ronaldo', color: '#ff0000' },
            { id: 'BRA', name: 'BRAZIL', flag: '🇧🇷', rating: 5, captain: 'Vinicius Jr', color: '#e6c300' },
            { id: 'ARG', name: 'ARGENTINA', flag: '🇦🇷', rating: 5, captain: 'L. Messi', color: '#009ee3' },
            { id: 'ESP', name: 'SPAIN', flag: '🇪🇸', rating: 5, captain: 'Rodri', color: '#d91a1a' },
            { id: 'GER', name: 'GERMANY', flag: '🇩🇪', rating: 4, captain: 'Kimmich', color: '#111111' },
            { id: 'FRA', name: 'FRANCE', flag: '🇫🇷', rating: 5, captain: 'Mbappe', color: '#002395' },
            { id: 'ITA', name: 'ITALY', flag: '🇮🇹', rating: 4, captain: 'Donnarumma', color: '#008c45' }
        ];

        this.tournamentRound = 1; // 1: Quarter-Finals, 2: Semi-Finals, 3: Final
        this.tournamentMatches = [];
        this.tournamentScores = {};
    }

    init() {
        this.renderTeams();
        this.bindEvents();
        this.showScreen('main-menu');
        this.loadProfile();
    }

    showScreen(screenId) {
        const screens = ['main-menu', 'team-select-screen', 'stadium-select-screen', 'tournament-bracket-screen', 'settings-screen', 'profile-screen', 'game-hud'];
        screens.forEach(s => {
            const el = document.getElementById(s);
            if (el) el.classList.add('hidden');
        });

        const target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');
        console.log(`[Menu] Switched to screen: ${screenId}`);

        // Stop matches if moving out of HUD
        if (screenId !== 'game-hud' && window.matchInstance) {
            window.matchInstance.isPlaying = false;
        }
    }

    renderTeams() {
        const homeList = document.getElementById('home-teams-list');
        const awayList = document.getElementById('away-teams-list');
        if (!homeList || !awayList) return;

        homeList.innerHTML = '';
        awayList.innerHTML = '';

        this.tournamentTeams.forEach(t => {
            // Home selector
            const hBtn = document.createElement('button');
            hBtn.className = `team-list-btn ${t.id === this.selectedTeam ? 'active' : ''}`;
            hBtn.dataset.id = t.id;
            hBtn.innerHTML = `<span style="font-size:1.4rem; margin-right:8px">${t.flag}</span> ${t.name} (${t.rating} ★)`;
            hBtn.addEventListener('click', () => {
                document.querySelectorAll('#home-teams-list .team-list-btn').forEach(b => b.classList.remove('active'));
                hBtn.classList.add('active');
                this.selectedTeam = t.id;
                console.log(`[Menu] Selected home team: ${t.id}`);
            });
            homeList.appendChild(hBtn);

            // Away selector
            const aBtn = document.createElement('button');
            aBtn.className = `team-list-btn ${t.id === this.selectedOpponent ? 'active' : ''}`;
            aBtn.dataset.id = t.id;
            aBtn.innerHTML = `<span style="font-size:1.4rem; margin-right:8px">${t.flag}</span> ${t.name} (${t.rating} ★)`;
            aBtn.addEventListener('click', () => {
                document.querySelectorAll('#away-teams-list .team-list-btn').forEach(b => b.classList.remove('active'));
                aBtn.classList.add('active');
                this.selectedOpponent = t.id;
                console.log(`[Menu] Selected opponent: ${t.id}`);
            });
            awayList.appendChild(aBtn);
        });
    }

    bindEvents() {
        // Main menu buttons
        const qmBtn = document.getElementById('btn-quick-match');
        if (qmBtn) qmBtn.addEventListener('click', () => {
            this.selectedMode = 'full_match';
            this.showScreen('team-select-screen');
        });

        const trainBtn = document.getElementById('btn-training');
        if (trainBtn) trainBtn.addEventListener('click', () => {
            this.selectedMode = 'training';
            this.showScreen('stadium-select-screen');
        });

        const tourBtn = document.getElementById('btn-tournament');
        if (tourBtn) tourBtn.addEventListener('click', () => {
            this.selectedMode = 'tournament';
            this.initTournament();
            this.showScreen('tournament-bracket-screen');
        });

        const settingsMenuBtn = document.getElementById('btn-settings-menu');
        if (settingsMenuBtn) settingsMenuBtn.addEventListener('click', () => {
            this.showScreen('settings-screen');
        });

        const profileMenuBtn = document.getElementById('btn-profile-menu');
        if (profileMenuBtn) profileMenuBtn.addEventListener('click', () => {
            this.showScreen('profile-screen');
        });

        // Team selection confirmation
        const confirmTeamsBtn = document.getElementById('btn-confirm-teams');
        if (confirmTeamsBtn) confirmTeamsBtn.addEventListener('click', () => {
            this.showScreen('stadium-select-screen');
        });

        // Stadium Selection active changes
        document.querySelectorAll('.stadium-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.stadium-card').forEach(c => c.classList.remove('active'));
                const t = e.currentTarget;
                t.classList.add('active');
                this.selectedStadium = t.dataset.stadium;
                console.log(`[Menu] Selected stadium: ${this.selectedStadium}`);
            });
        });

        // Direct match play button
        const startMatchDirectBtn = document.getElementById('btn-start-match-direct');
        if (startMatchDirectBtn) startMatchDirectBtn.addEventListener('click', () => {
            this.startActiveMatch();
        });

        // Settings difficulty toggles
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                const t = e.currentTarget;
                t.classList.add('active');
                this.currentDifficulty = t.dataset.diff;
                if (window.gameAI) window.gameAI.setDifficulty(this.currentDifficulty);
            });
        });

        // Settings audio toggle
        const settingsAudioBtn = document.getElementById('settings-audio-btn');
        if (settingsAudioBtn) settingsAudioBtn.addEventListener('click', () => {
            if (window.gameAudio) {
                window.gameAudio.muted = !window.gameAudio.muted;
                settingsAudioBtn.innerHTML = window.gameAudio.muted ? 
                    '<i class="fa-solid fa-volume-xmark"></i> OVOZNI YOQISH' : 
                    '<i class="fa-solid fa-volume-high"></i> OVOZNI O\'CHIRISH';
            }
        });

        // Save Profile Captain Nickname
        const saveProfileBtn = document.getElementById('btn-save-profile');
        if (saveProfileBtn) saveProfileBtn.addEventListener('click', () => {
            const input = document.getElementById('profile-name-input');
            if (input && input.value.trim()) {
                const name = input.value.trim();
                localStorage.setItem('fc_player_name', name);
                const disp = document.getElementById('player-name-display');
                if (disp) disp.innerHTML = `<i class="fa-solid fa-circle-user"></i> ${name}`;
                alert('Kapitan ismi saqlandi!');
            }
        });

        // Tournament play match button
        const playTournamentMatchBtn = document.getElementById('btn-play-tournament-match');
        if (playTournamentMatchBtn) playTournamentMatchBtn.addEventListener('click', () => {
            this.startActiveMatch();
        });
    }

    loadProfile() {
        const name = localStorage.getItem('fc_player_name') || 'Kapitan';
        const disp = document.getElementById('player-name-display');
        if (disp) disp.innerHTML = `<i class="fa-solid fa-circle-user"></i> ${name}`;
        
        const input = document.getElementById('profile-name-input');
        if (input) input.value = name;

        // Load stats
        const totalGoals = localStorage.getItem('fc_total_goals') || '0';
        const totalMatches = localStorage.getItem('fc_total_matches') || '0';
        const ratingPoints = localStorage.getItem('fc_rating_points') || '1200';

        const gEl = document.getElementById('stat-total-goals');
        const mEl = document.getElementById('stat-total-matches');
        const rEl = document.getElementById('stat-rating-points');
        if (gEl) gEl.innerText = totalGoals;
        if (mEl) mEl.innerText = totalMatches;
        if (rEl) rEl.innerText = ratingPoints;
    }

    incrementStats(goals) {
        let currentGoals = parseInt(localStorage.getItem('fc_total_goals') || '0');
        let currentMatches = parseInt(localStorage.getItem('fc_total_matches') || '0');
        let currentPoints = parseInt(localStorage.getItem('fc_rating_points') || '1200');

        currentGoals += goals;
        currentMatches += 1;
        currentPoints += (goals * 10) + 15;

        localStorage.setItem('fc_total_goals', currentGoals);
        localStorage.setItem('fc_total_matches', currentMatches);
        localStorage.setItem('fc_rating_points', currentPoints);

        this.loadProfile();
    }

    initTournament() {
        this.tournamentRound = 1;
        this.tournamentMatches = [
            { id: 1, team1: 'POR', team2: 'BRA', score1: null, score2: null, round: 1 },
            { id: 2, team1: 'UZB', team2: 'ARG', score1: null, score2: null, round: 1 },
            { id: 3, team1: 'ESP', team2: 'GER', score1: null, score2: null, round: 1 },
            { id: 4, team1: 'FRA', team2: 'ITA', score1: null, score2: null, round: 1 }
        ];

        this.selectedTeam = 'UZB'; // Automatically assign player to Uzbekistan in tournament
        this.selectedOpponent = 'ARG'; // First opponent
        this.updateTournamentUI();
    }

    simulateOtherTournamentMatches() {
        this.tournamentMatches.forEach(m => {
            if (m.round === this.tournamentRound && m.score1 === null) {
                // If it is NOT the player's match (Player is UZB)
                const isPlayerMatch = (m.team1 === this.selectedTeam || m.team2 === this.selectedTeam);
                if (!isPlayerMatch) {
                    m.score1 = Math.floor(Math.random() * 4);
                    m.score2 = Math.floor(Math.random() * 4);
                    if (m.score1 === m.score2) {
                        m.score1 += Math.random() > 0.5 ? 1 : 0;
                        m.score2 += m.score1 === m.score2 ? 1 : 0;
                    }
                    console.log(`[Tournament Simulation] Match ${m.team1} vs ${m.team2} finished: ${m.score1}-${m.score2}`);
                }
            }
        });
        this.updateTournamentUI();
    }

    advanceTournamentRound(playerWon) {
        if (!playerWon) {
            alert('Afsus, turnirdan chiqib ketdingiz! Yangidan urinib ko\'ring.');
            this.showScreen('main-menu');
            return;
        }

        if (this.tournamentRound === 1) {
            // Quarter-finals finished. Move to Semis (2 matches)
            const winners = [];
            this.tournamentMatches.forEach(m => {
                if (m.round === 1) {
                    winners.push(m.score1 > m.score2 ? m.team1 : m.team2);
                }
            });

            this.tournamentRound = 2;
            this.tournamentMatches.push(
                { id: 5, team1: winners[0], team2: winners[1], score1: null, score2: null, round: 2 },
                { id: 6, team1: winners[2], team2: winners[3], score1: null, score2: null, round: 2 }
            );

            // Determine next opponent for player
            const playerMatch = this.tournamentMatches.find(m => m.round === 2 && (m.team1 === this.selectedTeam || m.team2 === this.selectedTeam));
            this.selectedOpponent = playerMatch.team1 === this.selectedTeam ? playerMatch.team2 : playerMatch.team1;

            alert('YARIM FINAL bosqichiga yo\'l oldingiz!');
            this.showScreen('tournament-bracket-screen');
        } else if (this.tournamentRound === 2) {
            // Semi-finals finished. Move to Final
            const winners = [];
            this.tournamentMatches.forEach(m => {
                if (m.round === 2) {
                    winners.push(m.score1 > m.score2 ? m.team1 : m.team2);
                }
            });

            this.tournamentRound = 3;
            this.tournamentMatches.push(
                { id: 7, team1: winners[0], team2: winners[1], score1: null, score2: null, round: 3 }
            );

            this.selectedOpponent = winners[0] === this.selectedTeam ? winners[1] : winners[0];

            alert('FINAL bosqichiga yo\'l oldingiz! Chempionlik yaqin!');
            this.showScreen('tournament-bracket-screen');
        } else if (this.tournamentRound === 3) {
            // Won the Cup!
            alert('TABRIKLAYMIZ! SIZ JAHON KUBOGINI QO\'LGA KIRITDINGIZ! 🏆🎉');
            if (window.confetti) window.confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
            this.showScreen('main-menu');
        }
        this.updateTournamentUI();
    }

    updateTournamentUI() {
        const getTeamDisplay = (id) => {
            const t = this.tournamentTeams.find(x => x.id === id);
            return t ? `${t.flag} ${t.name}` : id;
        };

        const renderBox = (matchId, boxElementId) => {
            const m = this.tournamentMatches.find(x => x.id === matchId);
            const el = document.getElementById(boxElementId);
            if (el) {
                if (m) {
                    const sc1 = m.score1 !== null ? m.score1 : '';
                    const sc2 = m.score2 !== null ? m.score2 : '';
                    el.innerHTML = `<span style="font-weight:bold">${getTeamDisplay(m.team1)}</span> ${sc1} - ${sc2} <span style="font-weight:bold">${getTeamDisplay(m.team2)}</span>`;
                } else {
                    el.innerText = '? vs ?';
                }
            }
        };

        // Render QF
        renderBox(1, 'qf-match-1');
        renderBox(2, 'qf-match-2');
        renderBox(3, 'qf-match-3');
        renderBox(4, 'qf-match-4');

        // Render SF
        renderBox(5, 'sf-match-1');
        renderBox(6, 'sf-match-2');

        // Render Final
        renderBox(7, 'final-match');
    }

    startActiveMatch() {
        const hTeam = this.tournamentTeams.find(t => t.id === this.selectedTeam);
        const aTeam = this.tournamentTeams.find(t => t.id === this.selectedOpponent);

        if (!hTeam || !aTeam) return;

        // Hide overlay, open HUD
        this.showScreen('game-hud');

        // Configure active match state
        if (window.matchInstance) {
            window.matchInstance.selectedTeam = hTeam.id;
            window.matchInstance.selectedTeamName = hTeam.name;
            window.matchInstance.opponentTeamName = aTeam.name;

            // Apply Stadium Weather/Lighting Conditions
            window.matchInstance.stadiumTheme = this.selectedStadium;
            window.matchInstance.setupStadiumTheme(this.selectedStadium);

            // Set HUD Info
            document.getElementById('hud-home-name').innerText = hTeam.id;
            document.getElementById('hud-away-name').innerText = aTeam.id;
            document.getElementById('hud-home-flag').innerText = hTeam.flag;
            document.getElementById('hud-away-flag').innerText = aTeam.flag;
            
            // Set stats values
            document.getElementById('hud-home-score').innerText = '0';
            document.getElementById('hud-away-score').innerText = '0';
            window.matchInstance.homeScore = 0;
            window.matchInstance.awayScore = 0;
            window.matchInstance.matchTime = 0;

            // Disable fouls for training mode
            window.matchInstance.isTraining = (this.selectedMode === 'training');

            // Trigger Kickoff Immediately
            window.matchInstance.startWalkoutCinematic();
        }
    }
}

window.gameMenu = new MenuController();
window.addEventListener('DOMContentLoaded', () => {
    window.gameMenu.init();
});
