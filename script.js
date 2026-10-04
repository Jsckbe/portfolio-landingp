/* =========================================
   1. MENÚ HAMBURGUESA MÓVIL
========================================= */
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

// Al hacer click, toggle (agrega o quita) la clase 'active'
menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

/* =========================================
   2. EFECTO MÁQUINA DE ESCRIBIR
========================================= */
const textToType = "Webs que traen clientes, no solo visitas. ¿Qué construimos hoy?";
const typeContainer = document.getElementById('typewriter-text');
const cursor = document.getElementById('cursor');

let charIndex = 0;

function typeWriter() {
    if (charIndex < textToType.length) {
        // Insertamos la letra antes del cursor
        const char = document.createTextNode(textToType.charAt(charIndex));
        typeContainer.insertBefore(char, cursor);
        charIndex++;
        // Velocidad aleatoria entre 30ms y 80ms para un efecto más natural (humano)
        setTimeout(typeWriter, Math.random() * 50 + 30);
    } else {
        // Opcional: Detener el parpadeo del cursor cuando termina
        // cursor.style.display = 'none'; 
    }
}

// Iniciar el efecto de escritura medio segundo después de cargar la página
setTimeout(typeWriter, 500);

/* =========================================
   3. AVATAR: SEGUIMIENTO SUAVE DEL MOUSE
========================================= */
const catAvatar = document.getElementById('cat-avatar');
const avatarFrames = [...catAvatar.querySelectorAll('.cat-avatar__frame')];
const catVideo = document.getElementById('cat-video');
const heroSection = document.querySelector('.hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let targetGaze = 0;
let currentGaze = 0;
let gazeAnimationFrame = null;
let previousGazeFrameTime = null;
let activeTouchPointerId = null;
let displayedGazePose = 1;
let targetVideoTime = null;
let videoTurnDuration = 0;
let lastVideoSeekTime = 0;
let touchReturnTimer = null;
let eyeSpiralTimer = null;
let eyeSpiralReturnTimer = null;
let eyeSpiralActive = false;
let lastGazeInteraction = performance.now();

avatarFrames.forEach((frame, column) => {
    const sourceColumn = column === 0 ? 2 : column;
    frame.style.backgroundPosition = `${sourceColumn * 50}% 0%`;
    frame.style.transform = column === 0 ? 'scaleX(-1)' : '';
    frame.style.opacity = column === 1 ? '1' : '0';
});

catVideo.addEventListener('loadedmetadata', () => {
    if (!Number.isFinite(catVideo.duration) || catVideo.duration <= 0) return;

    videoTurnDuration = Math.min(catVideo.duration, 5);
    targetVideoTime = 0;
    catVideo.pause();
    catVideo.currentTime = targetVideoTime;
});

catVideo.addEventListener('loadeddata', () => {
    catAvatar.classList.add('has-video');
    scheduleEyeSpiral(12000);
});

catVideo.addEventListener('error', () => {
    catAvatar.classList.remove('has-video');
});

catVideo.addEventListener('seeked', () => {
    if (!eyeSpiralActive
        && Number.isFinite(targetVideoTime)
        && Math.abs(catVideo.currentTime - targetVideoTime) > 0.04) {
        catVideo.currentTime = targetVideoTime;
    }
});

function renderGaze() {
    catAvatar.classList.toggle('is-video-mirrored', currentGaze > 0.05);

    if (displayedGazePose === 1) {
        if (currentGaze < -0.32) displayedGazePose = 0;
        else if (currentGaze > 0.32) displayedGazePose = 2;
    } else if (displayedGazePose === 0) {
        if (currentGaze > 0.38) displayedGazePose = 2;
        else if (currentGaze > -0.12) displayedGazePose = 1;
    } else if (currentGaze < -0.38) {
        displayedGazePose = 0;
    } else if (currentGaze < 0.12) {
        displayedGazePose = 1;
    }

    avatarFrames.forEach((frame, column) => {
        frame.style.opacity = column === displayedGazePose ? '1' : '0';
    });
}

function animateGaze(timestamp) {
    const distance = targetGaze - currentGaze;

    if (Math.abs(distance) < 0.001) {
        currentGaze = targetGaze;
        renderGaze();
        updateVideoTarget(currentGaze);
        gazeAnimationFrame = null;
        previousGazeFrameTime = null;
        return;
    }

    const elapsed = previousGazeFrameTime === null
        ? 16.67
        : Math.min(timestamp - previousGazeFrameTime, 64);
    const smoothing = reduceMotion ? 1 : 1 - Math.exp(-elapsed / 160);

    currentGaze += distance * smoothing;
    previousGazeFrameTime = timestamp;
    renderGaze();
    updateVideoTarget(currentGaze);
    gazeAnimationFrame = requestAnimationFrame(animateGaze);
}

function updateVideoTarget(gaze) {
    if (eyeSpiralActive || !Number.isFinite(catVideo.duration) || catVideo.duration <= 0) return;

    targetVideoTime = Math.abs(gaze) * videoTurnDuration;
    if (Math.abs(gaze) < 0.015) {
        catAvatar.classList.toggle('is-video-mirrored', targetGaze > 0.015);
    } else {
        catAvatar.classList.toggle('is-video-mirrored', gaze > 0);
    }

    const now = performance.now();
    if (!catVideo.seeking
        && catVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        && now - lastVideoSeekTime >= 1000 / 30
        && Math.abs(catVideo.currentTime - targetVideoTime) > 0.025) {
        catVideo.currentTime = targetVideoTime;
        lastVideoSeekTime = now;
    }
}

function lookToward(clientX) {
    lastGazeInteraction = performance.now();
    if (touchReturnTimer !== null) {
        clearTimeout(touchReturnTimer);
        touchReturnTimer = null;
    }
    if (eyeSpiralActive) {
        eyeSpiralActive = false;
        clearTimeout(eyeSpiralReturnTimer);
        updateVideoTarget(currentGaze);
        scheduleEyeSpiral(14000);
    }

    const bounds = catAvatar.getBoundingClientRect();
    const heroBounds = heroSection.getBoundingClientRect();
    const avatarCenter = bounds.left + bounds.width / 2;
    const distance = clientX - avatarCenter;
    const reach = distance < 0
        ? avatarCenter - heroBounds.left
        : heroBounds.right - avatarCenter;

    targetGaze = Math.max(-1, Math.min(1,
        distance / Math.max(1, reach)
    ));

    if (gazeAnimationFrame === null) {
        gazeAnimationFrame = requestAnimationFrame(animateGaze);
    }
}

function releaseTouch(event) {
    if (event.pointerId !== activeTouchPointerId) return;

    activeTouchPointerId = null;
    lastGazeInteraction = performance.now();
    touchReturnTimer = setTimeout(() => {
        targetGaze = 0;
        if (gazeAnimationFrame === null) {
            gazeAnimationFrame = requestAnimationFrame(animateGaze);
        }
    }, 800);
}

function scheduleEyeSpiral(delay) {
    clearTimeout(eyeSpiralTimer);
    eyeSpiralTimer = setTimeout(() => {
        const hasBeenIdle = performance.now() - lastGazeInteraction > 8000;
        const isCentered = Math.abs(currentGaze) < 0.12;

        if (hasBeenIdle && isCentered && activeTouchPointerId === null && catAvatar.classList.contains('has-video')) {
            eyeSpiralActive = true;
            catVideo.currentTime = Math.min(6.8, catVideo.duration - 0.1);
            eyeSpiralReturnTimer = setTimeout(() => {
                eyeSpiralActive = false;
                updateVideoTarget(currentGaze);
                scheduleEyeSpiral(14000);
            }, 450);
        } else {
            scheduleEyeSpiral(2500);
        }
    }, delay);
}

heroSection.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || event.target.closest('a, button')) return;

    activeTouchPointerId = event.pointerId;
    try {
        heroSection.setPointerCapture(event.pointerId);
    } catch {}
    lookToward(event.clientX);
});

window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || event.pointerId === activeTouchPointerId) {
        lookToward(event.clientX);
    }
});

window.addEventListener('pointerup', releaseTouch);
window.addEventListener('pointercancel', releaseTouch);

/* =========================================
   4. COPIAR CORREO AL PORTAPAPELES
========================================= */
const copyBtn = document.getElementById('copy-email');

copyBtn.addEventListener('click', () => {
    const email = "hello@pragz.io";
    
    // API moderna de JS para copiar texto
    navigator.clipboard.writeText(email).then(() => {
        // Feedback visual temporal
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = "¡Copiado! ✓";
        copyBtn.style.backgroundColor = "var(--text-dark)";
        copyBtn.style.color = "var(--text-light)";
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHtml;
            copyBtn.style.backgroundColor = "transparent";
            copyBtn.style.color = "var(--text-dark)";
        }, 2000);
    });
});