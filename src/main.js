import './style.css';
import { renderStaves } from './staffDisplay.js';
import { setupImageOverlay } from './imageOverlay.js';
import { attachNoteMarkers } from './noteMarkers.js';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <input type="file" id="image-input" accept="image/*" />
    <div id="staff"></div>
  </div>
`;

const staffEl = document.querySelector('#staff');
const geometry = renderStaves(staffEl);
const placeMarkerAtPoint = attachNoteMarkers(staffEl, geometry);

setupImageOverlay(document.querySelector('#image-input'), { onTap: placeMarkerAtPoint });
