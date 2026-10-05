/* Menú móvil */
const menuButton = document.getElementById('menu-btn');
const navigation = document.getElementById('nav-links');

menuButton.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('active');
    menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigation.addEventListener('click', (event) => {
    if (!event.target.closest('a')) return;

    navigation.classList.remove('active');
    menuButton.setAttribute('aria-expanded', 'false');
});

/* Efecto de escritura del título */
const textToType = 'Webs que traen clientes, no solo visitas. ¿Qué construimos hoy?';
const typewriter = document.getElementById('typewriter-text');
const cursor = document.getElementById('cursor');
let typedCharacters = 0;

function typeNextCharacter() {
    if (typedCharacters >= textToType.length) return;

    typewriter.insertBefore(
        document.createTextNode(textToType.charAt(typedCharacters)),
        cursor
    );
    typedCharacters += 1;
    setTimeout(typeNextCharacter, Math.random() * 50 + 30);
}

setTimeout(typeNextCharacter, 500);

/* Avatar: sigue el puntero en pantallas grandes y reproduce un ciclo en móvil */
const catAvatar = document.getElementById('cat-avatar');
const catVideo = document.getElementById('cat-video');
const avatarFrames = [...catAvatar.querySelectorAll('.cat-avatar__frame')];
const hero = document.querySelector('.hero');
const mobileViewport = window.matchMedia('(max-width: 767px)');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobilePause = 4000; // Tiempo en pose neutral entre videos, en milisegundos.
const mobileFadeDuration = 350;

let isMobile = mobileViewport.matches;
catAvatar.classList.toggle('is-mobile', isMobile);
let targetGaze = 0;
let currentGaze = 0;
let animationFrame = null;
let previousFrameTime = null;
let displayedPose = 1;
let videoTurnDuration = 0;
let targetVideoTime = 0;
let lastVideoSeekTime = 0;
let mobileCycleTimer = null;
let activeTouchPointerId = null;
let videoInitialized = false;

catAvatar.classList.toggle('is-desktop', !isMobile);

// La imagen es una cuadrícula: cada recorte muestra una dirección de la mirada.
avatarFrames.forEach((frame, index) => {
    const imageColumn = index === 0 ? 2 : index;
    frame.style.backgroundPosition = `${imageColumn * 50}% 0%`;
    frame.style.transform = index === 0 ? 'scaleX(-1)' : '';
    frame.style.opacity = index === 1 ? '1' : '0';
});

function initializeVideo() {
    if (videoInitialized || !Number.isFinite(catVideo.duration) || catVideo.duration <= 0) return;

    // En escritorio, el mouse recorre los primeros cinco segundos del video.
    videoInitialized = true;
    videoTurnDuration = Math.min(catVideo.duration, 5);
    catVideo.pause();
    catVideo.currentTime = 0;
}

function showReadyVideo() {
    if (catAvatar.classList.contains('has-video')) return;

    catAvatar.classList.add('has-video');

    if (!isMobile) return;

    if (prefersReducedMotion) {
        catAvatar.classList.add('is-mobile-paused');
    } else {
        playMobileVideo();
    }
}

