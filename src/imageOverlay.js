const MAX_INITIAL_SIZE = 320;
const MIN_SIZE = 30;

// A single loaded image floats in a fixed, full-viewport layer above
// everything else, draggable by its body and resizable (aspect-locked) via
// a corner handle. Loading a new image replaces whatever was there before.
export function setupImageOverlay(fileInput) {
  const layer = document.createElement('div');
  layer.id = 'image-overlay-layer';
  document.body.appendChild(layer);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => addImage(layer, reader.result);
    reader.readAsDataURL(file);
    fileInput.value = '';
  });
}

function addImage(layer, src) {
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

  makeDraggable(wrapper);
  makeResizable(wrapper, handle);
}

function dragBy(element, onMove) {
  element.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;

    function handleMove(moveEvent) {
      onMove(moveEvent.clientX - startX, moveEvent.clientY - startY);
    }
    function handleUp() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    }
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  });
}

function makeDraggable(wrapper) {
  dragBy(wrapper, (deltaX, deltaY) => {
    wrapper.style.left = `${wrapper._startLeft + deltaX}px`;
    wrapper.style.top = `${wrapper._startTop + deltaY}px`;
  });
  wrapper.addEventListener('pointerdown', () => {
    wrapper._startLeft = wrapper.offsetLeft;
    wrapper._startTop = wrapper.offsetTop;
  });
}

function makeResizable(wrapper, handle) {
  dragBy(handle, (deltaX) => {
    const newWidth = Math.max(MIN_SIZE, wrapper._startWidth + deltaX);
    const newHeight = newWidth / wrapper._startAspect;
    wrapper.style.width = `${newWidth}px`;
    wrapper.style.height = `${newHeight}px`;
  });
  handle.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    wrapper._startWidth = wrapper.offsetWidth;
    wrapper._startAspect = wrapper.offsetWidth / wrapper.offsetHeight;
  });
}
