import { contentBox } from './noteMarkers.js';

// Clicking a stave's clef mutes/unmutes just that voice — deliberately a
// narrow target (the clef's own width, not the whole stave) so it never
// competes with tapping the image to place notes across that same stave.
export function attachStaveMute(staffContainer, geometry) {
  const layer = document.createElement('div');
  layer.className = 'stave-mute-layer';
  staffContainer.appendChild(layer);

  const muted = geometry.staves.map(() => false);

  geometry.staves.forEach((stave, staveIndex) => {
    const tint = document.createElement('div');
    tint.className = 'stave-mute-tint';
    layer.appendChild(tint);

    const hitZone = document.createElement('div');
    hitZone.className = 'stave-mute-hitzone';
    hitZone.title = 'Click to mute/unmute this staff';
    hitZone.addEventListener('click', () => {
      muted[staveIndex] = !muted[staveIndex];
      tint.classList.toggle('is-muted', muted[staveIndex]);
    });
    layer.appendChild(hitZone);

    positionZone(staffContainer, geometry, stave, tint, stave.xStart, stave.xEnd);
    positionZone(staffContainer, geometry, stave, hitZone, stave.clefXStart, stave.clefXEnd);
  });

  return {
    isMuted(staveIndex) {
      return muted[staveIndex];
    },
  };
}

function positionZone(staffContainer, geometry, stave, el, nativeXStart, nativeXEnd) {
  const box = contentBox(staffContainer, geometry);
  el.style.left = `${box.offsetLeft + nativeXStart * box.scale}px`;
  el.style.top = `${box.offsetTop + stave.yTop * box.scale}px`;
  el.style.width = `${(nativeXEnd - nativeXStart) * box.scale}px`;
  el.style.height = `${(stave.yBottom - stave.yTop) * box.scale}px`;
}
