// ===== CASE CONFIGURATION =====
// Change this number to the correct number of birds in duolingo.png.
// Keep it as a number (not quotation marks), for example: const CORRECT_BIRD_COUNT = 12;
const CORRECT_BIRD_COUNT = 0;

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
let answer = '';
let unlocked = false;

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
