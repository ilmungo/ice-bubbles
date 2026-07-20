import { isLedgerStep } from './staffDisplay.js';

// Renders selected "bubbles" as soft white circles snapped to the nearest
// line/space of whichever stave a point falls over. Returns a function
// that does the hit-test + placement for a given viewport point; a no-op
// if the point isn't over any stave.
export function attachNoteMarkers(staffContainer, geometry) {
  const layer = document.createElement('div');
  layer.className = 'note-marker-layer';
  staffContainer.appendChild(layer);

  return function placeMarkerAtPoint(clientX, clientY) {
    const box = contentBox(staffContainer, geometry);
    const nativeX = (clientX - box.contentLeft) / box.scale;
    const nativeY = (clientY - box.contentTop) / box.scale;

    const stave = geometry.staves.find(
      (s) => nativeX >= s.xStart && nativeX <= s.xEnd && nativeY >= s.yTop && nativeY <= s.yBottom
    );
    if (!stave) return;

    const step = stave.stepAt(nativeY);
    const left = `${box.offsetLeft + nativeX * box.scale}px`;
    const top = `${box.offsetTop + stave.yForStep(step) * box.scale}px`;
    const noteheadSize = geometry.spaceHeight * box.scale;

    const marker = document.createElement('div');
    marker.className = 'note-marker';
    marker.style.left = left;
    marker.style.top = top;
    marker.style.width = `${noteheadSize}px`;
    marker.style.height = `${noteheadSize}px`;
    layer.appendChild(marker);

    if (isLedgerStep(step)) {
      const ledger = document.createElement('div');
      ledger.className = 'note-marker-ledger';
      ledger.style.left = left;
      ledger.style.top = top;
      ledger.style.width = `${noteheadSize * 1.5}px`;
      layer.appendChild(ledger);
    }
  };
}

// The SVG's default `preserveAspectRatio="xMidYMid meet"` can letterbox
// its drawing inside the element's own box whenever the CSS-rendered box
// doesn't share the SVG's native aspect ratio (which happens once the
// viewport is narrow enough to shrink it). This locates the actual drawn
// content rectangle so hit-testing and marker placement both line up with
// what's really on screen rather than the outer (possibly letterboxed) box.
function contentBox(staffContainer, geometry) {
  const rect = staffContainer.getBoundingClientRect();
  const scale = Math.min(rect.width / geometry.nativeWidth, rect.height / geometry.nativeHeight);
  const offsetLeft = (rect.width - geometry.nativeWidth * scale) / 2;
  const offsetTop = (rect.height - geometry.nativeHeight * scale) / 2;

  return {
    contentLeft: rect.left + offsetLeft,
    contentTop: rect.top + offsetTop,
    offsetLeft,
    offsetTop,
    scale,
  };
}
