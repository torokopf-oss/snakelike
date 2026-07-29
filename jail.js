function updateJail() {
    if (!jailMode) return;
    if (!jailSnake.length) {
        jailSnake = [{x:4,y:1},{x:3,y:1},{x:2,y:1},{x:1,y:1}];
        jailPrevSnake = jailSnake.map(s => ({...s}));
        jailDir = {x:1,y:0};
        jailStartTime = performance.now();
    }
    jailPrevSnake = jailSnake.map(s => ({...s}));

    // Извлекаем направление из тюремной очереди
    if (jailMoveQueue.length > 0) {
        const nextDir = jailMoveQueue.shift();
        // Дополнительная проверка разворота (на случай, если очередь устарела)
        if (!(nextDir.x === -jailDir.x && nextDir.y === -jailDir.y)) {
            jailDir = nextDir;
        }
    }

    const head = jailSnake[0], newHead = { x: head.x + jailDir.x, y: head.y + jailDir.y };
    if (newHead.x < 0 || newHead.x >= CONFIG.jailWidth || newHead.y < 0 || newHead.y >= CONFIG.jailHeight) {
        stopGame('вы умерли в тюрьме');
        return;
    }
    jailSnake.unshift(newHead); jailSnake.pop();
    if (performance.now() - jailStartTime >= CONFIG.jailDuration) {
        jailMode = false;
        lastAppleTime = performance.now();
        snake = jailSnake.map(s => ({ x: s.x + 7, y: s.y + 8 }));
        for (const seg of snake) {
            const fi = foods.findIndex(f => f.x === seg.x && f.y === seg.y);
            if (fi !== -1) foods.splice(fi, 1);
            const pi = poops.findIndex(p => p.x === seg.x && p.y === seg.y);
            if (pi !== -1) poops.splice(pi, 1);
            if (pill && pill.x === seg.x && pill.y === seg.y) pill = null;
        }
        while (foods.length < (worldDiscovered ? 2 : 1)) pushNewFoodCell();
        dir = jailDir;
        prevSnake = snake.map(s => ({...s}));
        jailSnake = [];
        jailMoveQueue = []; // очищаем тюремную очередь
        moveQueue = [];     // на всякий случай и основную, чтобы не было конфликтов
    }
}

function updateCountdown() {
    if (!jailCountdown) return;
    const elapsed = performance.now() - jailCountdownStart;
    const newVal = CONFIG.countdownSeconds - Math.floor(elapsed / 1000);
    if (newVal <= 0) {
        jailCountdown = false;
        jailMode = true;
        jailSnake = [];
        jailMoveQueue = []; // начинаем с чистой очередью
    } else {
        jailCountdownValue = newVal;
    }
}
