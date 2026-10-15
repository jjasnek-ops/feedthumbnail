(() => {
  const canvas = document.querySelector("#profileCanvas");
  const previewCanvas = document.querySelector("#profileRenderPreview");
  const imageInput = document.querySelector("#profileImage");
  const dropzone = document.querySelector("#profileDropzone");
  const imageStatus = document.querySelector("#profileImageStatus");
  const zoomInput = document.querySelector("#profileZoom");
  const resetButton = document.querySelector("#profileReset");
  const exportButton = document.querySelector("#profileExport");
  const cropStatus = document.querySelector("#profileCropStatus");
  const context = canvas.getContext("2d");
  const previewContext = previewCanvas.getContext("2d");
  const image = new Image();
  const state = { sourceUrl: "", loaded: false, size: 98, zoom: 1, offsetX: 0, offsetY: 0, dragging: false, pointerX: 0, pointerY: 0 };

  canvas.width = state.size;
  canvas.height = state.size;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function getDrawState() {
    if (!state.loaded) return null;
    const baseScale = Math.max(state.size / image.naturalWidth, state.size / image.naturalHeight);
    const scale = baseScale * state.zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const maxX = Math.max(0, (width - state.size) / 2);
    const maxY = Math.max(0, (height - state.size) / 2);
    state.offsetX = clamp(state.offsetX, -maxX, maxX);
    state.offsetY = clamp(state.offsetY, -maxY, maxY);
    return { width, height, x: (state.size - width) / 2 + state.offsetX, y: (state.size - height) / 2 + state.offsetY };
  }
  function draw() {
    context.clearRect(0, 0, state.size, state.size);
    const drawState = getDrawState();
    if (drawState) {
      context.save();
      context.beginPath();
      context.arc(state.size / 2, state.size / 2, state.size / 2, 0, Math.PI * 2);
      context.clip();
      context.drawImage(image, drawState.x, drawState.y, drawState.width, drawState.height);
      context.restore();
      context.save();
      context.strokeStyle = "rgba(216,255,90,.95)";
      context.lineWidth = Math.max(2, state.size / 180);
      context.beginPath();
      context.arc(state.size / 2, state.size / 2, state.size / 2 - context.lineWidth, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
    previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    if (state.loaded) previewContext.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
  }
  function resetCrop() {
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    zoomInput.value = "1";
    cropStatus.textContent = state.loaded ? "Drag to align the crop." : "Upload an image to start.";
    draw();
  }
  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      imageStatus.textContent = "Choose an image file";
      return;
    }
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
    state.sourceUrl = URL.createObjectURL(file);
    image.onload = () => {
      state.size = Math.max(98, image.naturalWidth, image.naturalHeight);
      canvas.width = state.size;
      canvas.height = state.size;
      state.loaded = true;
      imageStatus.textContent = file.name;
      cropStatus.textContent = "Drag to align the crop.";
      resetCrop();
    };
    image.onerror = () => {
      state.loaded = false;
      imageStatus.textContent = "Could not read this image";
      cropStatus.textContent = "Choose another local image.";
      draw();
    };
    image.src = state.sourceUrl;
  }
  function exportPng() {
    if (!state.loaded) {
      cropStatus.textContent = "Choose an image before exporting.";
      return;
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        cropStatus.textContent = "The PNG could not be created.";
        return;
      }
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.download = "youtube-profile-picture.png";
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      cropStatus.textContent = "PNG ready to save.";
    }, "image/png");
  }
  function movePointer(event) {
    if (!state.dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scale = state.size / rect.width;
    state.offsetX += (event.clientX - state.pointerX) * scale;
    state.offsetY += (event.clientY - state.pointerY) * scale;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    draw();
  }

  imageInput.addEventListener("change", () => loadFile(imageInput.files[0]));
  ["dragenter", "dragover"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove("is-dragging"); }));
  dropzone.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));
  zoomInput.addEventListener("input", () => { state.zoom = Number(zoomInput.value); draw(); });
  resetButton.addEventListener("click", resetCrop);
  exportButton.addEventListener("click", exportPng);
  canvas.addEventListener("pointerdown", (event) => { if (!state.loaded) return; state.dragging = true; state.pointerX = event.clientX; state.pointerY = event.clientY; canvas.setPointerCapture(event.pointerId); cropStatus.textContent = "Aligning the crop."; });
  canvas.addEventListener("pointermove", movePointer);
  canvas.addEventListener("pointerup", () => { state.dragging = false; cropStatus.textContent = state.loaded ? "Drag to align the crop." : "Upload an image to start."; });
  canvas.addEventListener("pointercancel", () => { state.dragging = false; });
  draw();
})();
