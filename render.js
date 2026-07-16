const maxX = () => worldDiscovered ? CONFIG.fullWidth : CONFIG.viewWidth;

function isCellFree(x, y, ignorePill = false, ignoreVultures = false) {
    if (x < 0 || x >= maxX() || y < 0 || y >= CONFIG.fullHeight) return false;
    if (snake.some(s => s.x === x && s.y === y)) return false;
    if (foods.some(f => f.x === x && f.y === y)) return false;
    if (poops.some(p => p.x === x && p.y === y)) return false;
    if (poopSnakeActive && poopSnake.some(s => s.x === x && s.y === y)) return false;
    if (!ignorePill && pill && pill.x === x && pill.y === y) return false;
    if (egg && egg.x === x && egg.y === y) return false;
    for (const baby of babySnakes) {
        if (baby && baby.some(s => s.x === x && s.y === y)) return false;
    }
    if (!ignoreVultures && vultures.some(v => v.x === x && v.y === y)) return false;
    return true;
}

function randomFreeCell(ignorePill = false) {
    let cell, attempts = 0;
    do {
        cell = {
            x: Math.floor(Math.random() * maxX()),
            y: Math.floor(Math.random() * CONFIG.fullHeight)
        };
        attempts++;
    } while (!isCellFree(cell.x, cell.y, ignorePill) && attempts < 200);
    return attempts < 200 ? cell : null;
}

function pushNewFoodCell() {
    const cell = randomFreeCell();
    if (cell) foods.push(cell);
    prevFoods = foods.map(f => ({...f}));
}

function drawSnake(arr, prevArr, headColor, bodyColor, ox, oy, tileSize, t, glow = false) {
    if (!arr) return;
    for (let i = 0; i < arr.length; i++) {
        const seg = arr[i];
        const prev = (i < prevArr.length) ? prevArr[i] : seg;
        const px = ox + (prev.x + (seg.x - prev.x) * t) * tileSize;
        const py = oy + (prev.y + (seg.y - prev.y) * t) * tileSize;
        ctx.fillStyle = i === 0 ? headColor : bodyColor;
        if (glow) {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#2ecc71';
        }
        ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        if (glow) ctx.restore();
    }
}

function generateFoods() {
    foods = [];
    for (let i = 0; i < (worldDiscovered ? 2 : 1); i++) {
        const cell = randomFreeCell();
        if (cell) foods.push(cell);
    }
    prevFoods = foods.map(f => ({...f}));
}

function spawnPoop() {
    const tail = snake[snake.length - 1];
    const d = dir.x || dir.y ? dir : { x: 1, y: 0 };
    const behind = { x: tail.x - d.x, y: tail.y - d.y };
    if (isCellFree(behind.x, behind.y)) { poops.push(behind); return; }
    for (const nb of [{x:tail.x+1,y:tail.y},{x:tail.x-1,y:tail.y},{x:tail.x,y:tail.y+1},{x:tail.x,y:tail.y-1}]) {
        if (isCellFree(nb.x, nb.y)) { poops.push(nb); return; }
    }
    const cell = randomFreeCell();
    if (cell) poops.push(cell);
}

function spawnPill() {
    const cell = randomFreeCell(true);
    if (cell) pill = cell; else pill = null;
}

function moveFoodLazy(food) {
    if (!gameRunning || jailMode || awaitingJailStart || jailCountdown || awaitingHatch || paused) return;
    if (Math.random() < 0.6) return;
    const candidates = [
        { x: food.x, y: food.y - 1 }, { x: food.x, y: food.y + 1 },
        { x: food.x - 1, y: food.y }, { x: food.x + 1, y: food.y }
    ].filter(pos => isCellFree(pos.x, pos.y));
    if (candidates.length) Object.assign(food, candidates[Math.floor(Math.random() * candidates.length)]);
}

// Отрисовка всего поля
function drawGame(t, now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewCells = worldDiscovered ? CONFIG.fullWidth : CONFIG.viewWidth;
    const gs = CONFIG.gridSize;

    ctx.strokeStyle = '#0f3460'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= CONFIG.fullHeight; i++) {
        ctx.beginPath(); ctx.moveTo(0, i*gs); ctx.lineTo(viewCells*gs, i*gs); ctx.stroke();
    }
    for (let i = 0; i <= viewCells; i++) {
        ctx.beginPath(); ctx.moveTo(i*gs, 0); ctx.lineTo(i*gs, CONFIG.fullHeight*gs); ctx.stroke();
    }

    // Вспышка санации
    if (flashStart && now - flashStart < FLASH_DURATION) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
