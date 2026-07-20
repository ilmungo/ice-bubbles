import { Renderer, Stave } from 'vexflow';

// Three stacked staves, one per clef. Besides drawing them, this returns
// the geometry needed to snap an arbitrary point to a valid note position.
const CLEFS = ['treble', 'alto', 'bass'];

const STAVE_X = 20;
const STAVE_WIDTH = 700;
const FIRST_STAVE_Y = 40;
const STAVE_SPACING = 100;
const SCALE = 1.3;

// Diatonic step positions relative to a stave's bottom line (step 0) up to
// its top line (step 8) — one step per line/space. Two extra ledger lines
// are selectable on each side: steps 9-12 above, -1 to -4 below.
export const MIN_STEP = -4;
export const MAX_STEP = 12;

export function isLedgerStep(step) {
  return step % 2 === 0 && (step < 0 || step > 8);
}

export function renderStaves(container) {
  container.innerHTML = '';

  const width = STAVE_WIDTH + STAVE_X * 2;
  const height = FIRST_STAVE_Y + STAVE_SPACING * (CLEFS.length - 1) + 100;
  const nativeWidth = width * SCALE;
  const nativeHeight = height * SCALE;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(nativeWidth, nativeHeight);
  const context = renderer.getContext();
  context.scale(SCALE, SCALE);

  let spaceHeight;
  const staves = CLEFS.map((clef, index) => {
    const stave = new Stave(STAVE_X, FIRST_STAVE_Y + index * STAVE_SPACING, STAVE_WIDTH);
    stave.addClef(clef);
    stave.setContext(context).draw();
    spaceHeight = stave.getSpacingBetweenLines() * SCALE;
    return staveGeometry(stave);
  });

  return { nativeWidth, nativeHeight, spaceHeight, staves };
}

// Coordinates below are in "native" pixel space — i.e. already multiplied
// by SCALE, matching the renderer's actual (pre-CSS-scaling) pixel size.
function staveGeometry(stave) {
  const bottomLineY = stave.getYForLine(4);
  const halfSpacing = stave.getSpacingBetweenLines() / 2;
  const yForStep = (step) => (bottomLineY - step * halfSpacing) * SCALE;

  return {
    xStart: stave.getX() * SCALE,
    xEnd: (stave.getX() + stave.getWidth()) * SCALE,
    yTop: yForStep(MAX_STEP),
    yBottom: yForStep(MIN_STEP),
    yForStep,
    stepAt(y) {
      const step = Math.round((bottomLineY - y / SCALE) / halfSpacing);
      return Math.min(MAX_STEP, Math.max(MIN_STEP, step));
    },
  };
}
