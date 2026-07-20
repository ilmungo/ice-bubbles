import './style.css';
import { renderStaves } from './staffDisplay.js';
import { setupImageOverlay } from './imageOverlay.js';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <input type="file" id="image-input" accept="image/*" />
    <div id="staff"></div>
  </div>
`;

renderStaves(document.querySelector('#staff'));
setupImageOverlay(document.querySelector('#image-input'));
