import './style.css';
import { renderStaves } from './staffDisplay.js';

document.querySelector('#app').innerHTML = `
  <div class="app">
    <div id="staff"></div>
  </div>
`;

renderStaves(document.querySelector('#staff'));
