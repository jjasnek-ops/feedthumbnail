(() => {
  const kind = document.body.dataset.maker === "banner" ? "banner" : "thumbnail";
  const isBanner = kind === "banner";
  const spec = isBanner
    ? { width: 2048, height: 1152, label: "2048 × 1152 · 16:9", fontMin: 70, fontMax: 360, font: 190, safeWidth: 1235, safeHeight: 338 }
    : { width: 3840, height: 2160, label: "3840 × 2160 · 16:9", fontMin: 120, fontMax: 600, font: 360 };

  const canvas = document.querySelector("#makerCanvas");
  const ctx = canvas.getContext("2d");
  const imageInput = document.querySelector("#makerImage");
  const imageStatus = document.querySelector("#makerImageStatus");
  const headline = document.querySelector("#makerHeadline");
  const fontSize = document.querySelector("#makerFontSize");
  const fontSizeValue = document.querySelector("#makerFontSizeValue");
  const textColor = document.querySelector("#makerTextColor");
  const positionX = document.querySelector("#makerPositionX");
  const positionY = document.querySelector("#makerPositionY");
  const positionXValue = document.querySelector("#makerPositionXValue");
  const positionYValue = document.querySelector("#makerPositionYValue");
  const exportButton = document.querySelector("#makerExport");
  const safeArea = document.querySelector("#makerSafeArea");
  const presetButtons = Array.from(document.querySelectorAll("[data-maker-preset]"));

  canvas.width = spec.width;
  canvas.height = spec.height;
  const state = { image: null, imageUrl: "", background: "#172038", accent: "#d8ff5a", preset: "midnight" };
  const presets = {
    midnight: { background: "#172038", accent: "#d8ff5a", text: "#ffffff" },
    sunset: { background: "#772c45", accent: "#ff795f", text: "#ffffff" },
    paper: { background: "#f2eadc", accent: "#141b2d", text: "#141b2d" },
  };

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function roundedRect(context, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.stroke(); }
  }
  function drawCover(context, image, x, y, width, height) {
    if (!image || !image.complete || !image.naturalWidth) return false;
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = width / height;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;
    if (sourceRatio > targetRatio) { sourceWidth = image.naturalHeight * targetRatio; sourceX = (image.naturalWidth - sourceWidth) / 2; }
    else { sourceHeight = image.naturalWidth / targetRatio; sourceY = (image.naturalHeight - sourceHeight) / 2; }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    return true;
  }
  function drawHeadline(context) {
    const text = headline.value.trim() || (isBanner ? "YOUR CHANNEL NAME" : "YOUR BIG IDEA");
    const x = (Number(positionX.value) / 100) * spec.width;
    const y = (Number(positionY.value) / 100) * spec.height;
    const size = Number(fontSize.value);
    const maxWidth = spec.width * .82;
    context.font = `900 ${size}px Arial, sans-serif`;
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.strokeStyle = state.background === "#f2eadc" ? "rgba(255,255,255,.88)" : "rgba(0,0,0,.35)";
    context.lineWidth = Math.max(10, size * .08);
    context.strokeText(text, x, y, maxWidth);
    context.fillStyle = textColor.value;
    context.fillText(text, x, y, maxWidth);
  }
  function draw(withGuide = true) {
    const gradient = ctx.createLinearGradient(0, 0, spec.width, spec.height);
    gradient.addColorStop(0, state.background);
    gradient.addColorStop(1, state.accent);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, spec.width, spec.height);
    if (state.image) {
      ctx.save();
      ctx.globalAlpha = .76;
      drawCover(ctx, state.image, 0, 0, spec.width, spec.height);
      ctx.restore();
      ctx.fillStyle = "rgba(10,16,29,.26)";
      ctx.fillRect(0, 0, spec.width, spec.height);
    }
    ctx.fillStyle = state.accent;
    ctx.fillRect(spec.width * .055, spec.height * .11, spec.width * .11, Math.max(14, spec.height * .012));
    drawHeadline(ctx);
    if (isBanner && withGuide) {
      ctx.save();
      ctx.strokeStyle = "rgba(216,255,90,.58)";
      ctx.setLineDash([18, 13]);
      ctx.lineWidth = 8;
      ctx.strokeRect((spec.width - spec.safeWidth) / 2, (spec.height - spec.safeHeight) / 2, spec.safeWidth, spec.safeHeight);
      ctx.restore();
    }
  }
  function syncGuide() {
    if (!isBanner) return;
    safeArea.style.left = `${((spec.width - spec.safeWidth) / 2 / spec.width) * 100}%`;
    safeArea.style.top = `${((spec.height - spec.safeHeight) / 2 / spec.height) * 100}%`;
    safeArea.style.width = `${(spec.safeWidth / spec.width) * 100}%`;
    safeArea.style.height = `${(spec.safeHeight / spec.height) * 100}%`;
  }
  function syncLabels() {
    fontSizeValue.textContent = `${fontSize.value} px`;
    positionXValue.textContent = `${positionX.value}%`;
    positionYValue.textContent = `${positionY.value}%`;
    draw();
  }
  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    state.background = preset.background;
    state.accent = preset.accent;
    textColor.value = preset.text;
    state.preset = name;
    presetButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.makerPreset === name));
    draw();
  }
  function loadImage(file) {
    if (!file || !file.type.startsWith("image/")) { imageStatus.textContent = "Choose an image file"; return; }
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { state.image = image; imageStatus.textContent = file.name; draw(); };
    image.onerror = () => { imageStatus.textContent = "Could not read this image"; };
    image.src = state.imageUrl;
  }
  function exportPng() {
    draw(false);
    const link = document.createElement("a");
    link.download = isBanner ? "youtube-channel-banner.png" : "youtube-thumbnail.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    draw();
  }
  let dragging = false;
  function moveHeadline(event) {
    const rect = canvas.getBoundingClientRect();
    positionX.value = clamp(Math.round(((event.clientX - rect.left) / rect.width) * 100), 4, 78);
    positionY.value = clamp(Math.round(((event.clientY - rect.top) / rect.height) * 100), 8, 92);
    syncLabels();
  }
  canvas.addEventListener("pointerdown", (event) => { dragging = true; canvas.setPointerCapture(event.pointerId); moveHeadline(event); });
  canvas.addEventListener("pointermove", (event) => { if (dragging) moveHeadline(event); });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });
  imageInput.addEventListener("change", () => loadImage(imageInput.files[0]));
  [headline, fontSize, textColor, positionX, positionY].forEach((input) => input.addEventListener("input", syncLabels));
  presetButtons.forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.makerPreset)));
  exportButton.addEventListener("click", exportPng);
  fontSize.min = spec.fontMin;
  fontSize.max = spec.fontMax;
  fontSize.value = spec.font;
  syncGuide();
  applyPreset("midnight");
  syncLabels();
})();
