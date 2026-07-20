// The score is the single source of truth for what's on the staff: a fixed
// number of quarter-note beat slots, each either empty or holding a placed
// image (which determines pitch, by vertical step, and timbre).

export const SLOT_COUNT = 8;

export function createEmptyScore() {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

export function placeImage(score, slotIndex, step, imageId) {
  const next = score.slice();
  next[slotIndex] = { step, imageId };
  return next;
}

export function clearSlot(score, slotIndex) {
  const next = score.slice();
  next[slotIndex] = null;
  return next;
}

export function isEmpty(score) {
  return score.every((slot) => slot === null);
}
