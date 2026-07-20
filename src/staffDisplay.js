import { Renderer, Stave } from 'vexflow';

// Three stacked staves, one per clef, with no notes — a static display only.
const CLEFS = ['treble', 'alto', 'bass'];

const STAVE_X = 20;
const STAVE_WIDTH = 700;
const FIRST_STAVE_Y = 40;
const STAVE_SPACING = 140;

export function renderStaves(container) {
  container.innerHTML = '';

  const width = STAVE_WIDTH + STAVE_X * 2;
  const height = FIRST_STAVE_Y + STAVE_SPACING * (CLEFS.length - 1) + 100;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();

  CLEFS.forEach((clef, index) => {
    const stave = new Stave(STAVE_X, FIRST_STAVE_Y + index * STAVE_SPACING, STAVE_WIDTH);
    stave.addClef(clef);
    stave.setContext(context).draw();
  });
}
