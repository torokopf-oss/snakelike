function updateBabies() {
    for (let b = babySnakes.length - 1; b >= 0; b--) {
        const baby = babySnakes[b];
        if (!baby) continue;
        babyPrevSnakes[b] = baby.map(s => ({...s}));
        const head = baby[0];
        let desiredDir = { x: 0, y: 0 };

        // ---------- Приоритет 0: избегание Говноеда (любого сегмента) ----------
        let poopFleeTarget = null;
        if (poopSnakeActive && poopSnake.length > 0) {
            let minDist = 5;
            for (const seg of poopSnake) {
                const d = Math.abs(seg.x - head.x) + Math.abs(seg.y - head.y);
                if (d < minDist) {
                    minDist = d;
                    poopFleeTarget = seg;
                }
            }
        }
        if (poopFleeTarget) {
            const dx = head.x - poopFleeTarget.x;
            const dy = head.y - poopFleeTarget.y;
            if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
            else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
            else desiredDir.x = dx > 0 ? 1 : -1;
        } else {
            // ---------- Основная логика в зависимости от фазы ----------
            if (worldDiscoveredDown) {
                // Третья фаза
                if (babyFleeing[b] && babyFleeing[b].active) {
                    const target = babyFleeing[b];
                    const dx = target.tx - head.x;
                    const dy = target.ty - head.y;
                    if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
                    else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
                    else desiredDir.x = dx > 0 ? 1 : -1;
                } else {
                    let biteTarget = null;
                    if (snake.length > 1) {
                        let minDist = Infinity;
                        for (let i = 1; i < snake.length; i++) {
                            const seg = snake[i];
                            const d = Math.abs(seg.x - head.x) + Math.abs(seg.y - head.y);
                            if (d < minDist) {
                                minDist = d;
                                biteTarget = seg;
                            }
                        }
                    }
                    if (biteTarget) {
                        const dx = biteTarget.x - head.x;
                        const dy = biteTarget.y - head.y;
                        if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
                        else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
                        else desiredDir.x = dx > 0 ? 1 : -1;
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
                            else desiredDir.x = dx > 0 ? 1 : -1;
                        } else {
                            desiredDir = { ...babyDirections[b] };
                        }
                    }
                }
            } else {
                // Первая/вторая фаза
                let fleeTarget = null;
                for (const v of vultures) {
                    const d = Math.abs(v.x - head.x) + Math.abs(v.y - head.y);
                    if (d < 6) { fleeTarget = v; break; }
                }
                if (fleeTarget) {
                    const dx = head.x - fleeTarget.x, dy = head.y - fleeTarget.y;
                    if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
                    else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
                    else desiredDir.x = dx > 0 ? 1 : -1;
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
                        else desiredDir.x = dx > 0 ? 1 : -1;
                    } else desiredDir = { ...babyDirections[b] };
                }
            }
        }

        // ---------- Запрет разворота ----------
        if (desiredDir.x === -babyDirections[b].x && desiredDir.y === -babyDirections[b].y) {
            desiredDir = babyDirections[b].x !== 0
                ? { x: 0, y: Math.random() < 0.5 ? 1 : -1 }
                : { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
        }
        babyDirections[b] = desiredDir;
        let newHead = { x: head.x + desiredDir.x, y: head.y + desiredDir.y };

        // ---------- Обработка выхода за границы ----------
        const outOfBounds = newHead.x < 0 || newHead.x >= maxX() || newHead.y < 0 || newHead.y >= maxY();
        if (outOfBounds) {
            if (babyFleeing[b] && babyFleeing[b].active) {
                babyFleeing[b] = { active: false };
            }
            babyDirections[b] = { x: -desiredDir.x, y: -desiredDir.y };
            newHead = { x: head.x + babyDirections[b].x, y: head.y + babyDirections[b].y };
        }

        // ---------- Столкновение с Говноедом ----------
        if (poopSnakeActive && poopSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
            babyFleeing.splice(b, 1);
            continue;
        }

        // ---------- Столкновение с головой игрока в третьей фазе ----------
        if (worldDiscoveredDown && snake.length > 0 && snake[0].x === newHead.x && snake[0].y === newHead.y) {
            // Обрабатывается в updatePlayer, здесь просто удаляем
            babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
            babyFleeing.splice(b, 1);
            continue;
        }

        // ---------- Укус тела игрока (третья фаза) ----------
        if (worldDiscoveredDown) {
            let biteIndex = -1;
            for (let i = 1; i < snake.length; i++) {
                if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
                    biteIndex = i;
                    break;
                }
            }
            if (biteIndex !== -1 && !(babyFleeing[b] && babyFleeing[b].active)) {
                // Укус!
                baby.unshift(newHead);
                baby.push({ ...baby[baby.length - 1] });
                baby.push({ ...baby[baby.length - 1] });

                if (snake.length <= 1) {
                    stopGame('Детёныш убил вас!');
                    return;
                }
                snake.pop();
                prevSnake.pop();

                const fi = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
                if (fi !== -1) foods.splice(fi, 1);
                const pi = poops.findIndex(p => p.x === newHead.x && p.y === newHead.y);
                if (pi !== -1) poops.splice(pi, 1);

                const dists = [
                    { d: head.x + 1, tx: -1, ty: head.y },
                    { d: maxX() - head.x, tx: maxX(), ty: head.y },
                    { d: head.y + 1, tx: head.x, ty: -1 },
                    { d: maxY() - head.y, tx: head.x, ty: maxY() }
                ];
                let maxDist = -1, targetTx, targetTy;
                for (const opt of dists) {
                    if (opt.d > maxDist) {
                        maxDist = opt.d;
                        targetTx = opt.tx;
                        targetTy = opt.ty;
                    }
                }
                babyFleeing[b] = { active: true, tx: targetTx, ty: targetTy };
                continue;
            }
        }

        // ---------- Универсальная проверка прохода сквозь змейку ----------
        const blockThroughSnake = !worldDiscoveredDown || (babyFleeing[b] && babyFleeing[b].active);
        if (blockThroughSnake && snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            // Пытаемся объехать (перпендикулярные направления)
            const alts = desiredDir.x !== 0
                ? [{ x: 0, y: 1 }, { x: 0, y: -1 }]
                : [{ x: 1, y: 0 }, { x: -1, y: 0 }];
            let moved = false;
            for (const alt of alts) {
                if (alt.x === -babyDirections[b].x && alt.y === -babyDirections[b].y) continue;
                const altHead = { x: head.x + alt.x, y: head.y + alt.y };
                if (altHead.x < 0 || altHead.x >= maxX() || altHead.y < 0 || altHead.y >= maxY()) continue;
                if (poopSnakeActive && poopSnake.some(seg => seg.x === altHead.x && seg.y === altHead.y)) continue;
                if (snake.some(seg => seg.x === altHead.x && seg.y === altHead.y)) continue;
                desiredDir = alt;
                babyDirections[b] = alt;
                newHead = altHead;
                moved = true;
                break;
            }
            if (!moved) {
                continue;
            }
        }

        // ---------- Обычное движение ----------
        baby.unshift(newHead);
        const foodIdx = foods.findIndex(f => f.x === newHead.x && f.y === newHead.y);
        if (foodIdx !== -1) {
            foods.splice(foodIdx, 1);
            score += 2; scoreSpan.textContent = score; applesEaten++;
            pushNewFoodCell();
            if (baby.length < 4) baby.push({ ...baby[baby.length - 1] });
            else baby.pop();
            if (applesEaten % 3 === 0) {
                const babyTail = baby[baby.length - 1];
                spawnPoopAt(babyTail, babyDirections[b]);
                updateWarning();
            }
        } else {
            baby.pop();
        }

        if (baby.length === 0) {
            babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
            babyFleeing.splice(b, 1);
        }
    }

if (hadBabies && babySnakes.length === 0 && !egg && gameRunning && !awaitingHatch && !worldDiscoveredDown) {
    stopGame('Потомство уничтожено');
}
}
