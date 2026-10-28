/* =========================================================
   Carv-performance — Lógica del sitio
   ========================================================= */
(function () {
    'use strict';

    document.documentElement.classList.remove('no-js');

    /* ---------- CONFIGURACIÓN (edita aquí) ---------- */
    const PHONE = '56956582223';
    const ADDRESS = 'Mario Neira #616, Recoleta, Santiago';
    // Horario: [hora apertura, hora cierre] por día (0 = domingo). Cámbialo junto con la tabla del HTML.
    const HORARIO = { 0: [9, 20], 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 20] };

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    /* ---------- Imágenes con respaldo (si falta un archivo) ---------- */
    $$('img[data-fallback]').forEach(img => {
        const apply = () => {
            const fb = img.dataset.fallback;
            if (fb === 'hide') {
                const col = img.closest('[class*="col-"]');
                (col || img).remove();
            } else if (img.getAttribute('src') !== fb) {
                img.src = fb;
            }
        };
        if (img.complete && img.naturalWidth === 0) apply();
        img.addEventListener('error', apply, { once: true });
    });

    /* ---------- WhatsApp: cualquier elemento con data-wa abre el chat ---------- */
    function sendWhatsApp(text) {
        window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        if (typeof gtag === 'function') gtag('event', 'click_whatsapp', { mensaje: text.slice(0, 60) });
    }
    $$('[data-wa]').forEach(el => {
        el.addEventListener('click', e => { e.preventDefault(); sendWhatsApp(el.dataset.wa); });
    });

    /* ---------- Navbar: sombra al bajar + cerrar menú móvil ---------- */
    const navbar = $('#navbar');
    const toTop = $('#toTop');
    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 20);
        toTop.classList.toggle('show', y > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const menu = $('#menu');
    $$('#menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (menu.classList.contains('show') && window.bootstrap) {
                bootstrap.Collapse.getOrCreateInstance(menu).hide();
            }
        });
    });

    /* ---------- Sección activa en el menú ---------- */
    const navLinks = $$('#menu .nav-link');
    const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('section[id]').forEach(s => spy.observe(s));

    /* ---------- Animación al hacer scroll ---------- */
    const revealer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); revealer.unobserve(entry.target); }
        });
    }, { threshold: .12 });
    $$('.reveal').forEach(el => revealer.observe(el));

    /* ---------- Lightbox: galería y carta de presentación ---------- */
    const lightbox = $('#lightbox');
    lightbox.addEventListener('show.bs.modal', e => {
        const fig = e.relatedTarget;
        const img = $('img', fig);
        const cap = $('figcaption', fig);
        $('#lightboxImg').src = img.currentSrc || img.src;
        $('#lightboxImg').alt = img.alt;
        $('#lightboxCaption').textContent = cap ? cap.textContent : '';
    });
    // Abrir con teclado (Enter / Espacio)
    $$('[data-bs-target="#lightbox"]').forEach(fig => {
        fig.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ' ') && window.bootstrap) {
                e.preventDefault();
                bootstrap.Modal.getOrCreateInstance(lightbox).show(fig);
            }
        });
    });

    /* ---------- Horario: "Abierto ahora / Cerrado" y día destacado ---------- */
    (function () {
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
        const day = now.getDay();
        const h = HORARIO[day];
        const hour = now.getHours() + now.getMinutes() / 60;
        const open = !!h && hour >= h[0] && hour < h[1];
        const badge = $('#openBadge');
        badge.textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
        badge.classList.add(open ? 'bg-success' : 'bg-secondary', 'text-white');

        // Estado en el hero
        const heroStatus = $('#heroStatus');
        const heroDot = $('#heroDot');
        if (heroStatus && h) {
            const fmt = n => String(n).padStart(2, '0') + ':00';
            heroStatus.textContent = open
                ? `Abierto ahora · hasta las ${fmt(h[1])}`
                : `Cerrado ahora · abrimos a las ${fmt(h[0])}`;
            heroDot.classList.toggle('open', open);
        }

        $$('.hours tr[data-day]').forEach(tr => {
            const d = tr.dataset.day;
            const match = d.includes('-')
                ? day >= +d.split('-')[0] && day <= +d.split('-')[1]
                : day === +d;
            tr.classList.toggle('today', match);
        });
    })();

    /* ---------- Copiar dirección ---------- */
    const copyBtn = $('#copyAddress');
    copyBtn.addEventListener('click', async () => {
        const label = $('span', copyBtn);
        try {
            await navigator.clipboard.writeText(ADDRESS);
            label.textContent = '¡Dirección copiada!';
            copyBtn.classList.add('copied');
        } catch {
            label.textContent = ADDRESS;
        }
        setTimeout(() => { label.textContent = 'Copiar dirección'; copyBtn.classList.remove('copied'); }, 2500);
    });

    /* ---------- Cotizador ---------- */
    const form = $('#quoteForm');
    const yearInput = $('#vehicleYear');
    const dateInput = $('#preferredDate');
    const details = $('#additionalDetails');
    const charCount = $('#charCount');

    const today = new Date();
    yearInput.max = today.getFullYear() + 1;
    const pad = n => String(n).padStart(2, '0');
    dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    $('#year').textContent = today.getFullYear();

    details.addEventListener('input', () => { charCount.textContent = details.value.length; });

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            const firstInvalid = $(':invalid', form);
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const val = id => $('#' + id).value.trim();
        const fecha = val('preferredDate')
            ? new Date(val('preferredDate') + 'T12:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'A convenir';

        const message =
            `*COTIZACIÓN WEB - CARV-PERFORMANCE*\n\n` +
            `🚗 *Vehículo:* ${val('vehicleBrandModel')}\n` +
            `📅 *Año:* ${val('vehicleYear')}\n` +
            `🔖 *Patente:* ${val('vehiclePlate').toUpperCase() || 'No indicada'}\n` +
            `🛠️ *Servicio:* ${val('serviceRequired')}\n` +
            `🗓️ *Día preferido:* ${fecha}\n` +
            `📝 *Detalle:* ${val('additionalDetails') || 'Sin detalles'}\n\n` +
            `_Hola, quisiera saber disponibilidad y costo para mi vehículo._`;

        sendWhatsApp(message);
        form.reset();
        form.classList.remove('was-validated');
        charCount.textContent = '0';
    });
})();
