import './style.css';
import { renderStaves } from './staffDisplay.js';
import { setupImageOverlay } from './imageOverlay.js';
import { attachNoteMarkers } from './noteMarkers.js';
import { attachScrubber } from './scrubber.js';
import { play, pause, isPlaying, audioContextState } from './playback.js';
import { detectBubbles } from './bubbleDetector.js';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <div class="controls">
      <input type="file" id="image-input" accept="image/*" />
      <button id="detect-bubbles" type="button">Detect Bubbles</button>
      <label id="sensitivity-label" for="sensitivity">Sensitivity <span id="sensitivity-value">50</span></label>
      <input type="range" id="sensitivity" min="0" max="100" value="50" />
      <button id="play-pause" type="button">Play</button>
      <span id="status"></span>
    </div>
    <div id="staff"></div>
  </div>
`;

const staffEl = document.querySelector('#staff');
const geometry = renderStaves(staffEl);
const { placeMarkerAtPoint, getNotes, clearAutoNotes } = attachNoteMarkers(staffEl, geometry);
const setScrubberFraction = attachScrubber(staffEl, geometry);

const { getImage } = setupImageOverlay(document.querySelector('#image-input'), { onTap: placeMarkerAtPoint });

const playButton = document.querySelector('#play-pause');
const detectButton = document.querySelector('#detect-bubbles');
const sensitivitySlider = document.querySelector('#sensitivity');
const sensitivityValue = document.querySelector('#sensitivity-value');
const statusEl = document.querySelector('#status');

function runDetection() {
  const img = getImage();
  if (!img) {
    statusEl.textContent = 'Load an image first';
    return;
  }

  clearAutoNotes();
  const bubbles = detectBubbles(img, Number(sensitivitySlider.value));
  const rect = img.getBoundingClientRect();
  for (const bubble of bubbles) {
    const clientX = rect.left + (bubble.x / img.naturalWidth) * rect.width;
    const clientY = rect.top + (bubble.y / img.naturalHeight) * rect.height;
    placeMarkerAtPoint(clientX, clientY, { toggle: false, source: 'auto' });
  }
  statusEl.textContent = `Detected ${bubbles.length} bubble${bubbles.length === 1 ? '' : 's'}`;
}

detectButton.addEventListener('click', runDetection);
sensitivitySlider.addEventListener('input', () => {
  sensitivityValue.textContent = sensitivitySlider.value;
  if (getImage()) runDetection();
});

playButton.addEventListener('click', () => {
  if (isPlaying()) {
    pause();
    playButton.textContent = 'Play';
    return;
  }

  const notes = getNotes().map(({ nativeX, staveIndex, step }) => ({
    time: (nativeX - geometry.xStart) / (geometry.xEnd - geometry.xStart),
    toneNote: geometry.staves[staveIndex].noteAt(step),
    staveIndex,
  }));

  playButton.textContent = 'Pause';
  play(notes, {
    onProgress: setScrubberFraction,
    onDone: () => {
      playButton.textContent = 'Play';
      setScrubberFraction(null);
    },
    onError: (err) => {
      playButton.textContent = 'Play';
      setScrubberFraction(null);
      statusEl.textContent = `Error: ${err?.message ?? err}`;
    },
  });

  setTimeout(() => {
    statusEl.textContent = `audio: ${audioContextState()}, notes: ${notes.length}`;
  }, 200);
});
