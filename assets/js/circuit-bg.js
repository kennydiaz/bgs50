// Fondo animado: pistas de circuito con pulsos de corriente que las recorren.
// Las pistas se dibujan una vez en una capa aparte; cada cuadro solo pinta los
// pulsos encima. Sin JS, o con "reducir movimiento", el sitio queda estático.
(function () {
    'use strict';

    var GRID = 32;
    var COLORS = ['#e63946', '#e63946', '#e63946', '#f1c40f'];
    // 8 direcciones en sentido horario empezando a la derecha: pares rectas, impares a 45°.
    var DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var canvas, ctx, staticLayer;
    var sprites = {};
    var width = 0, height = 0, dpr = 1;
    var traces = [], pulses = [], flashes = [];
    var rafId = null, lastTime = 0, nextSpawn = 0, maxPulses = 3;

    function rand(min, max) { return min + Math.random() * (max - min); }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    // Brillo radial pre-dibujado por color: más barato que shadowBlur en cada cuadro.
    function makeSprite(color) {
        var s = document.createElement('canvas');
        s.width = s.height = 64;
        var g = s.getContext('2d');
        var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, color);
        grad.addColorStop(0.25, color + '99');
        grad.addColorStop(1, color + '00');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        return s;
    }

    // Camina por una cuadrícula sin pisar pistas existentes. Las diagonales son
    // tramos cortos que vuelven a la recta, como en una placa real.
    function buildTraces() {
        var cols = Math.ceil(width / GRID) + 1;
        var rows = Math.ceil(height / GRID) + 1;
        var nodes = new Uint8Array(cols * rows);
        var diagonals = new Uint8Array(cols * rows);
        var target = Math.round(cols * rows / 9);
        var list = [];

        for (var attempt = 0; attempt < target * 4 && list.length < target; attempt++) {
            var x = Math.floor(Math.random() * cols);
            var y = Math.floor(Math.random() * rows);
            if (nodes[y * cols + x]) continue;

            var dir = pick([0, 2, 4, 6]);
            var lastDir = dir;
            var steps = Math.floor(rand(3, 14));
            var points = [[x, y]];
            var usedNodes = [y * cols + x];
            var usedDiagonals = [];
            nodes[y * cols + x] = 1;

            for (var s = 0; s < steps; s++) {
                if (s > 0 && Math.random() < (dir % 2 ? 0.5 : 0.2)) {
                    dir = (dir + (Math.random() < 0.5 ? 1 : 7)) % 8;
                }
                var nx = x + DIRS[dir][0];
                var ny = y + DIRS[dir][1];
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || nodes[ny * cols + nx]) break;

                // Dos diagonales que se cruzan en la misma celda formarían una X.
                if (dir % 2) {
                    var cell = Math.min(y, ny) * cols + Math.min(x, nx);
                    if (diagonals[cell]) break;
                    diagonals[cell] = 1;
                    usedDiagonals.push(cell);
                }

                nodes[ny * cols + nx] = 1;
                usedNodes.push(ny * cols + nx);
                if (dir === lastDir && points.length > 1) points[points.length - 1] = [nx, ny];
                else points.push([nx, ny]);
                lastDir = dir;
                x = nx;
                y = ny;
            }

            if (usedNodes.length < 4) {
                usedNodes.forEach(function (i) { nodes[i] = 0; });
                usedDiagonals.forEach(function (i) { diagonals[i] = 0; });
                continue;
            }
            list.push(toTrace(points));
        }
        return list;
    }

    function toTrace(points) {
        var pts = points.map(function (p) { return [p[0] * GRID, p[1] * GRID]; });
        var lens = [];
        var total = 0;
        for (var i = 1; i < pts.length; i++) {
            total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
            lens.push(total);
        }
        return { pts: pts, lens: lens, total: total };
    }

    // Punto a una distancia dada sobre la pista (en un sentido u otro).
    function pointAt(trace, dist, reverse) {
        if (reverse) dist = trace.total - dist;
        dist = Math.max(0, Math.min(trace.total, dist));
        for (var i = 0; i < trace.lens.length; i++) {
            if (dist <= trace.lens[i]) {
                var start = i ? trace.lens[i - 1] : 0;
                var k = (dist - start) / ((trace.lens[i] - start) || 1);
                var a = trace.pts[i], b = trace.pts[i + 1];
                return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
            }
        }
        return trace.pts[trace.pts.length - 1];
    }

    function drawStatic() {
        staticLayer = document.createElement('canvas');
        staticLayer.width = canvas.width;
        staticLayer.height = canvas.height;
        var g = staticLayer.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.lineCap = 'round';
        g.lineJoin = 'round';

        g.strokeStyle = 'rgba(255, 255, 255, 0.055)';
        g.lineWidth = 1.5;
        traces.forEach(function (t) {
            g.beginPath();
            g.moveTo(t.pts[0][0], t.pts[0][1]);
            for (var i = 1; i < t.pts.length; i++) g.lineTo(t.pts[i][0], t.pts[i][1]);
            g.stroke();
        });

        // Pads en los extremos de cada pista.
        g.fillStyle = '#0f0f0f';
        g.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        traces.forEach(function (t) {
            [t.pts[0], t.pts[t.pts.length - 1]].forEach(function (p) {
                g.beginPath();
                g.arc(p[0], p[1], 3, 0, Math.PI * 2);
                g.fill();
                g.stroke();
            });
        });
    }

    // Las tarjetas son opacas: un pulso detrás de ellas no se vería. Se prueban
    // unas cuantas pistas al azar y se usa la primera con su centro a la vista.
    function isCovered(p, rects) {
        return rects.some(function (r) {
            return p[0] > r.left && p[0] < r.right && p[1] > r.top && p[1] < r.bottom;
        });
    }

    function spawnPulse() {
        var candidates = traces.filter(function (t) { return t.total >= GRID * 4; });
        if (!candidates.length) return;
        var rects = Array.prototype.map.call(document.querySelectorAll(".company-card, .header, .footer"), function (el) {
            return el.getBoundingClientRect();
        });
        var trace = pick(candidates);
        for (var i = 0; i < 8 && isCovered(pointAt(trace, trace.total / 2), rects); i++) {
            trace = pick(candidates);
        }
        var pulse = {
            trace: trace,
            reverse: Math.random() < 0.5,
            dist: 0,
            speed: rand(110, 220),
            len: rand(60, 130),
            color: pick(COLORS),
            arrived: false
        };
        pulses.push(pulse);
        flash(pointAt(trace, 0, pulse.reverse), pulse.color, 0.6);
    }

    function flash(p, color, strength) {
        flashes.push({ x: p[0], y: p[1], color: color, life: strength });
    }

    function drawPulse(p) {
        var head = Math.min(p.dist, p.trace.total);
        var tail = Math.max(0, p.dist - p.len);
        if (head <= tail) return;

        // La estela es un solo trazo que sigue las esquinas de la pista, con un
        // degradado de transparente (cola) a color pleno (cabeza).
        var path = pathBetween(p.trace, tail, head, p.reverse);
        var from = path[0];
        var to = path[path.length - 1];
        var grad = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
        grad.addColorStop(0, p.color + '00');
        grad.addColorStop(1, p.color);

        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        for (var i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
        ctx.stroke();

        if (p.dist < p.trace.total) {
            ctx.globalAlpha = 0.9;
            ctx.drawImage(sprites[p.color], to[0] - 14, to[1] - 14, 28, 28);
        }
    }

    // Puntos de la pista entre dos distancias, incluidas las esquinas intermedias,
    // ordenados de la cola a la cabeza del pulso.
    function pathBetween(trace, from, to, reverse) {
        var a = reverse ? trace.total - to : from;
        var b = reverse ? trace.total - from : to;
        var points = [pointAt(trace, a, false)];
        for (var i = 0; i < trace.lens.length - 1; i++) {
            if (trace.lens[i] > a && trace.lens[i] < b) points.push(trace.pts[i + 1]);
        }
        points.push(pointAt(trace, b, false));
        return reverse ? points.reverse() : points;
    }

    function drawFlash(f) {
        ctx.globalAlpha = f.life;
        ctx.drawImage(sprites[f.color], f.x - 16, f.y - 16, 32, 32);
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
        ctx.stroke();
    }

    function frame(time) {
        var dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        if (time >= nextSpawn && pulses.length < maxPulses) {
            spawnPulse();
            nextSpawn = time + rand(250, 900);
        }

        pulses = pulses.filter(function (p) {
            p.dist += p.speed * dt;
            if (!p.arrived && p.dist >= p.trace.total) {
                p.arrived = true;
                flash(pointAt(p.trace, p.trace.total, p.reverse), p.color, 1);
            }
            return p.dist - p.len < p.trace.total;
        });
        flashes = flashes.filter(function (f) {
            f.life -= dt * 1.4;
            return f.life > 0;
        });

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(staticLayer, 0, 0);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        pulses.forEach(drawPulse);
        flashes.forEach(drawFlash);

        rafId = window.requestAnimationFrame(frame);
    }

    function start() {
        if (rafId || reduceMotion.matches || document.hidden) return;
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = null;
    }

    // El canvas mide 100lvh: la barra del navegador móvil al mostrarse u ocultarse
    // no cambia su tamaño, así que las pistas no se regeneran al hacer scroll.
    function resize() {
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        if (w === width && h === height) return;
        width = w;
        height = h;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        maxPulses = Math.max(3, Math.min(10, Math.round(w * h / 90000)));

        traces = buildTraces();
        pulses = [];
        flashes = [];
        drawStatic();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(staticLayer, 0, 0);
    }

    function init() {
        canvas = document.createElement('canvas');
        canvas.className = 'circuit-bg';
        canvas.setAttribute('aria-hidden', 'true');
        ctx = canvas.getContext('2d');
        if (!ctx) return;
        document.body.insertBefore(canvas, document.body.firstChild);

        COLORS.forEach(function (c) { sprites[c] = sprites[c] || makeSprite(c); });
        resize();
        window.requestAnimationFrame(function () { canvas.classList.add('ready'); });
        start();

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 200);
        });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop();
            else start();
        });
        reduceMotion.addEventListener('change', function () {
            if (reduceMotion.matches) {
                stop();
                pulses = [];
                flashes = [];
                width = 0;
                resize();
            } else {
                start();
            }
        });
    }

    init();
})();
