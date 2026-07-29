window.addEventListener('keydown', e => {
    // Блокируем стандартное поведение для всех игровых клавиш
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyZ','KeyX','KeyS','KeyP','BracketRight','KeyH'].includes(e.code)) {
        e.preventDefault();
    }

    // Обработка модальных окон (должна быть первой)
    if (startModal.classList.contains('active')) {
        if (e.code === 'Space') {
            startGameFromModal();
        }
        return;
    }
    if (phase2Modal.classList.contains('active')) {
        if (e.code === 'Space') {
            continueFromPhase2();
        }
        return;
    }
    if (cannibalModal.classList.contains('active')) {
    if (e.code === 'Space') {
        cannibalModal.classList.remove('active');
    }
    return;
}
    if (helpModal.classList.contains('active')) {
        if (e.code === 'Space' || e.code === 'KeyH') {
            helpModal.classList.remove('active');
        }
        return;
    }

    // Справка (вне модального окна)
    if (e.code === 'KeyH') {
        toggleHelp();
        return;
    }

    // Пауза
    if (e.code === 'KeyP') {
        if (gameRunning && !gameOverFlag && !awaitingHatch && !jailMode && !jailCountdown) {
            paused = !paused;
            if (paused) {
                pauseStartTime = performance.now();
            } else {
                lastAppleTime += performance.now() - pauseStartTime;
                lastUpdateTime = performance.now();
            }
        }
        return;
    }

    // Пробел (обычная игра)
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
        const canLay = gameRunning && snake.length >= 25 && !egg
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

    // Чит-режим
    if (e.code === 'BracketRight') { activateCheats(); return; }

    // Санация
    if (e.code === 'KeyS' && gameRunning && worldDiscovered && !awaitingJailStart && !jailMode) {
        if (sanitationCharges > 0) {
            activateSanitation();
            sanitationCharges--;
        }
        return;
    }

    // Остальное только при активной игре
    if (!gameRunning || awaitingHatch || paused) return;

    // Управление в тюрьме
    if (jailMode) {
        const newDir = getDirectionFromCode(e.code);
        if (!newDir) return;
        // Проверяем последнее направление в очереди (или jailDir, если очередь пуста)
        const lastQueued = jailMoveQueue.length > 0 ? jailMoveQueue[jailMoveQueue.length - 1] : jailDir;
        // Запрет разворота и дублирования
        if (!isOpposite(newDir, lastQueued) && !isSameDirection(newDir, lastQueued) && jailMoveQueue.length < 2) {
            jailMoveQueue.push(newDir);
        }
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

    // Основное движение — добавляем в очередь
    const newDir = getDirectionFromCode(e.code);
    if (!newDir) return;
    const lastQueued = moveQueue.length > 0 ? moveQueue[moveQueue.length - 1] : dir;
    // Проверки: не противоположное, не такое же, не превышаем лимит очереди (2)
    if (!isOpposite(newDir, lastQueued) && !isSameDirection(newDir, lastQueued) && moveQueue.length < 2) {
        moveQueue.push(newDir);
    }
});

// Вспомогательные функции направлений
function getDirectionFromCode(code) {
    switch (code) {
        case 'ArrowUp':    return { x: 0, y: -1 };
        case 'ArrowDown':  return { x: 0, y: 1 };
        case 'ArrowLeft':  return { x: -1, y: 0 };
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
