function resetGame() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    snake = [{ x: 10, y: 10 }]; prevSnake = [{ x: 10, y: 10 }];
    dir = { x: 0, y: 0 }; nextDir = { x: 0, y: 0 };
    score = 0; playerPoopsEaten = 0; applesEaten = 0;
    scoreSpan.textContent = '0'; poopEatenSpan.textContent = '0/5'; gameOverDiv.textContent = '';
    gameRunning = true; gameOverFlag = false; paused = false;
    poisonActive = false; lastPoisonCheck = 0; pill = null; sickParticles = [];
    poops = [];
    poopSnake = []; prevPoopSnake = []; poopSnakeActive = false; poopSnakeNextThreshold = CONFIG.poopThresholdStart;
    poopSnakeJustSpawned = false; warningActive = false; warningPulse = 0; spawnSide = -1;
    poopSnakeMessageText = ''; poopSnakeMessageUntil = 0;
    bullet = null; prevBullet = null;
    jailMode = false; jailSnake = []; jailPrevSnake = []; awaitingJailStart = false; awaitingJailReason = '';
    jailCountdown = false; flashStart = 0; laserStart = 0;
    worldDiscovered = false; canvas.width = 400;
    egg = null; eggCooldown = 0; firstEggLaid = false; eggAppleCounter = 0;
    lastEggTime = 0;
    babySnakes = []; babyPrevSnakes = []; babyDirections = []; awaitingHatch = false; hadBabies = false;
    vultures = []; prevVultures = []; vulturesPerWave = 1; vultureMoveCounter = 0;
    generateFoods();
    lastUpdateTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGame(msg) {
    if (msg === 'Потомство уничтожено') {
        gameRunning = false; gameOverFlag = true;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        gameOverDiv.textContent = msg;
        if (score > highScore) { highScore = score; highScoreSpan.textContent = highScore; localStorage.setItem('snakeHighScore', highScore); }
        bullet = null; jailMode = false; awaitingJailStart = false; jailCountdown = false;
        awaitingHatch = false;
        return;
    }
    if (egg && !awaitingHatch && gameRunning) {
        awaitingHatch = true;
        gameOverDiv.textContent = 'Нажмите X, чтобы вылупиться';
        snake = []; prevSnake = []; dir = { x: 0, y: 0 }; nextDir = { x: 0, y: 0 };
        gameRunning = false;
        bullet = null; jailMode = false; awaitingJailStart = false; jailCountdown = false;
        return;
    }
    gameRunning = false; gameOverFlag = true;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    gameOverDiv.textContent = msg || 'Игра окончена! Нажми пробел для рестарта';
    if (score > highScore) { highScore = score; highScoreSpan.textContent = highScore; localStorage.setItem('snakeHighScore', highScore); }
    bullet = null; jailMode = false; awaitingJailStart = false; jailCountdown = false;
    awaitingHatch = false;
}

function updateBullet() {
    if (!bullet || worldDiscovered) return;
    for (let step = 1; step <= CONFIG.bulletSpeed; step++) {
        const checkX = Math.round(bullet.x + bullet.dirX * step), checkY = Math.round(bullet.y + bullet.dirY * step);
        if (checkX < 0 || checkX >= maxX() || checkY < 0 || checkY >= CONFIG.fullHeight) { bullet = null; return; }
        const foodIdx = foods.findIndex(f => f.x === checkX && f.y === checkY);
        if (foodIdx !== -1) {
            foods.splice(foodIdx, 1); pushNewFoodCell();
            bullet = null; return;
        }
        if (poopSnakeActive && poopSnake.some(s => s.x === checkX && s.y === checkY)) {
            poopSnakeActive = false; poopSnake = []; prevPoopSnake = []; poopSnakeMessageText = '';
            bullet = null;
            awaitingJailStart = true;
            awaitingJailReason = 'Вы — убийца!';
            return;
        }
        if (egg && checkX === egg.x && checkY === egg.y) { egg = null; bullet = null; return; }
        const vultIdx = vultures.findIndex(v => v.x === checkX && v.y === checkY);
        if (vultIdx !== -1) {
            vultures.splice(vultIdx, 1); prevVultures.splice(vultIdx, 1);
            bullet = null; return;
        }
    }
    prevBullet = { x: bullet.x, y: bullet.y };
    bullet.x += bullet.dirX * CONFIG.bulletSpeed;
    bullet.y += bullet.dirY * CONFIG.bulletSpeed;
}

function updatePoison() {
    if (!poisonActive || jailMode || jailCountdown || awaitingHatch) return;
    const now = performance.now(), elapsed = now - lastPoisonCheck;
    if (elapsed >= 1000) {
        const sec = Math.floor(elapsed / 1000);
        const deduct = Math.ceil(score * CONFIG.poisonPercent * sec);
        score = Math.max(0, score - deduct);
        scoreSpan.textContent = score;
        lastPoisonCheck = now - (elapsed % 1000);
        if (score <= 0) stopGame('Смерть от отравления');
    }
}

function updateGame() {
    if (!gameRunning || paused) return;
    if (awaitingJailStart) return;
    if (jailCountdown) { updateCountdown(); return; }
    if (jailMode) { updateJail(); return; }
    if (awaitingHatch) return;

    prevVultures = vultures.map(v => ({...v}));
    updatePlayer();
    if (!worldDiscovered) updateBullet();
    updatePoison();
    updateBabies();

    vultureMoveCounter++;
    if (vultureMoveCounter >= CONFIG.vultureSpeedDivider) { updateVultures(); vultureMoveCounter = 0; }

    if (worldDiscovered && applesEaten >= CONFIG.vultureThreshold && vultures.length === 0) {
        spawnVultures(vulturesPerWave);
        vulturesPerWave++;
        applesEaten -= CONFIG.vultureThreshold;
    }

    if (poopSnakeActive) {
        if (poopSnakeJustSpawned) poopSnakeJustSpawned = false;
        else updatePoopSnake();
    }
    if (!poopSnakeActive && poops.length >= poopSnakeNextThreshold) spawnPoopSnake();
    updateWarning();
    if (poopSnakeMessageText && performance.now() > poopSnakeMessageUntil) poopSnakeMessageText = '';
    if (warningActive) warningPulse += 0.1;
}

function gameLoop(now) {
    if (!gameRunning && !jailCountdown && !awaitingHatch) { drawGame(1, now); animationFrameId = null; return; }
    if (paused) {
        lastUpdateTime = now;
        drawGame(1, now);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    const elapsed = now - lastUpdateTime;
    if (elapsed >= CONFIG.snakeSpeed) { updateGame(); lastUpdateTime += CONFIG.snakeSpeed; }
    sickParticles = sickParticles.filter(p => (p.x += p.vx*16/1000, p.y += p.vy*16/1000, p.life -= 16) > 0);
    const t = gameRunning ? Math.min((now - lastUpdateTime) / CONFIG.snakeSpeed, 1) : 1;
    drawGame(t, now);
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Старт
snake = [{x:10,y:10}]; prevSnake = [{x:10,y:10}];
generateFoods();
gameRunning = false; gameOverFlag = false;
animationFrameId = requestAnimationFrame(ts => { drawGame(0, ts); animationFrameId = null; });
