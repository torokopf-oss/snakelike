function updateBabies() {
    for (let b = babySnakes.length - 1; b >= 0; b--) {
        const baby = babySnakes[b];
        if (!baby) continue;
        babyPrevSnakes[b] = baby.map(s => ({...s}));
        const head = baby[0];
        let desiredDir = { x: 0, y: 0 };

        // ======= ТРЕТЬЯ ФАЗА: агрессивное поведение =======
        if (worldDiscoveredDown) {
            let biteTarget = null;

            if (babyFleeing[b] && babyFleeing[b].active) {
                // Бегство к границе
                const target = babyFleeing[b];
                const dx = target.tx - head.x;
                const dy = target.ty - head.y;
                if (Math.abs(dx) > Math.abs(dy)) desiredDir.x = dx > 0 ? 1 : -1;
                else if (dy !== 0) desiredDir.y = dy > 0 ? 1 : -1;
                else desiredDir.x = dx > 0 ? 1 : -1;
            } else {
                // Поиск ближайшего сегмента тела (не головы)
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
                    // Нет тела — патрулирование (ищем еду)
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

            // Запрет разворота
            if (desiredDir.x === -babyDirections[b].x && desiredDir.y === -babyDirections[b].y) {
                desiredDir = babyDirections[b].x !== 0
                    ? { x: 0, y: Math.random() < 0.5 ? 1 : -1 }
                    : { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
            }
            babyDirections[b] = desiredDir;
            let newHead = { x: head.x + desiredDir.x, y: head.y + desiredDir.y };

            // Границы поля
            if (newHead.x < 0 || newHead.x >= maxX() || newHead.y < 0 || newHead.y >= maxY()) {
                if (babyFleeing[b] && babyFleeing[b].active) {
                    // Достиг границы — конец бегства
                    babyFleeing[b] = { active: false };
                    babyDirections[b] = { x: -desiredDir.x, y: -desiredDir.y };
                    newHead = { x: head.x + babyDirections[b].x, y: head.y + babyDirections[b].y };
                } else {
                    babyDirections[b] = { x: -desiredDir.x, y: -desiredDir.y };
                    newHead = { x: head.x + babyDirections[b].x, y: head.y + babyDirections[b].y };
                }
            }

            // Гибель от Говноеда
            if (poopSnakeActive && poopSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
                babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
                babyFleeing.splice(b, 1);
                continue;
            }

            // Столкновение с головой игрока — детёныш погибает
            if (snake.length > 0 && snake[0].x === newHead.x && snake[0].y === newHead.y) {
                babySnakes.splice(b, 1); babyPrevSnakes.splice(b, 1); babyDirections.splice(b, 1);
                babyFleeing.splice(b, 1);
                continue;
            }

            // Проверка укуса
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

                // Вычисляем самую удалённую границу
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

            // Обычное движение (нет укуса)
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
            continue;
        }

        // ======= ПЕРВАЯ/ВТОРАЯ ФАЗА (старая логика) =======
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
        }
    }

    if (hadBabies && babySnakes.length === 0 && !egg && gameRunning && !awaitingHatch) stopGame('Потомство уничтожено');
}