ctx.fillStyle = 'white';
ctx.font = '14px "Segoe UI"';
ctx.textAlign = 'right';
ctx.fillText(`Санация: ${sanitationCharges}`, canvas.width - 10, canvas.height - 10);
    
    // Стена
    if (!worldDiscovered && snake.length >= 30) {
        const wallX = CONFIG.viewWidth * gs;
        ctx.save();
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#2ecc71';
        ctx.beginPath(); ctx.moveTo(wallX, 0); ctx.lineTo(wallX, CONFIG.fullHeight * gs); ctx.stroke();
        ctx.restore();
    }

    // Предупреждение о Говноеде
    if (warningActive && spawnSide !== -1) {
        const pulse = Math.sin(warningPulse)*0.4+0.6, gw = 20;
        ctx.save();
        ctx.fillStyle = `rgba(255,80,0,${pulse*0.8})`; ctx.shadowBlur = 15; ctx.shadowColor = '#ff5000';
        if (spawnSide === 0) ctx.fillRect(0, 0, gw, CONFIG.fullHeight*gs);
        else if (spawnSide === 1) ctx.fillRect(viewCells*gs - gw, 0, gw, CONFIG.fullHeight*gs);
        else if (spawnSide === 2) ctx.fillRect(0, 0, viewCells*gs, gw);
        else if (spawnSide === 3) ctx.fillRect(0, CONFIG.fullHeight*gs - gw, viewCells*gs, gw);
        ctx.restore();
    }

    const canLayEgg = gameRunning && snake.length >= 25 && !egg
                  && (performance.now() - lastEggTime >= CONFIG.eggCooldownMs)
                  && !awaitingJailStart && !jailMode;
    const headCol = poisonActive ? '#2ecc71' : (canLayEgg ? '#f1c40f' : '#e94560');
    const bodyCol = poisonActive ? '#2ecc71' : (canLayEgg ? '#f39c12' : '#533483');
    const glowActive = poisonActive || canLayEgg;

    if (snake.length > 0) drawSnake(snake, prevSnake, headCol, bodyCol, 0, 0, gs, t, glowActive);
    for (let b = 0; b < babySnakes.length; b++) drawSnake(babySnakes[b], babyPrevSnakes[b], '#f1c40f', '#f39c12', 0, 0, gs, t);

    if (egg) {
        const ex = egg.x*gs, ey = egg.y*gs;
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath(); ctx.ellipse(ex+gs/2, ey+gs/2, gs/2-2, gs/2-4, 0, 0, Math.PI*2); ctx.fill();
    }
    if (poopSnakeActive) drawSnake(poopSnake, prevPoopSnake, '#A0522D', '#6B3A2A', 0, 0, gs, t);

    // Лазерный луч
    if (laserStart && now - laserStart < LASER_DURATION) {
        const head = snake[0];
        const startX = head.x * gs + gs/2;
        const startY = head.y * gs + gs/2;
        const endX = laserEndX * gs + gs/2;
        const endY = laserEndY * gs + gs/2;
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
    }

    if (bullet) {
        const bx = prevBullet ? (prevBullet.x + (bullet.x - prevBullet.x)*t)*gs + gs/2 : bullet.x*gs + gs/2;
        const by = prevBullet ? (prevBullet.y + (bullet.y - prevBullet.y)*t)*gs + gs/2 : bullet.y*gs + gs/2;
        ctx.fillStyle = 'yellow'; ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI*2); ctx.fill();
    }

    ctx.fillStyle = '#8B4513';
    for (const p of poops) {
        const px = p.x*gs, py = p.y*gs;
        ctx.beginPath(); ctx.ellipse(px+gs/2, py+gs/2, gs/2-2, gs/3-1, 0, 0, Math.PI*2); ctx.fill();
    }

    ctx.fillStyle = '#f9a826';
    for (let i = 0; i < foods.length; i++) {
        const f = foods[i], prev = prevFoods[i] || f;
        const px = (prev.x + (f.x - prev.x)*t)*gs, py = (prev.y + (f.y - prev.y)*t)*gs;
        ctx.beginPath(); ctx.arc(px+gs/2, py+gs/2, gs/2-2, 0, Math.PI*2); ctx.fill();
    }

    if (pill) {
        const px = pill.x*gs, py = pill.y*gs, cx = px+gs/2, cy = py+gs/2, s = 5, l = gs/2-2;
        ctx.fillStyle = '#fff'; ctx.fillRect(px+1, py+1, gs-2, gs-2);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(cx-s/2, cy-l, s, l*2); ctx.fillRect(cx-l, cy-s/2, l*2, s);
    }

    ctx.fillStyle = '#e74c3c';
    for (let i = 0; i < vultures.length; i++) {
        const v = vultures[i], prev = prevVultures[i] || v;
        const px = (prev.x + (v.x - prev.x)*t)*gs, py = (prev.y + (v.y - prev.y)*t)*gs;
        ctx.fillRect(px+2, py+2, gs-4, gs-4);
    }

    for (const p of sickParticles) {
        const alpha = Math.min(1, p.life/300);
        ctx.fillStyle = `rgba(46,204,113,${alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2+(1-alpha)*3, 0, Math.PI*2); ctx.fill();
    }

    // Тюрьма / Отсчёт
    if (jailMode || jailCountdown) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const jw = CONFIG.jailWidth*gs, jh = CONFIG.jailHeight*gs;
        const jx = (canvas.width - jw)/2, jy = (canvas.height - jh)/2;
        ctx.save();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(jx, jy, jw, jh);
        if (jailMode) {
            const jscale = Math.min(jw/(CONFIG.jailWidth*gs), jh/(CONFIG.jailHeight*gs));
            ctx.save(); ctx.translate(jx, jy); ctx.scale(jscale, jscale);
            drawSnake(jailSnake, jailPrevSnake, '#e94560', '#533483', 0, 0, gs, t);
            ctx.restore();
            if (jailStartTime) {
                const rem = Math.max(0, CONFIG.jailDuration - (now - jailStartTime))/1000;
                ctx.fillStyle = 'white'; ctx.font = '14px "Segoe UI"'; ctx.textAlign = 'center';
                ctx.fillText(`Осталось: ${rem.toFixed(1)}`, canvas.width/2, jy-8);
            }
        }
        if (jailCountdown) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(jx, jy, jw, jh);
            ctx.fillStyle = 'white'; ctx.font = '40px "Segoe UI"'; ctx.textAlign = 'center';
            ctx.fillText(jailCountdownValue, canvas.width/2, canvas.height/2);
        }
        ctx.restore();
    }
// Заряды санации
ctx.fillStyle = 'white';
ctx.font = '14px "Segoe UI"';
ctx.textAlign = 'right';
ctx.fillText(`Санация: ${sanitationCharges}`, canvas.width - 10, 20);
    // Сообщения
    if (paused && gameRunning) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = 'bold 24px "Segoe UI"'; ctx.textAlign = 'center';
        ctx.fillText('ПАУЗА', canvas.width/2, canvas.height/2);
    }
    if (!gameRunning && !gameOverFlag && !awaitingJailStart && !awaitingHatch && !jailCountdown && !jailMode) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = '14px "Segoe UI"'; ctx.textAlign = 'center';
        ctx.fillText('Нажми пробел для старта', canvas.width/2, canvas.height/2);
    }
    if (gameOverFlag) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = '18px "Segoe UI"'; ctx.textAlign = 'center';
        ctx.fillText(gameOverDiv.textContent, canvas.width/2, canvas.height/2);
    }
    if (poopSnakeMessageText && now < poopSnakeMessageUntil) {
        const alpha = Math.min(1, (poopSnakeMessageUntil-now)/500);
        ctx.fillStyle = `rgba(255,100,0,${alpha})`; ctx.font = '16px "Segoe UI"'; ctx.textAlign = 'center';
        ctx.fillText(poopSnakeMessageText, canvas.width/2, canvas.height/2-30);
    }
    if (awaitingJailStart && awaitingJailReason) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.textAlign = 'center';
        ctx.font = '14px "Segoe UI"';
        ctx.fillText(awaitingJailReason, canvas.width/2, canvas.height/2-15);
        ctx.font = '12px "Segoe UI"';
        ctx.fillText('нажмите пробел, чтобы', canvas.width/2, canvas.height/2+5);
        ctx.fillText('отправиться в тюрьму', canvas.width/2, canvas.height/2+20);
    }
    if (awaitingHatch) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = '14px "Segoe UI"'; ctx.textAlign = 'center';
        ctx.fillText('Нажмите X, чтобы вылупиться', canvas.width/2, canvas.height/2);
    }
}
