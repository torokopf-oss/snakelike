function updateBabies() {
    for (let b = babySnakes.length - 1; b >= 0; b--) {
        const baby = babySnakes[b];
        if (!baby) continue;
        babyPrevSnakes[b] = baby.map(s => ({...s}));
        const head = baby[0];
        let fleeTarget = null;
        if (poopSnakeActive && poopSnake.length > 0) {
            const d = Math.abs(poopSnake[0].x - head.x) + Math.abs(poopSnake[0].y - head.y);
            if (d <= 5) fleeTarget = poopSnake[0];
        }
        if (!fleeTarget) {
            for (const v of vultures) {
                const d = Math.abs(v.x - head.x) + Math.abs(v.y - head.y);
                if (d < 6) { fleeTarget = v; break; }
            }
        }
        let desiredDir = { x: 0, y: 0 };
        if (fleeTarget) {
            const dx = head.x - fleeTarget.x, dy = head.y - fleeTarget.y;
            if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
            else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
            else if (dx !== 0) desiredDir.x = dx > 0 ? 1 : -1;
        } else {
            let targetFood = null, minDist = Infinity;
            for (const f of foods) {
                const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y);
                if (d < minDist) { minDist = d; targetFood = f; }
            }
            if (targetFood) {
                const dx = targetFood.x - head.x, dy = targetFood.y - head.y;
                if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
                else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
                else if (dx !== 0) desiredDir.x = dx > 0 ? 1 : -1;
            } else desiredDir = { ...babyDirections[b] };
        }
        if (desiredDir.x === -babyDirections[b].x && desiredDir.y === -babyDirections[b].y)
            desiredDir = babyDirections[b].x !== 0 ? { x: 0, y: Math.random() < 0.5 ? 1 : -1 } : { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
        babyDirections[b] = desiredDir;
        let newHead = { x: head.x + desiredDir.x, y: head.y + desiredDir.y };

        if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
            if (desiredDir.x !== 0) {
                desiredDir = { x: 0, y: 1 };
            } else {
                desiredDir = { x: 1, y: 0 };
            }
            newHead = { x: head.x + desiredDir.x, y: head.y + desiredDir.y };
            if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) continue;
        }

        if (newHead.x < 0 || newHead.x >= maxX() || newHead.y < 0 || newHead.y >= maxY()) {
            babyDirections[b] = { x: -desiredDir.x, y: -desiredDir.y };
            newHead = { x: head.x + babyDirections[b].x, y: head.y + babyDirections[b].y };
        }
        if (poopSnakeActive && poopSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
            continue;
        }
        baby.unshift(newHead);
        const foodIdx = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
        if (foodIdx !== -1) {
            foods.splice(foodIdx, 1);
            score += 2; scoreSpan.textContent = score; applesEaten++;
            pushNewFoodCell();
            if (baby.length < 4) baby.push({ ...baby[baby.length - 1] });
            else baby.pop();
        } else {
            baby.pop();
        }
        if (baby.length === 0) {
            babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
        }
    }
    if (hadBabies && babySnakes.length === 0 && !egg && gameRunning && !awaitingHatch) stopGame('Потомство уничтожено');
}
