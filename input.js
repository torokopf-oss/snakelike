window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyZ','KeyX','KeyS','KeyP','BracketRight','KeyH','KeyA','KeyC'].includes(e.code)) {
        e.preventDefault();
    }

    if (startModal.classList.contains('active')) {
        if (e.code === 'Space') startGameFromModal();
        return;
    }
    if (phase2Modal.classList.contains('active')) {
        if (e.code === 'Space') continueFromPhase2();
        return;
    }
    if (cannibalModal.classList.contains('active')) {
        if (e.code === 'Space') cannibalModal.classList.remove('active');
        return;
    }
    if (helpModal.classList.contains('active')) {
        if (e.code === 'Space' || e.code === 'KeyH') helpModal.classList.remove('active');
        return;
    }
    if (abilitiesModal.classList.contains('active')) {
        if (e.code === 'Space' || e.code === 'KeyH') abilitiesModal.classList.remove('active');
        return;
    }

    if (e.code === 'KeyH') { toggleHelp(); return; }

    if (e.code === 'KeyP') {
        if (gameRunning && !gameOverFlag && !awaitingHatch && !jailMode && !jailCountdown) {
            paused = !paused;
            if (paused) {
                pauseStartTime = performance.now();
            } else {
                const pauseDuration = performance.now() - pauseStartTime;
                lastAppleTime += pauseDuration;
                lastTimeUpdate += pauseDuration;
                lastUpdateTime = performance.now();
            }
        }
        return;
    }

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

    if (e.code === 'KeyX') {
        if (awaitingHatch) { hatchPlayerFromEgg(); return; }
        if (egg && gameRunning && worldDiscovered && !awaitingJailStart && !jailMode) { spawnBabyFromEgg(); return; }
        const canLay = gameRunning && snake.length >= 18 && !egg
                       && (performance.now() - lastEggTime >= CONFIG.eggCooldownMs)
                       && !awaitingJailStart && !jailMode;
        if (canLay) {
            egg = { x: snake[snake.length-1].x, y: snake[snake.length-1].y };
            lastEggTime = performance.now();
            firstEggLaid = true;
            eggAppleCounter = 0;
        }
        return;
    }

    if (e.code === 'BracketRight') { activateCheats(); return; }

    // Клавиша C больше не используется для санации

    if (!gameRunning || awaitingHatch || paused) return;

    if (e.code === 'KeyA') {
        if (window.activateAbility) window.activateAbility(0);
        return;
    }
    if (e.code === 'KeyS') {
        if (window.activateAbility) window.activateAbility(1);
        return;
    }

    if (jailMode) {
        const newDir = getDirectionFromCode(e.code);
        if (!newDir) return;
        const lastQueued = jailMoveQueue.length > 0 ? jailMoveQueue[jailMoveQueue.length - 1] : jailDir;
        if (!isOpposite(newDir, lastQueued) && !isSameDirection(newDir, lastQueued) && jailMoveQueue.length < 2) {
            jailMoveQueue.push(newDir);
        }
        return;
    }

    // KeyZ больше не обрабатывается

    const newDir = getDirectionFromCode(e.code);
    if (!newDir) return;
    const lastQueued = moveQueue.length > 0 ? moveQueue[moveQueue.length - 1] : dir;
    if (!isOpposite(newDir, lastQueued) && !isSameDirection(newDir, lastQueued) && moveQueue.length < 2) {
        moveQueue.push(newDir);
    }
});

function getDirectionFromCode(code) {
    switch (code) {
        case 'ArrowUp': return { x: 0, y: -1 };
        case 'ArrowDown': return { x: 0, y: 1 };
        case 'ArrowLeft': return { x: -1, y: 0 };
        case 'ArrowRight': return { x: 1, y: 0 };
        default: return null;
    }
}

function isOpposite(dir1, dir2) {
    return dir1.x === -dir2.x && dir1.y === -dir2.y;
}

function isSameDirection(dir1, dir2) {
    return dir1.x === dir2.x && dir1.y === dir2.y;
}
