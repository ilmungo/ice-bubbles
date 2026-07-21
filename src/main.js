import './style.css';
import { renderStaves } from './staffDisplay.js';
import { setupImageOverlay } from './imageOverlay.js';
import { attachNoteMarkers } from './noteMarkers.js';
import { attachScrubber } from './scrubber.js';
import { attachStaveMute } from './staveMute.js';
import { play, pause, isPlaying, setDuration, durationForSpeedValue } from './playback.js';
import { detectBubbles } from './bubbleDetector.js';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <div id="staff"></div>
    <div class="controls">
      <div class="controls-row">
        <label for="image-input" class="file-label">Choose Image</label>
        <input type="file" id="image-input" accept="image/*" hidden />
        <button id="detect-bubbles" type="button">Detect Bubbles</button>
        <label id="sensitivity-label" for="sensitivity">Sensitivity <span id="sensitivity-value">50</span></label>
        <input type="range" id="sensitivity" min="0" max="100" value="50" />
      </div>
      <div class="controls-row">
        <button id="play-pause" type="button">Play</button>
        <label id="speed-label" for="speed">Speed</label>
        <input type="range" id="speed" min="0" max="100" value="50" />
        <span id="status"></span>
      </div>
    </div>
  </div>
`;

const staffEl = document.querySelector('#staff');
const geometry = renderStaves(staffEl);
const { placeMarkerAtPoint, getNotes, clearAutoNotes } = attachNoteMarkers(staffEl, geometry);
const setScrubberFraction = attachScrubber(staffEl, geometry);
const { isMuted } = attachStaveMute(staffEl, geometry);

const { getImage } = setupImageOverlay(document.querySelector('#image-input'), { onTap: placeMarkerAtPoint });

const playButton = document.querySelector('#play-pause');
const detectButton = document.querySelector('#detect-bubbles');
const sensitivitySlider = document.querySelector('#sensitivity');
const sensitivityValue = document.querySelector('#sensitivity-value');
const speedSlider = document.querySelector('#speed');
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

speedSlider.addEventListener('input', () => {
  setDuration(durationForSpeedValue(Number(speedSlider.value)));
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
    isMuted,
    onProgress: setScrubberFraction,
    onDone: () => {
      playButton.textContent = 'Play';
      setScrubberFraction(null);
    },
    onError: () => {
      playButton.textContent = 'Play';
      setScrubberFraction(null);
    },
  });
});
