class FootballDatabase {
    constructor() {
        this.storageKey = 'fc_mobile_3d_db';
        
        // Comprehensive 12 Countries Database with 3 Fictional Clubs each
        this.countriesDb = {
            UZB: { name: 'O\'ZBEKISTON', flag: '🇺🇿', clubs: [
                { id: 'uzb_1', name: 'Toshkent Lions', rating: 4.5, color: '#00c3ff' },
                { id: 'uzb_2', name: 'Buxoro Stars', rating: 4.0, color: '#2ed573' },
                { id: 'uzb_3', name: 'Samarkand Kings', rating: 4.2, color: '#ffa502' }
            ]},
            POR: { name: 'PORTUGAL', flag: '🇵🇹', clubs: [
                { id: 'por_1', name: 'Lisbon Eagles', rating: 4.8, color: '#ff4757' },
                { id: 'por_2', name: 'Porto Dragons', rating: 4.6, color: '#2e86de' },
                { id: 'por_3', name: 'Braga Warriors', rating: 4.2, color: '#ee5253' }
            ]},
            BRA: { name: 'BRAZIL', flag: '🇧🇷', clubs: [
                { id: 'bra_1', name: 'Rio Samba FC', rating: 4.9, color: '#ffd32a' },
                { id: 'bra_2', name: 'Santos Sharks', rating: 4.5, color: '#05c46b' },
                { id: 'bra_3', name: 'Sao Paulo Kings', rating: 4.6, color: '#485460' }
            ]},
            ARG: { name: 'ARGENTINA', flag: '🇦🇷', clubs: [
                { id: 'arg_1', name: 'Buenos Aires FC', rating: 4.8, color: '#0fbcf9' },
                { id: 'arg_2', name: 'Rosario Gold', rating: 4.5, color: '#ffa801' },
                { id: 'arg_3', name: 'La Plata Stars', rating: 4.2, color: '#0be881' }
            ]},
            ESP: { name: 'SPAIN', flag: '🇪🇸', clubs: [
                { id: 'esp_1', name: 'Madrid Rebels', rating: 4.9, color: '#ffd32a' },
                { id: 'esp_2', name: 'Catalonia Giants', rating: 4.9, color: '#ef5777' },
                { id: 'esp_3', name: 'Seville Knights', rating: 4.4, color: '#f53b57' }
            ]},
            DEU: { name: 'GERMANY', flag: '🇩🇪', clubs: [
                { id: 'deu_1', name: 'Munich Giants', rating: 4.9, color: '#f53b57' },
                { id: 'deu_2', name: 'Dortmund Hornets', rating: 4.7, color: '#ffd32a' },
                { id: 'deu_3', name: 'Berlin Eagles', rating: 4.2, color: '#4b5563' }
            ]},
            FRA: { name: 'FRANCE', flag: '🇫🇷', clubs: [
                { id: 'fra_1', name: 'Paris Stars', rating: 4.9, color: '#3c40c6' },
                { id: 'fra_2', name: 'Lyon Knights', rating: 4.5, color: '#ffd32a' },
                { id: 'fra_3', name: 'Marseille Hawks', rating: 4.4, color: '#0fbcf9' }
            ]},
            ITA: { name: 'ITALY', flag: '🇮🇹', clubs: [
                { id: 'ita_1', name: 'Milan Devils', rating: 4.7, color: '#ff4757' },
                { id: 'ita_2', name: 'Turin Zebras', rating: 4.8, color: '#ffffff' },
                { id: 'ita_3', name: 'Rome Wolves', rating: 4.5, color: '#ffa801' }
            ]},
            ENG: { name: 'ENGLAND', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', clubs: [
                { id: 'eng_1', name: 'London Gunners', rating: 4.8, color: '#f53b57' },
                { id: 'eng_2', name: 'Manchester Devils', rating: 4.9, color: '#f53b57' },
                { id: 'eng_3', name: 'Liverpool Reds', rating: 4.8, color: '#f53b57' }
            ]},
            NLD: { name: 'NETHERLANDS', flag: '🇳🇱', clubs: [
                { id: 'nld_1', name: 'Amsterdam Ajax', rating: 4.6, color: '#f53b57' },
                { id: 'nld_2', name: 'Rotterdam Hawks', rating: 4.3, color: '#4b5563' },
                { id: 'nld_3', name: 'Eindhoven Stars', rating: 4.4, color: '#ff5e57' }
            ]},
            BEL: { name: 'BELGIUM', flag: '🇧🇪', clubs: [
                { id: 'bel_1', name: 'Brussels Lions', rating: 4.5, color: '#ffd32a' },
                { id: 'bel_2', name: 'Bruges Devils', rating: 4.4, color: '#3c40c6' },
                { id: 'bel_3', name: 'Anderlecht Stars', rating: 4.3, color: '#9b59b6' }
            ]},
            USA: { name: 'USA', flag: '🇺🇸', clubs: [
                { id: 'usa_1', name: 'LA Galaxy Stars', rating: 4.3, color: '#0fbcf9' },
                { id: 'usa_2', name: 'New York Bulls', rating: 4.4, color: '#ff5e57' },
                { id: 'usa_3', name: 'Miami Sharks', rating: 4.5, color: '#ffc048' }
            ]},
            JPN: { name: 'JAPAN', flag: '🇯🇵', clubs: [
                { id: 'jpn_1', name: 'Tokyo Samurai', rating: 4.2, color: '#ffffff' },
                { id: 'jpn_2', name: 'Osaka Tigers', rating: 4.0, color: '#ffd32a' },
                { id: 'jpn_3', name: 'Kyoto Ninjas', rating: 4.1, color: '#9c88ff' }
            ]},
            KOR: { name: 'SOUTH KOREA', flag: '🇰🇷', clubs: [
                { id: 'kor_1', name: 'Seoul Dragons', rating: 4.2, color: '#f53b57' },
                { id: 'kor_2', name: 'Busan Sharks', rating: 3.9, color: '#0fbcf9' },
                { id: 'kor_3', name: 'Incheon Stars', rating: 4.0, color: '#ffd32a' }
            ]},
            MAR: { name: 'MOROCCO', flag: '🇲🇦', clubs: [
                { id: 'mar_1', name: 'Rabat Lions', rating: 4.3, color: '#05c46b' },
                { id: 'mar_2', name: 'Casablanca Stars', rating: 4.1, color: '#ffd32a' },
                { id: 'mar_3', name: 'Marrakesh Hawks', rating: 4.0, color: '#ff5e57' }
            ]}
        };

