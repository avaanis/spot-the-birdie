// ===== CASE CONFIGURATION =====
// Change this number to the correct number of birds in duolingo.mp4.
// Keep it as a number (not quotation marks), for example: const CORRECT_BIRD_COUNT = 12;
const CORRECT_BIRD_COUNT = 8;

const intro = document.getElementById('intro');
const terminal = document.getElementById('terminal');
const beginButton = document.getElementById('begin-button');
const introStatus = document.getElementById('intro-status');
const typewriter = document.getElementById('typewriter');
const display = document.getElementById('answer-display');
const keypad = document.getElementById('keypad');
const message = document.getElementById('access-message');
const inputModule = document.querySelector('.input-module');
const labLink = document.getElementById('lab-link');
const verificationStatus = document.getElementById('verification-status');
const verificationText = document.getElementById('verification-text');
const openInspector = document.getElementById('open-inspector');
const inspector = document.getElementById('image-inspector');
const closeInspector = document.getElementById('close-inspector');
const zoomStage = document.getElementById('zoom-stage');
const zoomFrame = document.getElementById('zoom-frame'); // the element we actually pan/scale
const zoomImage = document.getElementById('zoom-image'); // the <video>; never transformed directly
const mainVideo = document.getElementById('main-evidence-video'); // the looping clip in the main panel
let answer = '';
let unlocked = false;
let zoom = 1;
let panX = 0;
let panY = 0;
const pointers = new Map();
let pinchStartDistance = 0;
let pinchStartZoom = 1;
let dragStart = null;

beginButton.addEventListener('click', startTerminal);

function startTerminal() {
  intro.classList.add('scanning');
  introStatus.textContent = 'OPTICAL SWEEP IN PROGRESS...';
  window.setTimeout(() => {
    intro.hidden = true;
    terminal.classList.remove('hidden');
    typeReport('EVIDENCE PACKAGE RECEIVED. REVIEW EXHIBIT A AND LOG YOUR FINDINGS.');
  }, 1450);
}

function typeReport(text) {
  typewriter.textContent = ''; // guard against duplicate text if ever called twice
  let index = 0;
  const timer = window.setInterval(() => {
    typewriter.textContent += text[index++];
    if (index === text.length) window.clearInterval(timer);
  }, 21);
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => {
      item.classList.toggle('active', item === tab);
      item.setAttribute('aria-selected', item === tab ? 'true' : 'false');
    });
    document.querySelectorAll('.panel').forEach((panel) => {
      const show = panel.id === tab.dataset.panel;
      panel.hidden = !show;
      panel.classList.toggle('active', show);
    });
  });
});

keypad.addEventListener('click', (event) => {
  const key = event.target.dataset.key;
  if (!key || unlocked) return;
  if (key === 'clear') { answer = ''; updateDisplay(); return; }
  if (key === 'submit') { verifyAnswer(); return; }
  if (answer.length < 5) { answer += key; updateDisplay(); }
});

function updateDisplay() {
  display.textContent = answer || '_';
  message.textContent = answer ? 'INPUT BUFFER READY' : 'AWAITING NUMERICAL INPUT';
  message.classList.remove('denied');
}

function verifyAnswer() {
  if (Number(answer) === CORRECT_BIRD_COUNT && answer !== '') {
    unlocked = true;
    message.textContent = 'COUNT RECEIVED // RUNNING VERIFICATION...';
    message.classList.remove('denied');
    keypad.classList.add('locked');
    verificationStatus.hidden = false;
    window.setTimeout(() => {
      verificationText.textContent = 'ACCESS GRANTED // LABORATORY CLEARANCE ISSUED';
      verificationStatus.classList.add('granted');
      message.textContent = 'COUNT VERIFIED // CLEARANCE GRANTED';
      inputModule.classList.add('verified');
      labLink.hidden = false;
    }, 1400);
  } else {
    message.textContent = 'ACCESS DENIED // RECOUNT EXHIBIT A';
    message.classList.remove('denied');
    void message.offsetWidth; // Restart the flash animation on repeated attempts.
    message.classList.add('denied');
  }
}

