// BGS Group: efectos de la página (todo es opcional; sin JS el sitio funciona igual).
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Las tarjetas aparecen escalonadas al entrar en pantalla.
    function setupReveal() {
        var cards = document.querySelectorAll('.company-card');
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        cards.forEach(function (card, i) {
            card.classList.add('reveal');
            card.style.transitionDelay = (i % 3) * 0.1 + 's';
            // El delay solo aplica a la entrada; después el hover responde al instante.
            card.addEventListener('transitionend', function clear() {
                card.style.transitionDelay = '';
                card.removeEventListener('transitionend', clear);
            });
            observer.observe(card);
        });
    }

    // En pantallas táctiles no hay hover: cada tarjeta se energiza (una vuelta de
    // corriente por el borde) al entrar en pantalla y otra vez al tocarla.
    function setupEnergize() {
        var touch = window.matchMedia('(hover: none)').matches;
        if (reduceMotion || !touch || !('IntersectionObserver' in window)) return;

        function energize(card) {
            card.classList.add('energized');
            clearTimeout(card.energizeTimer);
            card.energizeTimer = setTimeout(function () {
                card.classList.remove('energized');
            }, 1600);
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                energize(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.6 });

        document.querySelectorAll('.company-card').forEach(function (card) {
            observer.observe(card);
            card.addEventListener('touchstart', function () { energize(card); }, { passive: true });
        });
    }

    // Sombra al bajar; el header se esconde al bajar y vuelve al subir.
    function updateHeader(scrollY, lastY) {
        var header = document.querySelector('.header');
        if (!header) return;
        header.classList.toggle('is-scrolled', scrollY > 100);
        header.classList.toggle('is-hidden', scrollY > lastY && scrollY > 300);
    }

    function setupScrollToTop() {
        var button = document.createElement('button');
        button.className = 'scroll-to-top';
        button.type = 'button';
        button.setAttribute('aria-label', 'Scroll to top');
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z"/></svg>';
        button.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
        document.body.appendChild(button);
        return button;
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupReveal();
        setupEnergize();
        var toTop = setupScrollToTop();
        var lastY = window.scrollY;
        var ticking = false;

        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(function () {
                var y = window.scrollY;
                updateHeader(y, lastY);
                toTop.classList.toggle('visible', y > 300);
                lastY = y;
                ticking = false;
            });
        }, { passive: true });
    });
})();