function syncVideoState() {
    if (catVideo.readyState >= HTMLMediaElement.HAVE_METADATA) initializeVideo();
    if (catVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showReadyVideo();
}

catVideo.addEventListener('loadedmetadata', syncVideoState);
catVideo.addEventListener('loadeddata', syncVideoState);
catVideo.addEventListener('canplay', syncVideoState);

catVideo.addEventListener('ended', () => {
    if (!isMobile) return;

    resetMobileVideo();
});

catVideo.addEventListener('error', () => {
    clearTimeout(mobileCycleTimer);
    catAvatar.classList.remove('has-video', 'is-mobile-playing', 'is-mobile-transitioning-out');
    console.error('No se pudo cargar el video del avatar. Se mostrará la imagen de respaldo.');
});

// El archivo puede estar en caché antes de que estos eventos se registren.
syncVideoState();
setTimeout(syncVideoState, 0);

function playMobileVideo() {
    clearTimeout(mobileCycleTimer);
    catVideo.currentTime = 0;
    catAvatar.classList.remove('is-mobile-paused', 'is-mobile-transitioning-out');
    catAvatar.classList.add('is-mobile-playing');

    const playback = catVideo.play();
    if (playback) {
        playback.catch((error) => {
            catAvatar.classList.remove('is-mobile-playing');
            console.warn('No se pudo reproducir el video del avatar:', error);
        });
    }
}

function resetMobileVideo() {
    catVideo.pause();
    catAvatar.classList.remove('is-mobile-playing', 'is-mobile-paused');
    catAvatar.classList.add('is-mobile-transitioning-out');

    mobileCycleTimer = setTimeout(() => {
        if (!isMobile || !catAvatar.classList.contains('is-mobile-transitioning-out')) return;

        const showFirstFrame = () => {
            if (!isMobile || !catAvatar.classList.contains('is-mobile-transitioning-out')) return;

            catAvatar.classList.remove('is-mobile-transitioning-out');
            catAvatar.classList.add('is-mobile-paused');
            mobileCycleTimer = setTimeout(playMobileVideo, mobilePause);
        };

        catVideo.addEventListener('seeked', showFirstFrame, { once: true });
        catVideo.currentTime = 0;
        if (!catVideo.seeking) {
            catVideo.removeEventListener('seeked', showFirstFrame);
            requestAnimationFrame(showFirstFrame);
        }
    }, mobileFadeDuration);
}

function pauseOnVideoFirstFrame() {
    catVideo.pause();
    catVideo.currentTime = 0;
    catAvatar.classList.remove('is-mobile-playing', 'is-mobile-transitioning-out');
    catAvatar.classList.add('is-mobile-paused');
}

mobileViewport.addEventListener('change', (event) => {
    isMobile = event.matches;
    catAvatar.classList.toggle('is-mobile', isMobile);
    catAvatar.classList.toggle('is-desktop', !isMobile);
    clearTimeout(mobileCycleTimer);
    activeTouchPointerId = null;

    if (isMobile && catAvatar.classList.contains('has-video') && !prefersReducedMotion) {
        playMobileVideo();
    } else {
        pauseOnVideoFirstFrame();
    }
});

function renderAvatar() {
    catAvatar.classList.toggle('is-video-mirrored', currentGaze > 0.05);

    if (displayedPose === 1) {
        if (currentGaze < -0.32) displayedPose = 0;
        else if (currentGaze > 0.32) displayedPose = 2;
    } else if (displayedPose === 0) {
        if (currentGaze > 0.38) displayedPose = 2;
        else if (currentGaze > -0.12) displayedPose = 1;
    } else if (currentGaze < -0.38) {
        displayedPose = 0;
    } else if (currentGaze < 0.12) {
        displayedPose = 1;
    }

    avatarFrames.forEach((frame, index) => {
        frame.style.opacity = index === displayedPose ? '1' : '0';
    });
}

function updateVideoPosition(gaze) {
    if (!Number.isFinite(catVideo.duration) || catVideo.duration <= 0) return;

    targetVideoTime = Math.abs(gaze) * videoTurnDuration;
    catAvatar.classList.toggle('is-video-mirrored', gaze > 0.015);

    // Evita buscar cuadros más de 30 veces por segundo mientras se mueve el mouse.
    const now = performance.now();
    const canSeek = !catVideo.seeking
        && catVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        && now - lastVideoSeekTime >= 1000 / 30
        && Math.abs(catVideo.currentTime - targetVideoTime) > 0.025;

    if (canSeek) {
        catVideo.currentTime = targetVideoTime;
        lastVideoSeekTime = now;
    }
}

catVideo.addEventListener('seeked', () => {
    if (isMobile || Math.abs(catVideo.currentTime - targetVideoTime) <= 0.025) return;

    catVideo.currentTime = targetVideoTime;
    lastVideoSeekTime = performance.now();
});

function animateGaze(timestamp) {
    const distance = targetGaze - currentGaze;

    if (Math.abs(distance) < 0.001) {
        currentGaze = targetGaze;
        renderAvatar();
        updateVideoPosition(currentGaze);
        animationFrame = null;
        previousFrameTime = null;
        return;
    }

    const elapsed = previousFrameTime === null
        ? 16.67
        : Math.min(timestamp - previousFrameTime, 64);
    const smoothing = prefersReducedMotion ? 1 : 1 - Math.exp(-elapsed / 160);

    currentGaze += distance * smoothing;
    previousFrameTime = timestamp;
    renderAvatar();
    updateVideoPosition(currentGaze);
    animationFrame = requestAnimationFrame(animateGaze);
}

function lookToward(clientX) {
    const avatarBounds = catAvatar.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const avatarCenter = avatarBounds.left + avatarBounds.width / 2;
    const distance = clientX - avatarCenter;
    const availableWidth = distance < 0
        ? avatarCenter - heroBounds.left
        : heroBounds.right - avatarCenter;

    // Convierte la posición horizontal del mouse a un rango entre -1 (izquierda) y 1 (derecha).
    targetGaze = Math.max(-1, Math.min(1, distance / Math.max(1, availableWidth)));

    if (animationFrame === null) {
        animationFrame = requestAnimationFrame(animateGaze);
    }
}

window.addEventListener('pointerdown', (event) => {
    if (isMobile || event.pointerType !== 'touch' || event.target.closest('a, button')) return;

    activeTouchPointerId = event.pointerId;
    lookToward(event.clientX);
});

window.addEventListener('pointermove', (event) => {
    const isMouse = event.pointerType === 'mouse';
    const isActiveTouch = event.pointerType === 'touch'
        && event.pointerId === activeTouchPointerId;

    if (!isMobile && (isMouse || isActiveTouch)) lookToward(event.clientX);
});

function releaseTouch(event) {
    if (event.pointerId === activeTouchPointerId) activeTouchPointerId = null;
}

window.addEventListener('pointerup', releaseTouch);
window.addEventListener('pointercancel', releaseTouch);

window.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') {
        targetGaze = 0;
        if (animationFrame === null) {
            animationFrame = requestAnimationFrame(animateGaze);
        }
    }
});

/* Copiar el correo */
const copyButton = document.getElementById('copy-email');

copyButton.addEventListener('click', async () => {
    const originalContent = copyButton.innerHTML;

    try {
        if (!navigator.clipboard) {
            throw new Error('El navegador no permite acceder al portapapeles.');
        }

        await navigator.clipboard.writeText('hello@pragz.io');
        copyButton.textContent = '¡Copiado! ✓';
        copyButton.style.backgroundColor = 'var(--text-dark)';
        copyButton.style.color = 'var(--text-light)';
    } catch (error) {
        copyButton.textContent = 'No se pudo copiar';
        console.error('No se pudo copiar el correo al portapapeles:', error);
    }

    setTimeout(() => {
        copyButton.innerHTML = originalContent;
        copyButton.style.backgroundColor = 'transparent';
        copyButton.style.color = 'var(--text-dark)';
    }, 2000);
});
