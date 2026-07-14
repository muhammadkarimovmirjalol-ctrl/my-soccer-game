class RefereeController {
    constructor() {
        this.kickoffImmunityTime = 5.0; // 5 seconds kickoff immunity
        this.foulCooldown = 0;
    }

    update(dt) {
        if (this.kickoffImmunityTime > 0) {
            this.kickoffImmunityTime -= dt;
        }
        if (this.foulCooldown > 0) {
            this.foulCooldown -= dt;
        }
    }

    resetImmunity() {
        this.kickoffImmunityTime = 5.0;
        console.log("[Referee] Kickoff Immunity activated for 5 seconds.");
    }

    checkTackleFoul(player, opponent, dist, relativeSpeed, isSliding) {
        // Detailed debug logging as requested
        console.log(`[Referee Check] Dist: ${dist.toFixed(2)}, RelVel: ${relativeSpeed.toFixed(2)}, Sliding: ${isSliding}, Immunity: ${this.kickoffImmunityTime > 0}`);

        if (this.kickoffImmunityTime > 0) return false;
        if (this.foulCooldown > 0) return false;

        // Strict conditions for slide tackle foul:
        // 1. Extreme contact (distance < 1.2)
        // 2. Player must be actively sliding
        // 3. High relative speed (contact velocity > 12)
        // 4. Random chance (60% to represent referee discretion)
        if (dist < 1.2 && isSliding && relativeSpeed > 12 && Math.random() < 0.6) {
            this.foulCooldown = 4.0; // Prevent consecutive fouls
            console.warn(`[Referee Foul Triggered] Dist: ${dist.toFixed(2)}, RelVel: ${relativeSpeed.toFixed(2)}`);
            return true;
        }
        return false;
    }

    triggerFoul(player, gameInstance) {
        gameInstance.isPlaying = false;
        
        try {
            gameAudio.playWhistle();
        } catch (e) {
            console.warn(e);
        }

        const isYellow = Math.random() > 0.4;
        const overlay = document.getElementById('referee-card-overlay');
        const cardVisual = document.getElementById('card-type-visual');
        const playerNameEl = document.getElementById('card-player-name');

        if (playerNameEl) playerNameEl.innerText = player.userData.name;
        
        if (overlay && cardVisual) {
            if (isYellow) {
                cardVisual.className = "ref-card yellow-card";
                overlay.classList.remove('hidden');
                gameInstance.cardCount.homeYellow++;
            } else {
                cardVisual.className = "ref-card red-card";
                overlay.classList.remove('hidden');
                gameInstance.cardCount.homeRed++;
                // Send player off the pitch temporarily
                setTimeout(() => {
                    player.position.set(0, -50, 0);
                }, 1000);
            }
        }

        setTimeout(() => {
            if (overlay) overlay.classList.add('hidden');
            gameInstance.isPlaying = true;
            gameInstance.resetBall();
            this.resetImmunity(); // Give immunity after foul reset
        }, 3000);
    }
}

window.gameReferee = new RefereeController();
