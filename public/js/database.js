class FootballDatabase {
    constructor() {
        this.storageKey = 'fc_mobile_3d_db';
        this.fictionalPlayers = [
            // Goalkeepers
            { id: 'gk_1', name: 'Jasur', role: 'GK', country: '🇺🇿', rating: 83, pac: 80, sho: 15, pas: 65, def: 83, phy: 80, price: 400 },
            { id: 'gk_2', name: 'Buffo', role: 'GK', country: '🇮🇹', rating: 89, pac: 85, sho: 12, pas: 68, def: 90, phy: 84, price: 900 },
            { id: 'gk_3', name: 'Alisson', role: 'GK', country: '🇧🇷', rating: 87, pac: 84, sho: 14, pas: 80, def: 86, phy: 82, price: 750 },
            // Defenders
            { id: 'df_1', name: 'Bakhodir', role: 'DF', country: '🇺🇿', rating: 82, pac: 78, sho: 40, pas: 70, def: 83, phy: 85, price: 450 },
            { id: 'df_2', name: 'Ramos', role: 'DF', country: '🇪🇸', rating: 88, pac: 80, sho: 68, pas: 75, def: 88, phy: 90, price: 850 },
            { id: 'df_3', name: 'Silva', role: 'DF', country: '🇧🇷', rating: 86, pac: 75, sho: 55, pas: 78, def: 87, phy: 80, price: 700 },
            { id: 'df_4', name: 'Van Dijk', role: 'DF', country: '🇳🇱', rating: 90, pac: 82, sho: 60, pas: 77, def: 91, phy: 92, price: 1100 },
            // Midfielders
            { id: 'mf_1', name: 'Mirjalol', role: 'MF', country: '🇺🇿', rating: 88, pac: 79, sho: 85, pas: 92, def: 60, phy: 70, price: 800 },
            { id: 'mf_2', name: 'Zizou', role: 'MF', country: '🇫🇷', rating: 91, pac: 81, sho: 86, pas: 94, def: 66, phy: 82, price: 1200 },
            { id: 'mf_3', name: 'Modri', role: 'MF', country: '🇭🇷', rating: 87, pac: 76, sho: 78, pas: 89, def: 72, phy: 68, price: 750 },
            { id: 'mf_4', name: 'De Bruyne', role: 'MF', country: '🇧🇪', rating: 91, pac: 78, sho: 88, pas: 95, def: 64, phy: 78, price: 1250 },
            { id: 'mf_5', name: 'Odil', role: 'MF', country: '🇺🇿', rating: 81, pac: 82, sho: 70, pas: 76, def: 78, phy: 83, price: 380 },
            // Forwards
            { id: 'fw_1', name: 'C. Ronaldo', role: 'FW', country: '🇵🇹', rating: 92, pac: 91, sho: 94, pas: 82, def: 35, phy: 88, price: 1500 },
            { id: 'fw_2', name: 'L. Messi', role: 'FW', country: '🇦🇷', rating: 91, pac: 85, sho: 90, pas: 92, def: 38, phy: 65, price: 1400 },
            { id: 'fw_3', name: 'Eldor', role: 'FW', country: '🇺🇿', rating: 83, pac: 88, sho: 82, pas: 72, def: 42, phy: 81, price: 500 },
            { id: 'fw_4', name: 'Kylian', role: 'FW', country: '🇫🇷', rating: 90, pac: 97, sho: 88, pas: 80, def: 36, phy: 77, price: 1300 },
            { id: 'fw_5', name: 'Salah', role: 'FW', country: '🇪🇬', rating: 89, pac: 92, sho: 87, pas: 82, def: 45, phy: 75, price: 1000 },
            { id: 'fw_6', name: 'Neymar', role: 'FW', country: '🇧🇷', rating: 88, pac: 86, sho: 83, pas: 86, def: 30, phy: 60, price: 950 }
        ];

        this.state = this.loadState();
    }

    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Database parsing failed, resetting:", e);
            }
        }

        // Default initial setup
        const defaultState = {
            profile: {
                clubName: 'Yulduzlar FK',
                country: '🇺🇿',
                countryCode: 'UZB',
                logoStyle: 'shield', // shield, circle, star
                logoColor: '#00c3ff',
                stadium: 'classic', // classic, desert, rain, night
                stadiumName: 'Arena Toshkent',
                rating: 4.2,
                coins: 1200,
                trophies: 0,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                activeFormation: '4-3-3' // 4-4-2, 4-3-3, 3-5-2
            },
            ownedPlayers: ['gk_1', 'df_1', 'mf_5', 'fw_3', 'mf_1'], // Initial team
            activeSquad: {
                GK: 'gk_1',
                DF: 'df_1',
                MF: 'mf_1',
                FW: 'fw_3',
                SUB: 'mf_5'
            },
            achievements: [
                { id: 'ach_1', title: 'Birinchi G\'alaba', desc: 'O\'yinda ilk bor g\'olib bo\'ling', reward: 200, completed: false },
                { id: 'ach_2', title: 'To\'purar', desc: 'Jami 10 ta gol urib maydonni yondiring', target: 10, current: 0, reward: 500, completed: false },
                { id: 'ach_3', title: 'Boy Ota', desc: 'Jami 3000 tanga yig\'ing', reward: 600, completed: false }
            ]
        };

        this.save(defaultState);
        return defaultState;
    }

    save(customState = null) {
        const toSave = customState || this.state;
        localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    }

    getPlayer(id) {
        return this.fictionalPlayers.find(p => p.id === id);
    }

    getActiveSquadPlayers() {
        return {
            GK: this.getPlayer(this.state.activeSquad.GK),
            DF: this.getPlayer(this.state.activeSquad.DF),
            MF: this.getPlayer(this.state.activeSquad.MF),
            FW: this.getPlayer(this.state.activeSquad.FW),
            SUB: this.getPlayer(this.state.activeSquad.SUB)
        };
    }

    buyPlayerPack(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, msg: 'O\'yinchi topilmadi!' };
        if (this.state.ownedPlayers.includes(playerId)) return { success: false, msg: 'Sizda bu o\'yinchi bor!' };
        if (this.state.profile.coins < player.price) return { success: false, msg: 'Mablag\' yetarli emas!' };

        this.state.profile.coins -= player.price;
        this.state.ownedPlayers.push(playerId);
        this.save();
        return { success: true, msg: `${player.name} sotib olindi!` };
    }

    assignSquadPlayer(role, playerId) {
        if (!this.state.ownedPlayers.includes(playerId)) return { success: false, msg: 'Ushbu o\'yinchi sizda yo\'q!' };
        
        // Ensure role is valid
        if (!['GK', 'DF', 'MF', 'FW', 'SUB'].includes(role)) return { success: false, msg: 'Noto\'g\'ri pozitsiya!' };
        
        // Ensure player is not duplicates in other main squad roles
        for (const r in this.state.activeSquad) {
            if (this.state.activeSquad[r] === playerId) {
                this.state.activeSquad[r] = this.state.activeSquad[role]; // Swap them!
            }
        }
        
        this.state.activeSquad[role] = playerId;
        this.save();
        return { success: true, msg: 'Tarkib muvaffaqiyatli saqlandi!' };
    }

    addCoins(amount) {
        this.state.profile.coins += amount;
        
        // Check achievement: Boy Ota
        if (this.state.profile.coins >= 3000) {
            this.completeAchievement('ach_3');
        }
        this.save();
    }

    incrementGoals(goalsCount) {
        const ach = this.state.achievements.find(a => a.id === 'ach_2');
        if (ach && !ach.completed) {
            ach.current += goalsCount;
            if (ach.current >= ach.target) {
                ach.completed = true;
                this.state.profile.coins += ach.reward;
            }
        }
        this.save();
    }

    completeAchievement(id) {
        const ach = this.state.achievements.find(a => a.id === id);
        if (ach && !ach.completed) {
            ach.completed = true;
            this.state.profile.coins += ach.reward;
        }
    }

    updateStats(won) {
        this.state.profile.matchesPlayed++;
        if (won) {
            this.state.profile.wins++;
            this.state.profile.coins += 250; // Win bonus
            this.completeAchievement('ach_1');
        } else {
            this.state.profile.losses++;
            this.state.profile.coins += 100; // Play bonus
        }
        this.save();
    }
}

window.gameDb = new FootballDatabase();
