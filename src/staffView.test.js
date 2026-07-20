import { describe, expect, it } from 'vitest';
import { MIN_STEP, MAX_STEP, stepToPitchName, stepToToneNote } from './staffView.js';

describe('pitch step mapping', () => {
  it('maps step 0 to the bottom staff line, E4', () => {
    expect(stepToPitchName(0)).toBe('E4');
  });

  it('maps the full natural-note range without accidentals', () => {
    expect(stepToPitchName(MIN_STEP)).toBe('C4');
    expect(stepToPitchName(MAX_STEP)).toBe('A5');
  });

  it('produces Tone.js note names matching VexFlow step names', () => {
    expect(stepToToneNote(0)).toBe('E4');
    expect(stepToToneNote(5)).toBe('C5');
  });
});
