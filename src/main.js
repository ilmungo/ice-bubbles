import './style.css';
import { createEmptyScore, placeImage, clearSlot, isEmpty, SLOT_COUNT } from './score.js';
import { PALETTE, getPaletteImage } from './imagePalette.js';
import { renderStaff } from './staffView.js';
import { playScore, stopScore } from './audioEngine.js';

let score = createEmptyScore();
let selectedImageId = PALETTE[0].id;
let isPlaying = false;
let geometry = null;

document.querySelector('#app').innerHTML = `
  <div class="app">
    <h1>Ice Bubbles</h1>
    <p class="hint">
      Pick an image below, then click (or drag it) onto the staff to place a note.
      Click a placed image with nothing selected to remove it.
    </p>
    <div class="palette" id="palette"></div>
    <div class="staff-wrap">
      <div class="staff" id="staff"></div>
      <div class="overlay" id="overlay"></div>
    </div>
    <div class="controls">
      <button id="play" type="button">Play</button>
      <button id="clear" type="button">Clear</button>
    </div>
  </div>
`;

const paletteEl = document.querySelector('#palette');
const staffEl = document.querySelector('#staff');
const overlayEl = document.querySelector('#overlay');
const playBtn = document.querySelector('#play');
const clearBtn = document.querySelector('#clear');

function renderPalette() {
  paletteEl.innerHTML = '';
  for (const image of PALETTE) {
    const el = document.createElement('img');
    el.src = image.url;
    el.alt = image.label;
    el.title = image.label;
    el.draggable = true;
    el.className = `palette-image${image.id === selectedImageId ? ' selected' : ''}`;
    el.addEventListener('click', () => {
      selectedImageId = image.id;
      renderPalette();
    });
    el.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', image.id);
    });
    paletteEl.appendChild(el);
  }
}

function renderStaffAndOverlay() {
  geometry = renderStaff(staffEl, score);
  overlayEl.style.width = `${geometry.width}px`;
  overlayEl.style.height = `${geometry.height}px`;

  overlayEl.innerHTML = '';
  for (let index = 0; index < SLOT_COUNT; index += 1) {
    const guide = document.createElement('div');
    guide.className = 'slot-guide';
    guide.style.left = `${geometry.slotCenterX(index)}px`;
    overlayEl.appendChild(guide);
  }

  score.forEach((slot, index) => {
    if (!slot) return;
    const image = getPaletteImage(slot.imageId);
    const el = document.createElement('img');
    el.src = image.url;
    el.className = 'placed-image';
    el.dataset.slotIndex = String(index);
    el.style.left = `${geometry.slotCenterX(index)}px`;
    el.style.top = `${geometry.yForStep(slot.step)}px`;
    overlayEl.appendChild(el);
  });
}

function placeAt(clientX, clientY, imageId) {
  const rect = staffEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const slotIndex = geometry.slotAt(x);
  const step = geometry.stepAt(y);

  if (score[slotIndex] && !imageId) {
    score = clearSlot(score, slotIndex);
  } else {
    score = placeImage(score, slotIndex, step, imageId ?? selectedImageId);
  }
  renderStaffAndOverlay();
}

overlayEl.addEventListener('click', (event) => {
  if (isPlaying) return;
  placeAt(event.clientX, event.clientY);
});

overlayEl.addEventListener('dragover', (event) => {
  event.preventDefault();
});

overlayEl.addEventListener('drop', (event) => {
  event.preventDefault();
  if (isPlaying) return;
  const imageId = event.dataTransfer.getData('text/plain');
  placeAt(event.clientX, event.clientY, imageId || undefined);
});

function highlightSlot(index) {
  overlayEl.querySelectorAll('.placed-image').forEach((el) => {
    el.classList.toggle('active', Number(el.dataset.slotIndex) === index);
  });
}

playBtn.addEventListener('click', async () => {
  if (isPlaying || isEmpty(score)) return;
  isPlaying = true;
  playBtn.disabled = true;
  playBtn.textContent = 'Playing…';

  await playScore(score, { onSlot: highlightSlot });

  highlightSlot(-1);
  isPlaying = false;
  playBtn.disabled = false;
  playBtn.textContent = 'Play';
});

clearBtn.addEventListener('click', () => {
  stopScore();
  score = createEmptyScore();
  renderStaffAndOverlay();
});

renderPalette();
renderStaffAndOverlay();
