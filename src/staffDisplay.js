import { Renderer, Stave } from 'vexflow';

// Three stacked staves, one per clef. Besides drawing them, this returns
// the geometry needed to snap an arbitrary point to a valid note position
// and to convert that position to the right pitch for its clef.
const CLEFS = ['treble', 'alto', 'bass'];

// The bottom-line pitch for each clef, in scientific pitch notation.
const CLEF_BOTTOM_LINE = { treble: 'E4', alto: 'F3', bass: 'G2' };

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
    return staveGeometry(stave, clef);
  });

  return {
    nativeWidth,
    nativeHeight,
    spaceHeight,
    xStart: staves[0].xStart,
    xEnd: staves[0].xEnd,
    staves,
  };
}

// Coordinates below are in "native" pixel space — i.e. already multiplied
// by SCALE, matching the renderer's actual (pre-CSS-scaling) pixel size.
function staveGeometry(stave, clef) {
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
    noteAt(step) {
      return noteAtStep(CLEF_BOTTOM_LINE[clef], step);
    },
  };
}

// Natural notes only, in scientific pitch notation order; octave increments
// right after B, at C — e.g. ...A3, B3, C4, D4... — so a note's position in
// this cycle is a single monotonic index (octave * 7 + letter index).
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function noteAtStep(rootNote, step) {
  const rootLetter = rootNote[0];
  const rootOctave = Number(rootNote.slice(1));
  const index = rootOctave * 7 + LETTERS.indexOf(rootLetter) + step;
  const octave = Math.floor(index / 7);
  const letter = LETTERS[((index % 7) + 7) % 7];
  return `${letter}${octave}`;
}
