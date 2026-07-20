import { contentBox } from './noteMarkers.js';

// A vertical line spanning the staff that sweeps left-to-right during
// playback. Returns a function to move it: a fraction in [0, 1] across the
// shared note x-range, or null to hide it.
export function attachScrubber(staffContainer, geometry) {
  const layer = document.createElement('div');
  layer.className = 'scrubber-layer';
  staffContainer.appendChild(layer);

  const line = document.createElement('div');
  line.className = 'scrubber-line';
  line.style.display = 'none';
  layer.appendChild(line);

  return function setScrubberFraction(fraction) {
    if (fraction === null) {
      line.style.display = 'none';
      return;
    }
    const box = contentBox(staffContainer, geometry);
    const nativeX = geometry.xStart + fraction * (geometry.xEnd - geometry.xStart);
    line.style.left = `${box.offsetLeft + nativeX * box.scale}px`;
    line.style.display = 'block';
  };
}
