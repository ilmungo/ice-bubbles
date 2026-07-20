const MAX_INITIAL_SIZE = 320;
const MIN_SIZE = 30;
const TAP_THRESHOLD_PX = 6;

// A single loaded image floats in a fixed, full-viewport layer above
// everything else, draggable by its body and resizable (aspect-locked) via
// a corner handle. Loading a new image replaces whatever was there before.
// A drag that never moves past TAP_THRESHOLD_PX is treated as a tap and
// reported via onTap instead of repositioning the image.
export function setupImageOverlay(fileInput, { onTap } = {}) {
  const layer = document.createElement('div');
  layer.id = 'image-overlay-layer';
  document.body.appendChild(layer);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addImage(layer, reader.result, onTap);
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  return {
    getImage: () => layer.querySelector('.overlay-image'),
  };
}

function addImage(layer, src, onTap) {
  layer.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'overlay-image-wrapper';

  const img = document.createElement('img');
  img.className = 'overlay-image';
  img.draggable = false;
  img.src = src;

  const handle = document.createElement('div');
  handle.className = 'overlay-resize-handle';

  wrapper.append(img, handle);
  layer.appendChild(wrapper);

  img.addEventListener('load', () => {
    const scale = Math.min(1, MAX_INITIAL_SIZE / img.naturalWidth, MAX_INITIAL_SIZE / img.naturalHeight);
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.left = `${(window.innerWidth - width) / 2}px`;
    wrapper.style.top = `${(window.innerHeight - height) / 2}px`;
  });

  makeDraggable(wrapper, onTap);
  makeResizable(wrapper, handle);
}

function makeDraggable(wrapper, onTap) {
  wrapper.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = wrapper.offsetLeft;
    const startTop = wrapper.offsetTop;
    let moved = false;

    function handleMove(moveEvent) {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (Math.hypot(deltaX, deltaY) > TAP_THRESHOLD_PX) moved = true;
      wrapper.style.left = `${startLeft + deltaX}px`;
      wrapper.style.top = `${startTop + deltaY}px`;
    }
    function handleUp(upEvent) {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      if (!moved) onTap?.(upEvent.clientX, upEvent.clientY);
    }
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  });
}

function makeResizable(wrapper, handle) {
  handle.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = wrapper.offsetWidth;
    const startHeight = wrapper.offsetHeight;
    const aspect = startWidth / startHeight;

    function handleMove(moveEvent) {
      const newWidth = Math.max(MIN_SIZE, startWidth + (moveEvent.clientX - startX));
      wrapper.style.width = `${newWidth}px`;
      wrapper.style.height = `${newWidth / aspect}px`;
    }
    function handleUp() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    }
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  });
}
