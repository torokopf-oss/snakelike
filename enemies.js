// ---------- Говноед ----------
function spawnPoopSnake() {
    if (poopSnakeActive) return;
    poopSnakeNextThreshold += CONFIG.poopThresholdStep;
    const side = spawnSide !== -1 ? spawnSide : Math.floor(Math.random() * (worldDiscovered ? 4 : 3));
    spawnSide = -1;
    let startX, startY, dx, dy;
    if (side === 0) { startX = -1; startY = Math.floor(Math.random() * maxY()); dx = 1; dy = 0; }
    else if (side === 1) { startX = CONFIG.fullWidth; startY = Math.floor(Math.random() * maxY()); dx = -1; dy = 0; }
    else if (side === 2) { startX = Math.floor(Math.random() * maxX()); startY = -1; dx = 0; dy = 1; }
    else { startX = Math.floor(Math.random() * maxX()); startY = maxY(); dx = 0; dy = -1; }
    poopSnake = [];
    for (let i = 0; i < 7; i++) poopSnake.push({ x: startX - dx * i, y: startY - dy * i });
    prevPoopSnake = poopSnake.map(s => ({...s}));
    poopSnakeActive = true;
    poopSnakeDir = { x: dx, y: dy };
    poopSnakeJustSpawned = true;
    warningActive = false;
    const now = performance.now();
    poopSnakeMessageText = 'ОСТОРОЖНО, ГОВНОЕД!';
    poopSnakeMessageUntil = now + 2000;
}

function updatePoopSnake() {
    if (!poopSnakeActive) return;
    prevPoopSnake = poopSnake.map(s => ({...s}));
    const head = poopSnake[0];
    let target = null, desiredDir;
    if (poops.length > 0) {
        let minDist = Infinity;
        for (const p of poops) {
            const d = Math.abs(p.x - head.x) + Math.abs(p.y - head.y);
            if (d < minDist) { minDist = d; target = p; }
        }
    } else {
        if (head.x < 0 || head.x >= maxX() || head.y < 0 || head.y >= maxY())
            desiredDir = { ...poopSnakeDir };
        else {
            const dists = [head.x + 1, maxX() - head.x, head.y + 1, maxY() - head.y];
            const min = Math.min(...dists);
            if (min === dists[0]) target = { x: -1, y: head.y };
            else if (min === dists[1]) target = { x: maxX(), y: head.y };
            else if (min === dists[2]) target = { x: head.x, y: -1 };
            else target = { x: head.x, y: maxY() };
        }
    }
    if (!desiredDir && target) {
        const dx = target.x - head.x, dy = target.y - head.y;
        desiredDir = { x: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0, y: Math.abs(dy) >= Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0 };
        if (!desiredDir.x && !desiredDir.y) desiredDir.x = dx > 0 ? 1 : -1;
    } else if (!desiredDir) desiredDir = { x: 0, y: 0 };

    if (desiredDir.x === -poopSnakeDir.x && desiredDir.y === -poopSnakeDir.y)
        desiredDir = desiredDir.x !== 0 ? { x: 0, y: Math.random() < 0.5 ? 1 : -1 } : { x: Math.random() < 0.5 ? 1 : -1, y: 0 };

    const nextX = head.x + desiredDir.x, nextY = head.y + desiredDir.y;
    const tailIdx = poopSnake.length - 1;
    if (poopSnake.some((s, i) => i !== tailIdx && s.x === nextX && s.y === nextY)) {
        const alts = desiredDir.x !== 0 ? [{x:0,y:1},{x:0,y:-1}] : [{x:1,y:0},{x:-1,y:0}];
        for (const alt of alts) {
            if (!(alt.x === -poopSnakeDir.x && alt.y === -poopSnakeDir.y) &&
                !poopSnake.some((s, i) => i !== tailIdx && s.x === head.x + alt.x && s.y === head.y + alt.y)) {
                desiredDir = alt; break;
            }
        }
    }
    poopSnakeDir = desiredDir;
    const newHead = { x: head.x + desiredDir.x, y: head.y + desiredDir.y };
    poopSnake.unshift(newHead);
    let ate = false;
    if (newHead.x >= 0 && newHead.x < maxX() && newHead.y >= 0 && newHead.y < maxY()) {
        const idx = poops.findIndex(p => p.x === newHead.x && p.y === newHead.y);
        if (idx !== -1) { poops.splice(idx, 1); ate = true; }
        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) { stopGame('Вас сожрал Говноед!'); return; }
        for (let b = babySnakes.length - 1; b >= 0; b--) {
            if (babySnakes[b] && babySnakes[b].some(s => s.x === newHead.x && s.y === newHead.y)) {
                babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
            }
        }
    }
    if (!ate) poopSnake.pop();
    if (poops.length === 0 && poopSnake.every(s => s.x < 0 || s.x >= maxX() || s.y < 0 || s.y >= maxY())) {
        poopSnakeActive = false; poopSnake = []; prevPoopSnake = []; poopSnakeMessageText = ''; warningActive = false; spawnSide = -1;
    }
}

