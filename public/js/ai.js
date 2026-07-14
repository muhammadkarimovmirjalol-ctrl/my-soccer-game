class AIController {
    constructor() {
        this.difficulty = 'medium'; // 'easy', 'medium', 'hard'
        this.difficultySpeedMult = { easy: 0.7, medium: 0.9, hard: 1.15 };
    }

    setDifficulty(diff) {
        this.difficulty = diff;
        console.log(`[AI] Game difficulty set to: ${diff}`);
    }

    updateGoalkeeper(gk, isHome, ball, ballRadius, fieldLength, dt) {
        const goalZ = isHome ? (fieldLength / 2) : (-fieldLength / 2);
        const distToBall = gk.position.distanceTo(ball.position);

        // Target position to guard the center of the goal
        const defaultGKPos = new THREE.Vector3(0, 0, goalZ);

        if (distToBall < 11.0) {
            // GK rushes to intercept the ball
            const dir = ball.position.clone().sub(gk.position);
            dir.y = 0;
            if (dir.length() > 0.4) {
                gk.position.addScaledVector(dir.normalize(), 6.5 * dt);
                gk.rotation.y = Math.atan2(dir.x, dir.z);
            } else {
                // GK reached the ball! Save & Clear it!
                const clearDir = new THREE.Vector3(Math.random() * 2 - 1, 0.4, isHome ? -1.0 : 1.0).normalize();
                ball.position.copy(gk.position).add(clearDir.clone().multiplyScalar(0.8));
                window.matchInstance.ballVelocity.copy(clearDir.multiplyScalar(18.0));
                window.matchInstance.hasBallControl = false;
                
                try {
                    gameAudio.playKick();
                } catch(e) {}
                
                console.log(`[AI] Goalkeeper ${isHome ? 'Home' : 'Away'} saved and cleared the ball.`);
            }
        } else {
            // GK returns to standard goalmouth guarding position
            const dirToDefault = defaultGKPos.clone().sub(gk.position);
            dirToDefault.y = 0;
            if (dirToDefault.length() > 0.3) {
                gk.position.addScaledVector(dirToDefault.normalize(), 4.5 * dt);
                gk.rotation.y = Math.atan2(dirToDefault.x, dirToDefault.z);
            }
        }

        // Restrict GK boundary to goal box limits
        gk.position.x = THREE.MathUtils.clamp(gk.position.x, -5, 5);
        gk.position.z = isHome ? THREE.MathUtils.clamp(gk.position.z, 23, 29) : THREE.MathUtils.clamp(gk.position.z, -29, -23);
    }

    updateOutfieldAI(bot, ball, isOpponent, dt, activePlayer) {
        if (!bot.userData) bot.userData = {};
        if (bot.userData.stunTime > 0) {
            bot.userData.stunTime -= dt;
            return;
        }

        const difficultyMult = this.difficultySpeedMult[this.difficulty] || 0.9;
        const speed = (bot.userData.speed || 8) * difficultyMult;

        const role = bot.userData.role; // 'DF', 'MF', 'FW', 'GK'
        const isHome = !isOpponent;

        // Default formation positions when ball is away
        let defaultPos = new THREE.Vector3(0, 0, 0);
        if (isHome) {
            if (role === 'DF') defaultPos.set(0, 0, 14);
            else if (role === 'MF') defaultPos.set(-4, 0, 6);
            else if (role === 'FW') defaultPos.set(4, 0, 2);
        } else {
            // Opponent
            if (role === 'DF') defaultPos.set(0, 0, -14);
            else if (role === 'MF') defaultPos.set(4, 0, -6);
            else if (role === 'FW') defaultPos.set(-4, 0, -2);
        }

        const distToBall = bot.position.distanceTo(ball.position);

        // Smart Coach Logic:
        // The nearest player chases the ball, others mark space
        const teammates = isOpponent ? window.matchInstance.awayTeamPlayers : window.matchInstance.homeTeamPlayers;
        
        let nearestToBall = true;
        teammates.forEach(mate => {
            if (mate !== bot && mate.userData.role !== 'GK') {
                if (mate.position.distanceTo(ball.position) < distToBall) {
                    nearestToBall = false;
                }
            }
        });

        // If this bot is not active user control
        if (bot !== activePlayer) {
            if (nearestToBall) {
                // Chase the ball
                const dir = ball.position.clone().sub(bot.position);
                dir.y = 0;
                if (dir.length() > 0.6) {
                    bot.position.addScaledVector(dir.normalize(), speed * dt);
                    bot.rotation.y = Math.atan2(dir.x, dir.z);
                }
            } else {
                // Return to tactical zone position
                const dir = defaultPos.clone().sub(bot.position);
                dir.y = 0;
                if (dir.length() > 0.5) {
                    bot.position.addScaledVector(dir.normalize(), (speed * 0.75) * dt);
                    bot.rotation.y = Math.atan2(dir.x, dir.z);
                }
            }
        }
    }
}

window.gameAI = new AIController();
