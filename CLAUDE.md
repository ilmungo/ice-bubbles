# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser-based app that renders a music staff and lets the user drop images onto it to compose and play a short melody. Each image is both a pitch marker (by where it's placed vertically) and an instrument voice (by which image it is).

## Commands

- `npm run dev` — start the Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — ESLint over the whole project
- `npm test` — run the Vitest suite once (`npx vitest` for watch mode)
- `npx vitest run src/score.test.js` — run a single test file

There is no test framework configured beyond Vitest; tests live next to the module they cover (`src/score.test.js`, `src/staffView.test.js`).

## Architecture

The app has no framework and no global state library — `src/main.js` is the only place that owns mutable state (`score`, `selectedImageId`, `isPlaying`) and re-renders by tearing down and rebuilding DOM on every change. The other modules are pure(ish) and stateless:

- **`src/score.js`** — the score data model. A score is a fixed-length array (`SLOT_COUNT` = 8) of slots, each either `null` or `{ step, imageId }`. All mutators (`placeImage`, `clearSlot`) return a new array rather than mutating in place.
- **`src/imagePalette.js`** — the fixed set of placeable images (`PALETTE`). Each entry pairs an image asset with a Tone.js oscillator type (`oscillator: 'sine' | 'triangle' | ...`), so the image itself determines the instrument timbre.
- **`src/staffView.js`** — wraps VexFlow. `renderStaff(container, score)` draws the stave (fixed at one measure in `${SLOT_COUNT}/4` time so every slot is a plain quarter note or quarter rest — this sidesteps VexFlow's beam/duration bookkeeping across measures) and returns a geometry object used to convert between pixel coordinates and musical coordinates:
  - `slotAt(x)` / `stepAt(y)` — pointer position → (beat slot, pitch step)
  - `slotCenterX(index)` / `yForStep(step)` — musical coordinates → pixel position, used to position the overlaid `<img>` elements exactly on top of the VexFlow-drawn note
  - Pitch is modeled as a `step`: an integer diatonic distance from the bottom staff line (E4 = step 0), covering natural notes only (no accidentals) from `MIN_STEP` (C4) to `MAX_STEP` (A5). `stepToPitchName`/`stepToToneNote` convert a step to VexFlow key format (`"e/4"`) and Tone.js note format (`"E4"`) respectively.
- **`src/audioEngine.js`** — wraps Tone.js. `playScore(score, { onSlot })` builds a `Tone.Sequence` that triggers one synth per distinct oscillator type (synths are cached in `synthsByOscillator` and reused across plays) and resolves its returned promise once the whole score has finished playing, calling `onSlot(index)` on each beat via `Tone.Draw` so UI highlighting stays in sync with actual audio timing rather than a separate setTimeout loop.

### Rendering model

`main.js` renders the VexFlow SVG into `#staff`, then stacks an absolutely-positioned `#overlay` div on top of it at the same size. The overlay does three things: it draws faint `.slot-guide` lines marking the 8 beat divisions, it renders one `<img class="placed-image">` per filled slot (positioned via the geometry helpers above), and it's the single click/dragover/drop target for the whole staff — pointer coordinates are translated into `(slotIndex, step)` via the geometry object before calling `placeImage`/`clearSlot`. Because VexFlow re-renders the entire SVG from scratch on every score change, the overlay is also rebuilt from scratch each time (`renderStaffAndOverlay`) rather than diffed.

Placing an image follows one rule: clicking/dropping with `selectedImageId` set always places that image at the computed slot; clicking an already-filled slot with drag data absent and no explicit image id clears it instead (see `placeAt` in `main.js`).

### Adding a new placeable image

Add an SVG under `src/assets/images/`, import it in `src/imagePalette.js`, and add a `PALETTE` entry with an `oscillator` type — no changes needed elsewhere, since the palette rendering, placement, and audio engine all key off `PALETTE`/`getPaletteImage`.
