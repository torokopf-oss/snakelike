window.addEventListener('keydown', e => {
    // Блокируем стандартное поведение для всех игровых клавиш (по физическому коду)
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyZ','KeyX','KeyS','KeyP','BracketRight'].includes(e.code)) {
        e.preventDefault();
    }

    // Пауза
    if (e.code === 'KeyP') {
        if (gameRunning && !gameOverFlag && !awaitingHatch && !jailMode && !jailCountdown) {
            paused = !paused;
            if (!paused) lastUpdateTime = performance.now();
        }
        return;
    }

    // Пробел (старт / тюрьма / рестарт)
    if (e.code === 'Space') {
        if (awaitingJailStart) {
            awaitingJailStart = false;
            jailCountdown = true;
            jailCountdownValue = CONFIG.countdownSeconds;
            jailCountdownStart = performance.now();
            return;
        }
        if (gameOverFlag) { resetGame(); return; }
        if (!gameRunning && !awaitingHatch) { resetGame(); return; }
        return;
    }

    // Яйцо / вылупление
   if (e.code === 'KeyX') {
    if (awaitingHatch) { hatchPlayerFromEgg(); return; }
    if (egg && gameRunning && worldDiscovered && !awaitingJailStart && !jailMode) { spawnBabyFromEgg(); return; }
    
    // Новое условие: длина >= 25, кулдаун по времени (44 сек), и яблочный счётчик
    const canLay = gameRunning && snake.length >= 25 && !egg && eggCooldown <= 0 
                   && (performance.now() - lastEggTime >= CONFIG.eggCooldownMs)
                   && !awaitingJailStart && !jailMode 
                   && (!firstEggLaid || eggAppleCounter >= 10);
    if (canLay) {
        egg = { x: snake[snake.length-1].x, y: snake[snake.length-1].y };
        lastEggTime = performance.now();
        firstEggLaid = true;
        eggAppleCounter = 0;
    }
    return;
}

    // Чит-режим
    if (e.code === 'BracketRight') { activateCheats(); return; }

    // Санация
    if (e.code === 'KeyS' && gameRunning && worldDiscovered && !awaitingJailStart && !jailMode) {
        activateSanitation();
        return;
    }

    // Остальные клавиши работают только во время активной игры
    if (!gameRunning || awaitingHatch || paused) return;

    // Управление в тюрьме
    if (jailMode) {
        if (e.code === 'ArrowUp' && jailDir.y !== 1) jailNextDir = {x:0,y:-1};
        else if (e.code === 'ArrowDown' && jailDir.y !== -1) jailNextDir = {x:0,y:1};
        else if (e.code === 'ArrowLeft' && jailDir.x !== 1) jailNextDir = {x:-1,y:0};
        else if (e.code === 'ArrowRight' && jailDir.x !== -1) jailNextDir = {x:1,y:0};
        return;
    }

    // Выстрел (лазер или пуля)
    if (e.code === 'KeyZ') {
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

    // Направления движения
    switch (e.code) {
        case 'ArrowUp':    nextDir = {x:0,y:-1}; break;
        case 'ArrowDown':  nextDir = {x:0,y:1}; break;
        case 'ArrowLeft':  nextDir = {x:-1,y:0}; break;
        case 'ArrowRight': nextDir = {x:1,y:0}; break;
    }
});
