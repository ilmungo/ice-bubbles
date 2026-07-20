import { isLedgerStep } from './staffDisplay.js';

// Renders selected "bubbles" as soft white circles snapped to the nearest
// line/space of whichever stave a point falls over. Tapping an existing
// circle (same stave, same snapped pitch, close by horizontally) removes
// it instead of adding another, so a bubble toggles on/off.
export function attachNoteMarkers(staffContainer, geometry) {
  const layer = document.createElement('div');
  layer.className = 'note-marker-layer';
  staffContainer.appendChild(layer);

  const placed = [];

  function placeMarkerAtPoint(clientX, clientY) {
    const box = contentBox(staffContainer, geometry);
    const nativeX = (clientX - box.contentLeft) / box.scale;
    const nativeY = (clientY - box.contentTop) / box.scale;

    const staveIndex = geometry.staves.findIndex(
      (s) => nativeX >= s.xStart && nativeX <= s.xEnd && nativeY >= s.yTop && nativeY <= s.yBottom
    );
    if (staveIndex === -1) return;

    const stave = geometry.staves[staveIndex];
    const step = stave.stepAt(nativeY);

    const existingIndex = placed.findIndex(
      (m) => m.staveIndex === staveIndex && m.step === step && Math.abs(m.nativeX - nativeX) <= geometry.spaceHeight
    );
    if (existingIndex !== -1) {
      const [removed] = placed.splice(existingIndex, 1);
      removed.el.remove();
      removed.ledgerEl?.remove();
      return;
    }

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

    let ledger = null;
    if (isLedgerStep(step)) {
      ledger = document.createElement('div');
      ledger.className = 'note-marker-ledger';
      ledger.style.left = left;
      ledger.style.top = top;
      ledger.style.width = `${noteheadSize * 1.5}px`;
      layer.appendChild(ledger);
    }

    placed.push({ nativeX, staveIndex, step, el: marker, ledgerEl: ledger });
  }

  function getNotes() {
    return placed.map(({ nativeX, staveIndex, step }) => ({ nativeX, staveIndex, step }));
  }

  return { placeMarkerAtPoint, getNotes };
}

// The SVG's default `preserveAspectRatio="xMidYMid meet"` can letterbox
// its drawing inside the element's own box whenever the CSS-rendered box
// doesn't share the SVG's native aspect ratio (which happens once the
// viewport is narrow enough to shrink it). This locates the actual drawn
// content rectangle so hit-testing and marker placement both line up with
// what's really on screen rather than the outer (possibly letterboxed) box.
export function contentBox(staffContainer, geometry) {
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
