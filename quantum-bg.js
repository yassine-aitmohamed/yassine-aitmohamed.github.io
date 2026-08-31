{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 /*\
 * quantum-bg.js\
 * Fond anim\'e9 "quantique" \'97 r\'e9seau de particules intriqu\'e9es (canvas 2D).\
 * Discret, en overlay au-dessus des photos de fond du site.\
 * Couleurs reprises de style.css (--rust, --rust-deep, --amber, --pine).\
 * Respecte prefers-reduced-motion.\
 */\
(function () \{\
    'use strict';\
\
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) \{\
        return;\
    \}\
\
    var canvas = document.createElement('canvas');\
    canvas.id = 'quantum-bg';\
    canvas.setAttribute('aria-hidden', 'true');\
    document.body.insertBefore(canvas, document.body.firstChild);\
\
    var ctx = canvas.getContext('2d');\
    if (!ctx) return;\
\
    var COLORS = ['#D97757', '#E9A47C', '#C1633B', '#E8E8E8'];\
    var LINK_DIST = 150;\
    var LINK_DIST_SQ = LINK_DIST * LINK_DIST;\
\
    var particles = [];\
    var W = 0, H = 0, DPR = 1;\
    var running = true;\
\
    function hexToRgba(hex, alpha) \{\
        var r = parseInt(hex.slice(1, 3), 16);\
        var g = parseInt(hex.slice(3, 5), 16);\
        var b = parseInt(hex.slice(5, 7), 16);\
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';\
    \}\
\
    function initParticles() \{\
        var count = Math.max(26, Math.min(70, Math.round((W * H) / 26000)));\
        particles = [];\
        for (var i = 0; i < count; i++) \{\
            particles.push(\{\
                x: Math.random() * W,\
                y: Math.random() * H,\
                vx: (Math.random() - 0.5) * 0.18,\
                vy: (Math.random() - 0.5) * 0.18,\
                r: 1 + Math.random() * 1.6,\
                color: COLORS[(Math.random() * COLORS.length) | 0],\
                phase: Math.random() * Math.PI * 2\
            \});\
        \}\
    \}\
\
    function resize() \{\
        DPR = Math.min(window.devicePixelRatio || 1, 2);\
        W = window.innerWidth;\
        H = window.innerHeight;\
        canvas.width = Math.round(W * DPR);\
        canvas.height = Math.round(H * DPR);\
        canvas.style.width = W + 'px';\
        canvas.style.height = H + 'px';\
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);\
        initParticles();\
    \}\
\
    function step(t) \{\
        if (!running) return;\
        ctx.clearRect(0, 0, W, H);\
\
        var i, p;\
        for (i = 0; i < particles.length; i++) \{\
            p = particles[i];\
            p.x += p.vx;\
            p.y += p.vy;\
            if (p.x < 0 || p.x > W) \{ p.vx *= -1; p.x = Math.max(0, Math.min(W, p.x)); \}\
            if (p.y < 0 || p.y > H) \{ p.vy *= -1; p.y = Math.max(0, Math.min(H, p.y)); \}\
            p.pulse = 0.55 + 0.45 * Math.sin(t * 0.0012 + p.phase);\
        \}\
\
        for (var a = 0; a < particles.length; a++) \{\
            var p1 = particles[a];\
            for (var b = a + 1; b < particles.length; b++) \{\
                var p2 = particles[b];\
                var dx = p1.x - p2.x, dy = p1.y - p2.y;\
                var distSq = dx * dx + dy * dy;\
                if (distSq < LINK_DIST_SQ) \{\
                    var alpha = (1 - Math.sqrt(distSq) / LINK_DIST) * 0.3;\
                    ctx.strokeStyle = 'rgba(217,119,87,' + alpha.toFixed(3) + ')';\
                    ctx.lineWidth = 0.6;\
                    ctx.beginPath();\
                    ctx.moveTo(p1.x, p1.y);\
                    ctx.lineTo(p2.x, p2.y);\
                    ctx.stroke();\
                \}\
            \}\
        \}\
\
        for (i = 0; i < particles.length; i++) \{\
            p = particles[i];\
            var glowR = p.r * 3.4;\
            var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);\
            grad.addColorStop(0, hexToRgba(p.color, 0.85 * p.pulse));\
            grad.addColorStop(1, hexToRgba(p.color, 0));\
            ctx.fillStyle = grad;\
            ctx.beginPath();\
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);\
            ctx.fill();\
\
            ctx.fillStyle = hexToRgba(p.color, 0.9 * p.pulse);\
            ctx.beginPath();\
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\
            ctx.fill();\
        \}\
\
        requestAnimationFrame(step);\
    \}\
\
    function debounce(fn, ms) \{\
        var timer;\
        return function () \{\
            clearTimeout(timer);\
            timer = setTimeout(fn, ms);\
        \};\
    \}\
\
    document.addEventListener('visibilitychange', function () \{\
        running = !document.hidden;\
        if (running) requestAnimationFrame(step);\
    \});\
\
    window.addEventListener('resize', debounce(resize, 200));\
\
    resize();\
    requestAnimationFrame(step);\
\})();}