function updateWarning() {
    if (poopSnakeActive || jailMode || awaitingJailStart || jailCountdown || awaitingHatch) {
        warningActive = false; spawnSide = -1; return;
    }
    if (poops.length === poopSnakeNextThreshold - 1 && !warningActive) {
        warningActive = true;
        if (worldDiscovered) {
            spawnSide = Math.floor(Math.random() * 4);
        } else {
            spawnSide = Math.floor(Math.random() * 3);
        }
    } else if (poops.length >= poopSnakeNextThreshold) warningActive = false;
    else if (poops.length < poopSnakeNextThreshold - 1) { warningActive = false; spawnSide = -1; }
}

// ---------- Стервятники ----------
function updateVultures() {
    if (!worldDiscovered) { vultures = []; prevVultures = []; return; }
    for (let i = vultures.length - 1; i >= 0; i--) {
        const v = vultures[i];
        if (v.escaping) {
            const distLeft = v.x + 1, distRight = maxX() - v.x, distTop = v.y + 1, distBottom = maxY() - v.y;
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            if (minDist === distLeft) { v.dirX = -1; v.dirY = 0; }
            else if (minDist === distRight) { v.dirX = 1; v.dirY = 0; }
            else if (minDist === distTop) { v.dirX = 0; v.dirY = -1; }
            else { v.dirX = 0; v.dirY = 1; }
            const newX = v.x + v.dirX, newY = v.y + v.dirY;
            if (newX < 0 || newX >= maxX() || newY < 0 || newY >= maxY()) {
                vultures.splice(i, 1); prevVultures.splice(i, 1);
            } else if (!snake.some(s => s.x === newX && s.y === newY)) { v.x = newX; v.y = newY; }
            continue;
        }
        let target = null;
        for (const baby of babySnakes) { if (baby && baby.length > 0) { target = baby[0]; break; } }
        if (!target && foods.length > 0) {
            let minD = Infinity;
            for (const f of foods) { const d = Math.abs(f.x - v.x) + Math.abs(f.y - v.y); if (d < minD) { minD = d; target = f; } }
        }
        if (target) {
            const dx = target.x - v.x, dy = target.y - v.y;
            if (Math.abs(dx) > Math.abs(dy)) { v.dirX = dx > 0 ? 1 : -1; v.dirY = 0; }
            else if (dy !== 0) { v.dirX = 0; v.dirY = dy > 0 ? 1 : -1; }
            else if (dx !== 0) { v.dirX = dx > 0 ? 1 : -1; v.dirY = 0; }
            const newX = v.x + v.dirX, newY = v.y + v.dirY;
            if (snake.some(s => s.x === newX && s.y === newY)) {
                if (v.dirX !== 0) { v.dirY = Math.random() < 0.5 ? 1 : -1; v.dirX = 0; }
                else { v.dirX = Math.random() < 0.5 ? 1 : -1; v.dirY = 0; }
            }
        }
        const newX = v.x + v.dirX, newY = v.y + v.dirY;
        if (newX < 0 || newX >= maxX() || newY < 0 || newY >= maxY()) { vultures.splice(i, 1); prevVultures.splice(i, 1); continue; }
        if (snake.some(s => s.x === newX && s.y === newY)) continue;
        let bitten = false;
        for (let b = babySnakes.length - 1; b >= 0; b--) {
            if (babySnakes[b] && babySnakes[b].some(s => s.x === newX && s.y === newY)) {
                babySnakes[b].pop();
                if (babySnakes[b].length === 0) { babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1); }
                bitten = true; v.escaping = true; v.x = newX; v.y = newY;
                break;
            }
        }
        if (bitten) continue;
        const foodIdx = foods.findIndex(f => f.x === newX && f.y === newY);
        if (foodIdx !== -1) {
            foods.splice(foodIdx, 1);
            pushNewFoodCell();
            v.x = newX; v.y = newY;
            continue;
        }
        v.x = newX; v.y = newY;
    }
}

function spawnVultures(count) {
    for (let i = 0; i < count; i++) {
        const side = Math.floor(Math.random() * 4);
        let x, y, dx, dy;
        if (side === 0) { x = -1; y = Math.floor(Math.random() * maxY()); dx = 1; dy = 0; }
        else if (side === 1) { x = CONFIG.fullWidth; y = Math.floor(Math.random() * maxY()); dx = -1; dy = 0; }
        else if (side === 2) { x = Math.floor(Math.random() * CONFIG.fullWidth); y = -1; dx = 0; dy = 1; }
        else { x = Math.floor(Math.random() * CONFIG.fullWidth); y = maxY(); dx = 0; dy = -1; }
        vultures.push({ x, y, dirX: dx, dirY: dy, escaping: false });
        prevVultures.push({ x, y, dirX: dx, dirY: dy, escaping: false });
    }
}

function activateSanitation() {
    if (!worldDiscovered || vultures.length === 0) return;
    vultures = [];
    prevVultures = [];
    flashStart = performance.now();
    awaitingJailStart = true;
    awaitingJailReason = 'Массовое убийство';
}
