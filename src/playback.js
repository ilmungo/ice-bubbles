import * as Tone from 'tone';

const DURATION_SECONDS = 6;

let synthsByStave = null;
let part = null;
let rafId = null;
let needsRebuild = true;

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
// Freshness is tracked with an explicit flag rather than checking
// `Transport.seconds === 0` — resetting seconds after stop() doesn't
// always land on an exact 0 (floating-point drift in the seconds/ticks
// conversion), so that check could skip rebuilding and play silently.
// Completion is likewise detected from the same rAF loop that drives the
// scrubber, rather than a Transport-scheduled callback stopping the
// Transport from inside its own clock.
export function play(notes, { onProgress, onDone, onError } = {}) {
  (async () => {
    try {
      await Tone.start();

      if (needsRebuild) {
        part?.dispose();
        part = new Tone.Part((time, note) => {
          synthFor(note.staveIndex).triggerAttackRelease(note.toneNote, '8n', time);
        }, notes.map((note) => [note.time * DURATION_SECONDS, note])).start(0);
        needsRebuild = false;
      }

      Tone.Transport.start();

      function tick() {
        const fraction = Tone.Transport.seconds / DURATION_SECONDS;
        if (fraction >= 1) {
          stop();
          onDone?.();
          return;
        }
        onProgress?.(fraction);
        if (isPlaying()) rafId = requestAnimationFrame(tick);
      }
      tick();
    } catch (err) {
      onError?.(err);
    }
  })();
}

export function audioContextState() {
  return Tone.getContext().state;
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
  needsRebuild = true;
}
