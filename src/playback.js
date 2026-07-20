import * as Tone from 'tone';

const DEFAULT_DURATION_SECONDS = 6;

let durationSeconds = DEFAULT_DURATION_SECONDS;
let synthsByStave = null;
let part = null;
let rafId = null;
let needsRebuild = true;

// Maps a 0-100 speed slider to a playback duration, with 50 landing exactly
// on the default speed and the ends roughly 2.5x slower/faster than that.
export function durationForSpeedValue(value) {
  const v = Math.min(100, Math.max(0, value));
  if (v <= 50) return DEFAULT_DURATION_SECONDS * 2.5 + (v / 50) * (DEFAULT_DURATION_SECONDS - DEFAULT_DURATION_SECONDS * 2.5);
  return DEFAULT_DURATION_SECONDS + ((v - 50) / 50) * (DEFAULT_DURATION_SECONDS / 2.5 - DEFAULT_DURATION_SECONDS);
}

// Takes effect on the next fresh play() (i.e. after a full stop, not a
// resume from pause) — changing speed mid-playback doesn't retroactively
// rescale notes already scheduled against the old duration.
export function setDuration(seconds) {
  durationSeconds = seconds;
}

function synthFor(staveIndex) {
  if (!synthsByStave) synthsByStave = [];
  if (!synthsByStave[staveIndex]) synthsByStave[staveIndex] = new Tone.PolySynth(Tone.Synth).toDestination();
  return synthsByStave[staveIndex];
}

export function isPlaying() {
  return Tone.Transport.state === 'started';
}

// `notes` is [{ time, toneNote, staveIndex }], `time` a fraction in [0, 1]
// across the current playback duration. Resumes in place if paused;
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
        }, notes.map((note) => [note.time * durationSeconds, note])).start(0);
        needsRebuild = false;
      }

      Tone.Transport.start();

      function tick() {
        const fraction = Tone.Transport.seconds / durationSeconds;
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
