// Finds roughly-circular, dark-centered blobs with a brighter surrounding
// ring — the described look of a bubble trapped in ice — and returns their
// centers in the image's own natural pixel coordinates.
//
// Approach: downscale for speed, convert to grayscale, pick a dark/light
// split via Otsu's method, flood-fill the dark regions into blobs, then
// keep only blobs that are compact/circular (not thin or sprawling) and
// whose surroundings are meaningfully brighter than their interior — that
// last check is what separates actual bubbles from other dark patches
// (cracks, shadows) that happen to pass the shape test.
//
// `sensitivity` (0-100, default 50) trades false negatives for false
// positives: higher values shift the dark/light split to catch fainter
// centers and relax the contrast/shape checks, for images where bubbles
// are hard to tell from the surrounding ice; lower values tighten
// everything back up.
const DOWNSCALE_MAX_DIM = 500;
const MAX_AREA_FRACTION = 0.2;

export function detectBubbles(imgElement, sensitivity = 50) {
  const params = paramsForSensitivity(sensitivity);

  const scale = Math.min(1, DOWNSCALE_MAX_DIM / Math.max(imgElement.naturalWidth, imgElement.naturalHeight));
  const width = Math.max(1, Math.round(imgElement.naturalWidth * scale));
  const height = Math.max(1, Math.round(imgElement.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const gray = toGrayscale(data, width, height);
  const threshold = Math.min(255, Math.max(0, otsuThreshold(gray) + params.thresholdBias));
  const blobs = findDarkBlobs(gray, width, height, threshold);

  const imageArea = width * height;
  const bubbles = [];
  for (const blob of blobs) {
    const center = evaluateBlob(blob, gray, width, height, imageArea, params);
    if (center) bubbles.push({ x: center.x / scale, y: center.y / scale });
  }
  return bubbles;
}

function paramsForSensitivity(sensitivity) {
  const t = Math.min(100, Math.max(0, sensitivity)) / 100; // 0 (strict) .. 1 (permissive)
  return {
    thresholdBias: (t - 0.5) * 60, // -30 .. +30 brightness units
    minRingContrast: 24 - t * 20, // 24 .. 4
    minFillRatio: 0.6 - t * 0.3, // 0.6 .. 0.3
    maxAspectRatio: 1.5 + t * 1.2, // 1.5 .. 2.7
    minAreaFraction: 0.00015 * (1 - t * 0.6), // shrinks so smaller bubbles qualify
  };
}

function toGrayscale(data, width, height) {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return gray;
}

function otsuThreshold(gray) {
  const histogram = new Array(256).fill(0);
  for (const value of gray) histogram[Math.min(255, Math.max(0, Math.round(value)))] += 1;

  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i];

  let weightBackground = 0;
  let sumBackground = 0;
  let best = { variance: -1, threshold: 128 };

  for (let t = 0; t < 256; t += 1) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * histogram[t];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

    if (variance > best.variance) best = { variance, threshold: t };
  }
  return best.threshold;
}

// Iterative flood fill (a plain recursive version would blow the stack on
// large dark regions) over every pixel darker than `threshold`.
function findDarkBlobs(gray, width, height, threshold) {
  const visited = new Uint8Array(width * height);
  const blobs = [];
  const stack = [];

  for (let start = 0; start < width * height; start += 1) {
    if (visited[start] || gray[start] >= threshold) continue;

    let count = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const idx = stack.pop();
      const x = idx % width;
      const y = Math.floor(idx / width);
      count += 1;
      sumX += x;
      sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      for (const n of [idx - 1, idx + 1, idx - width, idx + width]) {
        if (n < 0 || n >= width * height || visited[n] || gray[n] >= threshold) continue;
        if (Math.abs((n % width) - x) > 1) continue; // reject row-wrap neighbors
        visited[n] = 1;
        stack.push(n);
      }
    }

    blobs.push({ count, sumX, sumY, minX, maxX, minY, maxY });
  }
  return blobs;
}

function evaluateBlob(blob, gray, width, height, imageArea, params) {
  if (blob.count < imageArea * params.minAreaFraction || blob.count > imageArea * MAX_AREA_FRACTION) return null;

  const w = blob.maxX - blob.minX + 1;
  const h = blob.maxY - blob.minY + 1;
  const aspect = w > h ? w / h : h / w;
  if (aspect > params.maxAspectRatio) return null;

  const fillRatio = blob.count / (w * h);
  if (fillRatio < params.minFillRatio) return null;

  const cx = blob.sumX / blob.count;
  const cy = blob.sumY / blob.count;
  const radius = Math.sqrt(blob.count / Math.PI);

  const innerAvg = sampleAnnulus(gray, width, height, cx, cy, 0, radius * 0.8);
  const outerAvg = sampleAnnulus(gray, width, height, cx, cy, radius * 1.1, radius * 1.8);
  if (innerAvg === null || outerAvg === null || outerAvg - innerAvg < params.minRingContrast) return null;

  return { x: cx, y: cy };
}

function sampleAnnulus(gray, width, height, cx, cy, rInner, rOuter) {
  let sum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor(rOuter / 12));

  for (let y = Math.max(0, Math.floor(cy - rOuter)); y <= Math.min(height - 1, Math.ceil(cy + rOuter)); y += step) {
    for (let x = Math.max(0, Math.floor(cx - rOuter)); x <= Math.min(width - 1, Math.ceil(cx + rOuter)); x += step) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < rInner || d > rOuter) continue;
      sum += gray[y * width + x];
      count += 1;
    }
  }
  return count > 0 ? sum / count : null;
}
