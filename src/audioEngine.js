import * as Tone from 'tone';
import { SLOT_COUNT } from './score.js';
import { getPaletteImage } from './imagePalette.js';
import { stepToToneNote } from './staffView.js';

const synthsByOscillator = new Map();

function synthFor(oscillator) {
  let synth = synthsByOscillator.get(oscillator);
  if (!synth) {
    synth = new Tone.Synth({ oscillator: { type: oscillator } }).toDestination();
    synthsByOscillator.set(oscillator, synth);
  }
  return synth;
}

let sequence = null;

export async function playScore(score, { onSlot } = {}) {
  await Tone.start();
  stopScore();

  Tone.Transport.bpm.value = 100;
  sequence = new Tone.Sequence(
    (time, index) => {
      const slot = score[index];
      if (slot) {
        const image = getPaletteImage(slot.imageId);
        synthFor(image.oscillator).triggerAttackRelease(stepToToneNote(slot.step), '8n', time);
      }
      if (onSlot) {
        Tone.Draw.schedule(() => onSlot(index), time);
      }
    },
    Array.from({ length: SLOT_COUNT }, (_, i) => i),
    '4n'
  );
  sequence.loop = false;
  sequence.start(0);
  Tone.Transport.start();

  return new Promise((resolve) => {
    Tone.Transport.scheduleOnce(() => {
      stopScore();
      resolve();
    }, `+${SLOT_COUNT * Tone.Time('4n').toSeconds()}`);
  });
}

export function stopScore() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  if (sequence) {
    sequence.dispose();
    sequence = null;
  }
}
