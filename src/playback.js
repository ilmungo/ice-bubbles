import * as Tone from 'tone';

const DURATION_SECONDS = 6;

let synthsByStave = null;
let part = null;
let rafId = null;

function synthFor(staveIndex) {
  if (!synthsByStave) synthsByStave = [];
  if (!synthsByStave[staveIndex]) synthsByStave[staveIndex] = new Tone.PolySynth(Tone.Synth).toDestination();
  return synthsByStave[staveIndex];
}

export function isPlaying() {
  return Tone.Transport.state === 'started';
}

// `notes` is [{ time, toneNote, staveIndex }], `time` a fraction in [0, 1]
// across the fixed playback duration. Resumes in place if paused;
// (re)builds the schedule from `notes` if starting fresh from the top.
export function play(notes, { onProgress, onDone } = {}) {
  (async () => {
    await Tone.start();

    if (Tone.Transport.seconds === 0) {
      part?.dispose();
      part = new Tone.Part((time, note) => {
        synthFor(note.staveIndex).triggerAttackRelease(note.toneNote, '8n', time);
      }, notes.map((note) => [note.time * DURATION_SECONDS, note])).start(0);

      Tone.Transport.scheduleOnce(() => {
        stop();
        onDone?.();
      }, DURATION_SECONDS);
    }

    Tone.Transport.start();

    function tick() {
      onProgress?.(Math.min(1, Tone.Transport.seconds / DURATION_SECONDS));
      if (isPlaying()) rafId = requestAnimationFrame(tick);
    }
    tick();
  })();
}

export function pause() {
  Tone.Transport.pause();
  cancelAnimationFrame(rafId);
}

export function stop() {
  Tone.Transport.stop();
  Tone.Transport.seconds = 0;
  cancelAnimationFrame(rafId);
  part?.dispose();
  part = null;
}
