// ---------- Игрок ----------
function updatePlayer() {
    if (awaitingHatch) return;
    prevSnake = snake.map(s => ({...s}));
    prevFoods = foods.map(f => ({...f}));

    if ((nextDir.x || nextDir.y) && !(nextDir.x === -dir.x && nextDir.y === -dir.y)) dir = nextDir;
    if (!dir.x && !dir.y) return;

    const head = snake[0];
    let newHead = { x: head.x + dir.x, y: head.y + dir.y };

    // Пробитие стены (длина 30), автоматическое вылупление детёныша
    if (!worldDiscovered && snake.length >= 30 && newHead.x === CONFIG.viewWidth && newHead.y >= 0 && newHead.y < CONFIG.fullHeight) {
        worldDiscovered = true;
        canvas.width = CONFIG.fullWidth * CONFIG.gridSize;
        const newLen = Math.floor(snake.length / 2);
        snake = snake.slice(0, newLen);
        prevSnake = snake.map(s => ({...s}));
        if (egg) spawnBabyFromEgg();
        generateFoods();
        eggCooldown = 25;
        bullet = null;
    }

    if (newHead.x < 0 || newHead.x >= maxX() || newHead.y < 0 || newHead.y >= CONFIG.fullHeight) { stopGame(); return; }

    if (poopSnakeActive && poopSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) { stopGame('Вас сожрал Говноед!'); return; }

    const willEatFood = foods.some(f => f.x === newHead.x && f.y === newHead.y);
    const willEatPoop = poops.some(p => p.x === newHead.x && p.y === newHead.y);
    const willEatPill = pill && pill.x === newHead.x && pill.y === newHead.y;
    const bodyToCheck = (willEatFood || willEatPoop || willEatPill) ? snake : snake.slice(0, -1);
    if (bodyToCheck.some(seg => seg.x === newHead.x && seg.y === newHead.y)) { stopGame(); return; }

    let ateApple = false;
    for (let i = foods.length - 1; i >= 0; i--) {
        if (newHead.x === foods[i].x && newHead.y === foods[i].y) {
            foods.splice(i, 1);
            ateApple = true;
            applesEaten++;
            score += 10 + Math.floor(snake.length / 2);
            scoreSpan.textContent = score;
            snake[snake.length - 1].glowUntil = performance.now() + 500;
            break;
        }
    }
    if (ateApple) {
        pushNewFoodCell();
        if (applesEaten % 2 === 0) { spawnPoop(); updateWarning(); }
        foods.forEach(f => moveFoodLazy(f));
    }

    if (willEatPoop) {
        if (snake.length <= 2) { stopGame('Змейка отравилась!'); return; }
        poops.splice(poops.findIndex(p => p.x === newHead.x && p.y === newHead.y), 1);
        snake.unshift(newHead);
        snake.pop(); snake.pop();
        playerPoopsEaten++;
        poopEatenSpan.textContent = playerPoopsEaten + '/5';
        if (!poisonActive) { poisonActive = true; lastPoisonCheck = performance.now(); spawnPill(); }
        if (playerPoopsEaten >= 5) { stopGame('ВЫ ГОВНОЕД'); return; }
    } else if (willEatPill) {
        snake.unshift(newHead); snake.pop();
        pill = null; poisonActive = false;
    } else if (ateApple) {
        const oldTail = snake[snake.length - 1];
        snake.unshift(newHead); prevSnake.push({ ...oldTail });
    } else {
        snake.unshift(newHead); snake.pop();
        foods.forEach(f => moveFoodLazy(f));
    }
    if (eggCooldown > 0) eggCooldown--;
}

function fireLaser() {
    let x = snake[0].x + dir.x;
    let y = snake[0].y + dir.y;
    let hit = false;
    while (x >= 0 && x < maxX() && y >= 0 && y < CONFIG.fullHeight) {
        const foodIdx = foods.findIndex(f => f.x === x && f.y === y);
        if (foodIdx !== -1) {
            foods.splice(foodIdx, 1);
            pushNewFoodCell();
            hit = true;
            break;
        }
        if (poopSnakeActive && poopSnake.some(seg => seg.x === x && seg.y === y)) {
            poopSnakeActive = false; poopSnake = []; prevPoopSnake = []; poopSnakeMessageText = '';
            awaitingJailStart = true;
            awaitingJailReason = 'Вы — убийца!';
            hit = true;
            break;
        }
        const vultIdx = vultures.findIndex(v => v.x === x && v.y === y);
        if (vultIdx !== -1) {
            vultures.splice(vultIdx, 1);
            prevVultures.splice(vultIdx, 1);
            hit = true;
            break;
        }
        x += dir.x;
        y += dir.y;
    }
    laserEndX = hit ? x : x - dir.x;
    laserEndY = hit ? y : y - dir.y;
    laserStart = performance.now();
}

function hatchPlayerFromEgg() {
    if (!egg) return;
    score = Math.floor(score * 2 / 3);
    scoreSpan.textContent = score;
    snake = [{ ...egg }]; prevSnake = [{ ...egg }];
    dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
    egg = null; awaitingHatch = false; gameRunning = true; gameOverFlag = false; gameOverDiv.textContent = '';
}

function spawnBabyFromEgg() {
    if (!egg) return;
    const baby = [
        { x: egg.x, y: egg.y }, { x: egg.x - 1, y: egg.y }, { x: egg.x - 2, y: egg.y }
    ];
    babySnakes.push(baby);
    babyPrevSnakes.push(baby.map(s => ({...s})));
    babyDirections.push({ x: 1, y: 0 });
    egg = null;
    hadBabies = true;
}

function activateCheats() {
    if (!gameRunning) return;
    if (!worldDiscovered) {
        const head = { x: 19, y: 10 };
        snake = [head];
        for (let i = 1; i < 41; i++) snake.push({ x: head.x - i, y: head.y });
        prevSnake = snake.map(s => ({...s}));
        dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
        egg = {
            x: Math.floor(Math.random() * CONFIG.viewWidth),
            y: Math.floor(Math.random() * CONFIG.fullHeight)
        };
        eggCooldown = 0; firstEggLaid = true; eggAppleCounter = 0;
        score = 1000; scoreSpan.textContent = score;
    } else {
        egg = {
            x: Math.floor(Math.random() * CONFIG.fullWidth),
            y: Math.floor(Math.random() * CONFIG.fullHeight)
        };
        eggCooldown = 0; firstEggLaid = true; eggAppleCounter = 0;
        score += 1000; scoreSpan.textContent = score;
    }
}
