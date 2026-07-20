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
      <button id="play-pause" type="button">Play</button>
      <span id="status"></span>
    </div>
    <div id="staff"></div>
  </div>
`;

const staffEl = document.querySelector('#staff');
const geometry = renderStaves(staffEl);
const { placeMarkerAtPoint, getNotes } = attachNoteMarkers(staffEl, geometry);
const setScrubberFraction = attachScrubber(staffEl, geometry);

const { getImage } = setupImageOverlay(document.querySelector('#image-input'), { onTap: placeMarkerAtPoint });

const playButton = document.querySelector('#play-pause');
const detectButton = document.querySelector('#detect-bubbles');
const statusEl = document.querySelector('#status');

detectButton.addEventListener('click', () => {
  const img = getImage();
  if (!img) {
    statusEl.textContent = 'Load an image first';
    return;
  }

  const bubbles = detectBubbles(img);
  const rect = img.getBoundingClientRect();
  for (const bubble of bubbles) {
    const clientX = rect.left + (bubble.x / img.naturalWidth) * rect.width;
    const clientY = rect.top + (bubble.y / img.naturalHeight) * rect.height;
    placeMarkerAtPoint(clientX, clientY, { toggle: false });
  }
  statusEl.textContent = `Detected ${bubbles.length} bubble${bubbles.length === 1 ? '' : 's'}`;
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
