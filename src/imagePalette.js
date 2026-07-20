import bubbleUrl from './assets/images/bubble.svg';
import starUrl from './assets/images/star.svg';
import leafUrl from './assets/images/leaf.svg';
import dropUrl from './assets/images/drop.svg';

// Each palette image doubles as an instrument voice: dropping it on the
// staff sets both the note's pitch (by position) and its timbre (by which
// image it is).
export const PALETTE = [
  { id: 'bubble', label: 'Bubble', url: bubbleUrl, oscillator: 'sine' },
  { id: 'star', label: 'Star', url: starUrl, oscillator: 'triangle' },
  { id: 'leaf', label: 'Leaf', url: leafUrl, oscillator: 'square' },
  { id: 'drop', label: 'Drop', url: dropUrl, oscillator: 'sawtooth' },
];

export function getPaletteImage(imageId) {
  return PALETTE.find((image) => image.id === imageId);
}
