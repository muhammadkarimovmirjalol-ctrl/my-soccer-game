class PhysicsController {
    constructor() {
        this.friction = 0.985;
        this.bounce = 0.7;
    }

    setWeather(weather) {
        if (weather === 'rain') {
            this.friction = 0.992; // Less friction on wet grass = ball rolls faster/longer
            console.log("[Physics] Wet pitch physics activated: lower ball friction.");
        } else {
            this.friction = 0.985; // Normal grass friction
            console.log("[Physics] Dry pitch physics activated.");
        }
    }

    updateBall(ball, ballVelocity, ballRadius, fieldWidth, fieldLength) {
        // Apply friction
        ballVelocity.multiplyScalar(this.friction);

        // Move ball (simulated delta time)
        ball.position.add(ballVelocity.clone().multiplyScalar(0.016));

        // Rebounds off Goalposts (3D goals)
        const halfW = fieldWidth / 2;
        const halfL = fieldLength / 2;

        // Sideline / touchline rebounds
        if (Math.abs(ball.position.x) > halfW) {
            ball.position.x = Math.sign(ball.position.x) * halfW;
            ballVelocity.x *= -this.bounce;
        }

        // Endline rebounds (except inside goalmouth width 7.32m / 2 = 3.66m)
        if (Math.abs(ball.position.z) > halfL) {
            if (Math.abs(ball.position.x) > 3.66) {
                ball.position.z = Math.sign(ball.position.z) * halfL;
                ballVelocity.z *= -this.bounce;
            }
        }

        // Keep ball height correct (gravity check if kicked up)
        if (ball.position.y > ballRadius) {
            ballVelocity.y -= 9.8 * 0.016; // gravity
        } else {
            ball.position.y = ballRadius;
            if (ballVelocity.y < 0) ballVelocity.y = 0;
        }
    }
}

window.gamePhysics = new PhysicsController();
