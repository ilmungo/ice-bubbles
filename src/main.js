import './style.css';
import { renderStaves } from './staffDisplay.js';
import { setupImageOverlay } from './imageOverlay.js';
import { attachNoteMarkers } from './noteMarkers.js';
import { attachScrubber } from './scrubber.js';
import { play, pause, isPlaying } from './playback.js';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <div class="controls">
      <input type="file" id="image-input" accept="image/*" />
      <button id="play-pause" type="button">Play</button>
    </div>
    <div id="staff"></div>
  </div>
`;

const staffEl = document.querySelector('#staff');
const geometry = renderStaves(staffEl);
const { placeMarkerAtPoint, getNotes } = attachNoteMarkers(staffEl, geometry);
const setScrubberFraction = attachScrubber(staffEl, geometry);

setupImageOverlay(document.querySelector('#image-input'), { onTap: placeMarkerAtPoint });

const playButton = document.querySelector('#play-pause');
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
  });
});