        // Roster Database
        this.fictionalPlayers = [
            // Goalkeepers (GK)
            { id: 'gk_1', name: 'Jasur', role: 'GK', country: '🇺🇿', rating: 83, pac: 80, sho: 15, pas: 65, def: 83, phy: 80, price: 400 },
            { id: 'gk_2', name: 'Buffo', role: 'GK', country: '🇮🇹', rating: 89, pac: 85, sho: 12, pas: 68, def: 90, phy: 84, price: 900 },
            { id: 'gk_3', name: 'Alisson', role: 'GK', country: '🇧🇷', rating: 87, pac: 84, sho: 14, pas: 80, def: 86, phy: 82, price: 750 },
            { id: 'gk_4', name: 'De Gea', role: 'GK', country: '🇪🇸', rating: 85, pac: 83, sho: 10, pas: 72, def: 84, phy: 78, price: 600 },
            // Defenders (DF)
            { id: 'df_1', name: 'Bakhodir', role: 'DF', country: '🇺🇿', rating: 82, pac: 78, sho: 40, pas: 70, def: 83, phy: 85, price: 450 },
            { id: 'df_2', name: 'Ramos', role: 'DF', country: '🇪🇸', rating: 88, pac: 80, sho: 68, pas: 75, def: 88, phy: 90, price: 850 },
            { id: 'df_3', name: 'Silva', role: 'DF', country: '🇧🇷', rating: 86, pac: 75, sho: 55, pas: 78, def: 87, phy: 80, price: 700 },
            { id: 'df_4', name: 'Van Dijk', role: 'DF', country: '🇳🇱', rating: 90, pac: 82, sho: 60, pas: 77, def: 91, phy: 92, price: 1100 },
            { id: 'df_5', name: 'Chiellini', role: 'DF', country: '🇮🇹', rating: 85, pac: 70, sho: 45, pas: 68, def: 87, phy: 88, price: 620 },
            // Midfielders (MF)
            { id: 'mf_1', name: 'Mirjalol', role: 'MF', country: '🇺🇿', rating: 88, pac: 79, sho: 85, pas: 92, def: 60, phy: 70, price: 800 },
            { id: 'mf_2', name: 'Zizou', role: 'MF', country: '🇫🇷', rating: 91, pac: 81, sho: 86, pas: 94, def: 66, phy: 82, price: 1200 },
            { id: 'mf_3', name: 'Modri', role: 'MF', country: '🇭🇷', rating: 87, pac: 76, sho: 78, pas: 89, def: 72, phy: 68, price: 750 },
            { id: 'mf_4', name: 'De Bruyne', role: 'MF', country: '🇧🇪', rating: 91, pac: 78, sho: 88, pas: 95, def: 64, phy: 78, price: 1250 },
            { id: 'mf_5', name: 'Odil', role: 'MF', country: '🇺🇿', rating: 81, pac: 82, sho: 70, pas: 76, def: 78, phy: 83, price: 380 },
            { id: 'mf_6', name: 'Kroos', role: 'MF', country: '🇩🇪', rating: 88, pac: 68, sho: 81, pas: 93, def: 70, phy: 72, price: 850 },
            // Forwards (FW)
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
                nickname: 'Kapitan',
                clubName: 'Yulduzlar FK',
                country: '🇺🇿',
                countryCode: 'UZB',
                logoColor: '#00c3ff',
                xp: 0,
                level: 1,
                coins: 1000,
                trophies: 0,
                matchesPlayed: 0,
                wins: 0,
                losses: 0,
                activeFormation: '4-3-3', // 4-4-2, 4-3-3, 3-5-2, 5-3-2
                tactic: 'balanced', // balanced, attacking, defensive
                captainId: 'fw_3',
                lang: 'uz'
            },
            ownedPlayers: ['gk_1', 'df_1', 'mf_5', 'fw_3', 'mf_1'], // Initial squad
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
            ],
            quests: [
                { id: 'qst_1', title: 'Mashq maydonchasi', desc: 'Istalgan mashg\'ulotni yakunlang', reward: 100, xpReward: 150, completed: false },
                { id: 'qst_2', title: 'Gollarga boy bahs', desc: 'Matchda kamida 2 ta gol urib g\'olib bo\'ling', reward: 150, xpReward: 200, completed: false }
            ],
            seasonPass: {
                xpProgress: 0,
                claimedTiers: []
            },
            leagueTable: [
                { club: 'Yulduzlar FK (Siz)', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'London Gunners', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Rio Samba FC', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Madrid Rebels', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Munich Giants', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Paris Stars', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Milan Devils', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Amsterdam Ajax', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'Seoul Dragons', gp: 0, w: 0, d: 0, l: 0, pts: 0 },
                { club: 'LA Galaxy Stars', gp: 0, w: 0, d: 0, l: 0, pts: 0 }
            ],
            chatLogs: [
                { sender: 'Sanjar_99', club: 'Toshkent Lions', flag: '🇺🇿', text: 'Onlayn chempionat qachon boshlanadi do\'stlar?' },
                { sender: 'Ronaldo_Fans', club: 'Lisbon Eagles', flag: '🇵🇹', text: 'Tarkibga Eldor (FW) kartasini qo\'shdim, stats juda ajoyib ekan!' },
                { sender: 'Messi_Magic', club: 'Buenos Aires FC', flag: '🇦🇷', text: 'Penaltilar seriyasi juda daxshat bo\'ldi!' }
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
            GK: this.getPlayer(this.state.activeSquad.GK) || this.fictionalPlayers[0],
            DF: this.getPlayer(this.state.activeSquad.DF) || this.fictionalPlayers[4],
            MF: this.getPlayer(this.state.activeSquad.MF) || this.fictionalPlayers[10],
            FW: this.getPlayer(this.state.activeSquad.FW) || this.fictionalPlayers[14],
            SUB: this.getPlayer(this.state.activeSquad.SUB) || this.fictionalPlayers[11]
        };
    }

    buyPlayerPack(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return { success: false, msg: 'O\'yinchi topilmadi!' };
        if (this.state.ownedPlayers.includes(playerId)) return { success: false, msg: 'Sizda bu o\'yinchi bor!' };
        if (this.state.profile.coins < player.price) return { success: false, msg: 'Mablag\' yetarli emas!' };

        this.state.profile.coins -= player.price;
        this.state.ownedPlayers.push(playerId);
        this.addXP(200);
        this.save();
        return { success: true, msg: `${player.name} sotib olindi! +200 XP` };
    }

    assignSquadPlayer(role, playerId) {
        if (!this.state.ownedPlayers.includes(playerId)) return { success: false, msg: 'Ushbu o\'yinchi sizda yo\'q!' };
        if (!['GK', 'DF', 'MF', 'FW', 'SUB'].includes(role)) return { success: false, msg: 'Noto\'g\'ri pozitsiya!' };
        
        for (const r in this.state.activeSquad) {
            if (this.state.activeSquad[r] === playerId) {
                this.state.activeSquad[r] = this.state.activeSquad[role]; 
            }
        }
        
        this.state.activeSquad[role] = playerId;
        this.save();
        return { success: true, msg: 'Tarkib muvaffaqiyatli o\'zgartirildi!' };
    }

    addXP(amount) {
        this.state.profile.xp += amount;
        this.state.seasonPass.xpProgress += amount;
        
        // Level up check
        const nextLevelThreshold = this.state.profile.level * 1000;
        if (this.state.profile.xp >= nextLevelThreshold) {
            this.state.profile.level++;
            this.state.profile.coins += 500; // Level Up reward!
            alert(`Tabriklaymiz! Yangi darajaga erishdingiz: Level ${this.state.profile.level}! +500 Tanga Mukofot! 🎉`);
        }
        this.save();
    }

    completeQuest(id) {
        const qst = this.state.quests.find(q => q.id === id);
        if (qst && !qst.completed) {
            qst.completed = true;
            this.state.profile.coins += qst.reward;
            this.addXP(qst.xpReward);
            this.save();
            return { success: true, msg: `Vazifa bajarildi! +${qst.reward} Tanga, +${qst.xpReward} XP` };
        }
        return { success: false, msg: 'Vazifa allaqachon bajarilgan!' };
    }

    claimSeasonPassTier(tierIndex, requiredXp, rewardCoins, rewardPlayerId = null) {
        if (this.state.seasonPass.xpProgress < requiredXp) return { success: false, msg: 'XP yetarli emas!' };
        if (this.state.seasonPass.claimedTiers.includes(tierIndex)) return { success: false, msg: 'Allaqachon olingan!' };

        this.state.seasonPass.claimedTiers.push(tierIndex);
        if (rewardCoins > 0) this.state.profile.coins += rewardCoins;
        if (rewardPlayerId) {
            if (!this.state.ownedPlayers.includes(rewardPlayerId)) {
                this.state.ownedPlayers.push(rewardPlayerId);
            }
        }
        this.save();
        return { success: true, msg: 'Mukofot muvaffaqiyatli olindi! 🎁' };
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

    simLeagueRound(userGoals, opponentGoals) {
        // Update user stats in league table
        const userRow = this.state.leagueTable.find(t => t.club.includes('Yulduzlar FK'));
        if (userRow) {
            userRow.gp++;
            if (userGoals > opponentGoals) {
                userRow.w++;
                userRow.pts += 3;
            } else if (userGoals === opponentGoals) {
                userRow.d++;
                userRow.pts += 1;
            } else {
                userRow.l++;
            }
        }

        // Simulate all other club standings using a simple random generator
        this.state.leagueTable.forEach(row => {
            if (!row.club.includes('Yulduzlar FK')) {
                row.gp++;
                const rand = Math.random();
                if (rand < 0.45) {
                    row.w++;
                    row.pts += 3;
                } else if (rand < 0.7) {
                    row.d++;
                    row.pts += 1;
                } else {
                    row.l++;
                }
            }
        });

        // Sort table by points descending
        this.state.leagueTable.sort((a, b) => b.pts - a.pts);
        this.save();
    }

    updateStats(won) {
        this.state.profile.matchesPlayed++;
        if (won) {
            this.state.profile.wins++;
            this.state.profile.coins += 250; 
            this.addXP(300);
            this.completeAchievement('ach_1');
        } else {
            this.state.profile.losses++;
            this.state.profile.coins += 100;
            this.addXP(100);
        }
        this.save();
    }
}

window.gameDb = new FootballDatabase();
