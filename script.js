// ===== CASE CONFIGURATION =====
// Change this number to the correct number of birds in duolingo.png.
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
const openInspector = document.getElementById('open-inspector');
const inspector = document.getElementById('image-inspector');
const closeInspector = document.getElementById('close-inspector');
const zoomStage = document.getElementById('zoom-stage');
const zoomImage = document.getElementById('zoom-image');
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
    message.textContent = 'COUNT VERIFIED // CLEARANCE GRANTED';
    message.classList.remove('denied');
    inputModule.classList.add('verified');
    labLink.hidden = false;
    keypad.setAttribute('aria-disabled', 'true');
  } else {
    message.textContent = 'ACCESS DENIED // RECOUNT EXHIBIT A';
    message.classList.remove('denied');
    void message.offsetWidth; // Restart the flash animation on repeated attempts.
    message.classList.add('denied');
  }
}

// Inspection mode supports mouse wheel, buttons, dragging, and genuine two-finger pinch zoom.
openInspector.addEventListener('click', () => {
  inspector.hidden = false;
  resetView();
  closeInspector.focus();
});
closeInspector.addEventListener('click', () => { inspector.hidden = true; });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') inspector.hidden = true;
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
function updateTransform() { zoomImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; }
