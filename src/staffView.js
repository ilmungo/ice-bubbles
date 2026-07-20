import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';
import { SLOT_COUNT } from './score.js';

// Natural (no-accidental) pitches spanning one ledger line below the staff
// to one ledger line above it. `step` is the diatonic distance from the
// bottom staff line (E4 = step 0); each step is half a line's spacing.
const PITCH_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'];
const BOTTOM_LINE_INDEX = PITCH_NAMES.indexOf('E4');

export const MIN_STEP = -BOTTOM_LINE_INDEX;
export const MAX_STEP = PITCH_NAMES.length - 1 - BOTTOM_LINE_INDEX;

export function stepToPitchName(step) {
  return PITCH_NAMES[step + BOTTOM_LINE_INDEX];
}

function stepToKey(step) {
  const name = stepToPitchName(step);
  return `${name[0].toLowerCase()}/${name.slice(1)}`;
}

export function stepToToneNote(step) {
  const name = stepToPitchName(step);
  return `${name[0]}${name.slice(1)}`;
}

const STAVE_X = 20;
const STAVE_Y = 40;
const SLOT_PX = 90;
const REST_KEY = 'b/4';

// Renders the staff into `container` for the given score, and returns the
// geometry needed to translate pointer coordinates <-> (slot, pitch step).
export function renderStaff(container, score) {
  container.innerHTML = '';

  const width = SLOT_COUNT * SLOT_PX + 100;
  const height = 220;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();

  const stave = new Stave(STAVE_X, STAVE_Y, width - STAVE_X * 2);
  stave.addClef('treble').addTimeSignature(`${SLOT_COUNT}/4`);
  stave.setContext(context).draw();

  const notes = score.map((slot) =>
    slot
      ? new StaveNote({ keys: [stepToKey(slot.step)], duration: 'q' })
      : new StaveNote({ keys: [REST_KEY], duration: 'qr' })
  );

  const voice = new Voice({ numBeats: SLOT_COUNT, beatValue: 4 });
  voice.setStrict(false);
  voice.addTickables(notes);
  new Formatter().joinVoices([voice]).format([voice], width - (stave.getNoteStartX() - STAVE_X) - 60);
  voice.draw(context, stave);

  const bottomLineY = stave.getYForLine(4);
  const halfSpacing = stave.getSpacingBetweenLines() / 2;
  const noteStartX = stave.getNoteStartX();
  const noteEndX = stave.getNoteEndX();
  const slotWidth = (noteEndX - noteStartX) / SLOT_COUNT;

  return {
    context,
    notes,
    width,
    height,
    slotAt(x) {
      const index = Math.floor((x - noteStartX) / slotWidth);
      return Math.min(SLOT_COUNT - 1, Math.max(0, index));
    },
    stepAt(y) {
      const step = Math.round((bottomLineY - y) / halfSpacing);
      return Math.min(MAX_STEP, Math.max(MIN_STEP, step));
    },
    slotCenterX(index) {
      return noteStartX + slotWidth * (index + 0.5);
    },
    yForStep(step) {
      return bottomLineY - step * halfSpacing;
    },
  };
}
