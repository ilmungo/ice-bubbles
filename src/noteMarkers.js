import { isLedgerStep } from './staffDisplay.js';

// Renders selected "bubbles" as soft white circles snapped to the nearest
// line/space of whichever stave a point falls over, positioned by
// percentage so they stay aligned regardless of any CSS scaling of the
// staff SVG. Returns a function that does the hit-test + placement for a
// given viewport point; a no-op if the point isn't over any stave.
export function attachNoteMarkers(staffContainer, geometry) {
  const layer = document.createElement('div');
  layer.className = 'note-marker-layer';
  staffContainer.appendChild(layer);

  return function placeMarkerAtPoint(clientX, clientY) {
    const rect = staffContainer.getBoundingClientRect();
    const nativeX = ((clientX - rect.left) / rect.width) * geometry.nativeWidth;
    const nativeY = ((clientY - rect.top) / rect.height) * geometry.nativeHeight;

    const stave = geometry.staves.find(
      (s) => nativeX >= s.xStart && nativeX <= s.xEnd && nativeY >= s.yTop && nativeY <= s.yBottom
    );
    if (!stave) return;

    const step = stave.stepAt(nativeY);
    const left = `${(nativeX / geometry.nativeWidth) * 100}%`;
    const top = `${(stave.yForStep(step) / geometry.nativeHeight) * 100}%`;

    const marker = document.createElement('div');
    marker.className = 'note-marker';
    marker.style.left = left;
    marker.style.top = top;
    layer.appendChild(marker);

    if (isLedgerStep(step)) {
      const ledger = document.createElement('div');
      ledger.className = 'note-marker-ledger';
      ledger.style.left = left;
      ledger.style.top = top;
      layer.appendChild(ledger);
    }
  };
}
