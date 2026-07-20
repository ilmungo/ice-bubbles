import { describe, expect, it } from 'vitest';
import { createEmptyScore, placeImage, clearSlot, isEmpty, SLOT_COUNT } from './score.js';

describe('score', () => {
  it('starts empty with SLOT_COUNT slots', () => {
    const score = createEmptyScore();
    expect(score).toHaveLength(SLOT_COUNT);
    expect(isEmpty(score)).toBe(true);
  });

  it('places an image at a slot without mutating the original score', () => {
    const score = createEmptyScore();
    const next = placeImage(score, 2, 4, 'bubble');

    expect(score[2]).toBeNull();
    expect(next[2]).toEqual({ step: 4, imageId: 'bubble' });
    expect(isEmpty(next)).toBe(false);
  });

  it('clears a slot back to null', () => {
    const placed = placeImage(createEmptyScore(), 0, 0, 'star');
    const cleared = clearSlot(placed, 0);

    expect(cleared[0]).toBeNull();
    expect(isEmpty(cleared)).toBe(true);
  });
});