// Inspection mode supports mouse wheel, buttons, dragging, and genuine two-finger pinch zoom.
// The transform always targets #zoom-frame (a plain div), never the <video> itself — see the
// comment in index.html for why.
//
// PERFORMANCE NOTE: the main panel video and the inspector video are the same clip rendered
// twice in the DOM (so the inspector can show a separate, transformable copy). Running both
// <video> decoders at once is the main source of jank/"glitching" on lower-end machines, so
// only one of the two is ever actually playing: the main clip pauses the moment the inspector
// opens and resumes the moment it closes.
openInspector.addEventListener('click', () => {
  inspector.hidden = false;
  resetView();
  mainVideo.pause?.();
  zoomImage.currentTime = mainVideo.currentTime || 0;
  zoomImage.play?.();
  closeInspector.focus();
});
function closeInspectorView() {
  inspector.hidden = true;
  zoomImage.pause?.();
  mainVideo.currentTime = zoomImage.currentTime || 0;
  mainVideo.play?.();
}
closeInspector.addEventListener('click', closeInspectorView);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !inspector.hidden) closeInspectorView();
});
document.querySelectorAll('[data-zoom]').forEach((button) => {
  button.addEventListener('click', () => {
    const direction = button.dataset.zoom;
    if (direction === 'reset') resetView();
    else setZoom(zoom + (direction === 'in' ? 0.25 : -0.25));
  });
});
zoomStage.addEventListener('wheel', (event) => {
  event.preventDefault();
  setZoom(zoom + (event.deltaY < 0 ? 0.12 : -0.12));
}, { passive: false });
zoomStage.addEventListener('pointerdown', (event) => {
  zoomStage.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 1) dragStart = { x: event.clientX, y: event.clientY, panX, panY };
  if (pointers.size === 2) { pinchStartDistance = pointerDistance(); pinchStartZoom = zoom; dragStart = null; }
  zoomStage.classList.add('dragging');
});
zoomStage.addEventListener('pointermove', (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) setZoom(pinchStartZoom * (pointerDistance() / pinchStartDistance));
  else if (dragStart && zoom > 1) {
    panX = dragStart.panX + event.clientX - dragStart.x;
    panY = dragStart.panY + event.clientY - dragStart.y;
    updateTransform();
  }
});
['pointerup', 'pointercancel'].forEach((type) => zoomStage.addEventListener(type, (event) => {
  pointers.delete(event.pointerId);
  if (pointers.size === 1) { const point = [...pointers.values()][0]; dragStart = { x: point.x, y: point.y, panX, panY }; }
  if (!pointers.size) { dragStart = null; zoomStage.classList.remove('dragging'); }
}));
function pointerDistance() { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); }
function setZoom(value) { zoom = Math.min(6, Math.max(1, value)); if (zoom === 1) { panX = 0; panY = 0; } updateTransform(); }
function resetView() { zoom = 1; panX = 0; panY = 0; updateTransform(); }
function updateTransform() { zoomFrame.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; }

/* ==========================
   BACKGROUND ATMOSPHERE
   ========================== */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const sporeField = document.querySelector('#spores');
  const glitchEl = document.querySelector('#glitch-sweep');
  const anomalyEl = document.querySelector('#anomaly-flare');

  // Cap concurrent spores so the DOM/paint cost can't creep up if a tab is left open a long
  // time (previously spawned on a fixed 550ms timer with no ceiling, regardless of how many
  // were already alive and animating with a glow effect).
  const MAX_SPORES = 28;

  function spawnSpore() {
    if (!sporeField) return;
    if (sporeField.childElementCount >= MAX_SPORES) return;
    const spore = document.createElement('div');
    spore.className = 'spore';
    const duration = 9 + Math.random() * 8;
    const drift = (Math.random() * 60 - 30).toFixed(0);
    spore.style.left = `${Math.random() * 100}%`;
    spore.style.setProperty('--drift', `${drift}px`);
    spore.style.animationDuration = `${duration}s`;
    sporeField.append(spore);
    setTimeout(() => spore.remove(), duration * 1000);
  }
  setInterval(spawnSpore, 550);
  for (let i = 0; i < 10; i++) setTimeout(spawnSpore, i * 300);

  function triggerGlitch() {
    if (!glitchEl) return;
    glitchEl.classList.remove('active');
    void glitchEl.offsetWidth;
    glitchEl.classList.add('active');
  }
  function scheduleGlitch() {
    const delay = 5000 + Math.random() * 9000;
    setTimeout(() => { triggerGlitch(); scheduleGlitch(); }, delay);
  }
  scheduleGlitch();

  function triggerAnomaly() {
    if (!anomalyEl) return;
    anomalyEl.classList.remove('active');
    void anomalyEl.offsetWidth;
    anomalyEl.classList.add('active');
  }
  function scheduleAnomaly() {
    const delay = 26000 + Math.random() * 34000;
    setTimeout(() => { triggerAnomaly(); scheduleAnomaly(); }, delay);
  }
  scheduleAnomaly();

  // Pause all the ambient effects (spores, flicker sweeps) while the tab is in the background —
  // there's no visual reason to keep animating and burning CPU/battery for a page nobody is
  // looking at.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      mainVideo?.pause();
    } else if (inspector.hidden) {
      mainVideo?.play?.();
    }
  });
})();
