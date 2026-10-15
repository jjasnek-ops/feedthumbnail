(() => {
  const TARGET_WIDTH = 1280;
  const TARGET_HEIGHT = 720;
  const MOBILE_LIMIT_BYTES = 2 * 1024 * 1024;
  const QUALITY_STEPS = [0.92, 0.84, 0.76, 0.68, 0.60, 0.52, 0.44, 0.36, 0.28, 0.20, 0.14];

  const input = document.getElementById('resizerImage');
  const dropzone = document.getElementById('resizerDropzone');
  const canvas = document.getElementById('resizerCanvas');
  const context = canvas.getContext('2d', { alpha: false });
  const exportButton = document.getElementById('resizerExport');
  const backgroundInput = document.getElementById('resizerBackground');
  const backgroundValue = document.getElementById('resizerBackgroundValue');
  const paddingControl = document.getElementById('resizerPaddingControl');
  const fileStatus = document.getElementById('resizerFileStatus');
  const fileMeta = document.getElementById('resizerFileMeta');
  const status = document.getElementById('resizerStatus');
  const outputSize = document.getElementById('resizerOutputSize');
  const outputCheck = document.getElementById('resizerOutputCheck');
  const modeHint = document.getElementById('resizerModeHint');
  const previewNote = document.getElementById('resizerPreviewNote');
  const emptyState = document.getElementById('resizerEmpty');

  const state = {
    image: null,
    file: null,
    objectUrl: null,
    mode: 'fill',
    background: backgroundInput.value,
  };

  function setStatus(message, tone) {
    status.textContent = message;
    status.dataset.tone = tone || '';
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function fillCanvas(color) {
    context.fillStyle = color;
    context.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
  }

  function drawImage() {
    fillCanvas(state.background);
    if (!state.image) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const sourceWidth = state.image.naturalWidth;
    const sourceHeight = state.image.naturalHeight;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

    if (state.mode === 'stretch') {
      context.drawImage(state.image, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
      return;
    }

    if (state.mode === 'fit') {
      const scale = Math.min(TARGET_WIDTH / sourceWidth, TARGET_HEIGHT / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      context.drawImage(state.image, (TARGET_WIDTH - drawWidth) / 2, (TARGET_HEIGHT - drawHeight) / 2, drawWidth, drawHeight);
      return;
    }

    if (sourceRatio > targetRatio) {
      const cropWidth = sourceHeight * targetRatio;
      const cropX = (sourceWidth - cropWidth) / 2;
      context.drawImage(state.image, cropX, 0, cropWidth, sourceHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    } else {
      const cropHeight = sourceWidth / targetRatio;
      const cropY = (sourceHeight - cropHeight) / 2;
      context.drawImage(state.image, 0, cropY, sourceWidth, cropHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    }
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-resizer-mode]').forEach((button) => {
      const active = button.dataset.resizerMode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    const copy = {
      fill: ['Crop the edges', 'Fill frame crops to the exact target.'],
      fit: ['Keep the whole image', 'Fit image keeps the whole source and adds padding.'],
      stretch: ['Map to the frame', 'Stretch maps the source directly to the exact target.'],
    }[mode];
    modeHint.textContent = copy[0];
    previewNote.textContent = copy[1];
    paddingControl.classList.toggle('is-muted', mode !== 'fit');
    drawImage();
  }

  function readFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Choose a PNG, JPG, or WEBP image.', 'error');
      return;
    }
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      state.image = image;
      state.file = file;
      fileStatus.textContent = 'Ready';
      fileMeta.textContent = `${file.name} · ${image.naturalWidth} × ${image.naturalHeight} · ${formatBytes(file.size)}`;
      exportButton.disabled = false;
      outputSize.textContent = 'Not exported';
      outputCheck.textContent = 'Waiting for export';
      setStatus('Image loaded locally. Adjust the frame, then export.', 'ready');
      drawImage();
    };
    image.onerror = () => {
      setStatus('This image could not be read by the browser.', 'error');
      URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = null;
    };
    image.src = state.objectUrl;
  }

  function canvasBlob(quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  }

  async function exportImage() {
    if (!state.image) return;
    exportButton.disabled = true;
    exportButton.querySelector('span').textContent = 'Preparing checked JPG…';
    setStatus('Encoding locally and checking the mobile upload limit…', 'working');
    drawImage();

    let chosenBlob = null;
    let chosenQuality = QUALITY_STEPS[QUALITY_STEPS.length - 1];
    for (const quality of QUALITY_STEPS) {
      const blob = await canvasBlob(quality);
      if (!blob) continue;
      chosenBlob = blob;
      chosenQuality = quality;
      if (blob.size <= MOBILE_LIMIT_BYTES) break;
    }

    if (!chosenBlob) {
      setStatus('The browser could not create an export.', 'error');
      exportButton.disabled = false;
      exportButton.querySelector('span').textContent = 'Export upload-ready JPG';
      return;
    }

    const underLimit = chosenBlob.size <= MOBILE_LIMIT_BYTES;
    outputSize.textContent = formatBytes(chosenBlob.size);
    outputCheck.textContent = underLimit ? 'Under 2 MB' : 'Still over 2 MB';
    outputCheck.dataset.tone = underLimit ? 'good' : 'warn';
    setStatus(underLimit ? `Ready to save. Local quality setting: ${Math.round(chosenQuality * 100)}%.` : 'The lowest tested quality is still over the mobile limit.', underLimit ? 'success' : 'error');

    const downloadUrl = URL.createObjectURL(chosenBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${(state.file?.name || 'youtube-thumbnail').replace(/\.[^.]+$/, '')}-1280x720.jpg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

    exportButton.disabled = false;
    exportButton.querySelector('span').textContent = 'Export upload-ready JPG';
  }

  input.addEventListener('change', () => readFile(input.files[0]));
  backgroundInput.addEventListener('input', () => {
    state.background = backgroundInput.value;
    backgroundValue.textContent = backgroundInput.value.toUpperCase();
    drawImage();
  });
  document.querySelectorAll('[data-resizer-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.resizerMode)));
  exportButton.addEventListener('click', exportImage);

  ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
  }));
  dropzone.addEventListener('drop', (event) => readFile(event.dataTransfer.files[0]));

  setMode('fill');
  drawImage();
})();
