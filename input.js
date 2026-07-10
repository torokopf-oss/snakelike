window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','z','Z','x','X',']','p','P','s','S'].includes(e.key)) e.preventDefault();
    if (e.key === 'p' || e.key === 'P') {
        if (gameRunning && !gameOverFlag && !awaitingHatch && !jailMode && !jailCountdown) {
            paused = !paused;
            if (!paused) lastUpdateTime = performance.now();
        }
        return;
    }
    if (e.key === ' ') {
        if (awaitingJailStart) { awaitingJailStart = false; jailCountdown = true; jailCountdownValue = CONFIG.countdownSeconds; jailCountdownStart = performance.now(); return; }
        if (gameOverFlag) { resetGame(); return; }
        if (!gameRunning && !awaitingHatch) { resetGame(); return; }
        return;
    }
    if (e.key === 'x' || e.key === 'X') {
        if (awaitingHatch) { hatchPlayerFromEgg(); return; }
        if (egg && gameRunning && worldDiscovered && !awaitingJailStart && !jailMode) { spawnBabyFromEgg(); return; }
        const canLay = gameRunning && snake.length >= 25 && !egg && eggCooldown <= 0 && !awaitingJailStart && !jailMode && (!firstEggLaid || eggAppleCounter >= 10);
        if (canLay) {
            egg = { x: snake[snake.length-1].x, y: snake[snake.length-1].y };
            eggCooldown = 25; firstEggLaid = true; eggAppleCounter = 0;
        }
        return;
    }
    if (e.key === ']') { activateCheats(); return; }

    // Санация
    if ((e.key === 's' || e.key === 'S') && gameRunning && worldDiscovered && !awaitingJailStart && !jailMode) {
        activateSanitation();
        return;
    }

    if (!gameRunning || awaitingHatch || paused) return;
    if (jailMode) {
        if (e.key==='ArrowUp' && jailDir.y!==1) jailNextDir = {x:0,y:-1};
        else if (e.key==='ArrowDown' && jailDir.y!==-1) jailNextDir = {x:0,y:1};
        else if (e.key==='ArrowLeft' && jailDir.x!==1) jailNextDir = {x:-1,y:0};
        else if (e.key==='ArrowRight' && jailDir.x!==-1) jailNextDir = {x:1,y:0};
        return;
    }

    // Выстрел (лазер или пуля)
    if (e.key === 'z' || e.key === 'Z') {
        if (worldDiscovered) {
            if (dir.x || dir.y) fireLaser();
            return;
        }
        if (!bullet && (dir.x || dir.y)) {
            bullet = { x: snake[0].x + dir.x, y: snake[0].y + dir.y, dirX: dir.x, dirY: dir.y };
            prevBullet = null;
        }
        return;
    }

    // Классическое управление – запись в nextDir
    switch (e.key) {
        case 'ArrowUp':    nextDir = {x:0,y:-1}; break;
        case 'ArrowDown':  nextDir = {x:0,y:1}; break;
        case 'ArrowLeft':  nextDir = {x:-1,y:0}; break;
        case 'ArrowRight': nextDir = {x:1,y:0}; break;
    }
});