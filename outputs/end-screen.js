(() => {
  const spec = { width: 1920, height: 1080, maxElements: 4 };
  const canvas = document.querySelector("#endCanvas");
  const ctx = canvas.getContext("2d");
  const headline = document.querySelector("#endHeadline");
  const subtitle = document.querySelector("#endSubtitle");
  const background = document.querySelector("#endBackground");
  const accent = document.querySelector("#endAccent");
  const textColor = document.querySelector("#endTextColor");
  const elementList = document.querySelector("#endElementList");
  const elementCount = document.querySelector("#endElementCount");
  const validation = document.querySelector("#endValidation");
  const validationText = document.querySelector("#endValidationText");
  const addButton = document.querySelector("#addEndElement");
  const exportButton = document.querySelector("#endExport");
  const exportStatus = document.querySelector("#endExportStatus");
  const state = {
    elements: [
      { label: "WATCH NEXT", x: 0.72, y: 0.31, fill: "rgba(255,255,255,.92)" },
      { label: "SUBSCRIBE", x: 0.72, y: 0.56, fill: "rgba(216,255,90,.94)" },
      { label: "BROWSE MORE", x: 0.72, y: 0.81, fill: "rgba(255,255,255,.92)" }
    ],
    dragging: null,
    warning: ""
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
  function fitText(context, value, maxWidth, startingSize, weight = 900) {
    let size = startingSize;
    while (size > 24) {
      context.font = `${weight} ${size}px Arial, sans-serif`;
      if (context.measureText(value).width <= maxWidth) break;
      size -= 4;
    }
    return size;
  }
  function setValidation(message, type = "is-ok") {
    validation.className = `end-screen-validation ${type}`;
    validationText.textContent = message;
  }
  function drawGuide() {
    ctx.save();
    ctx.strokeStyle = "rgba(216,255,90,.42)";
    ctx.lineWidth = 5;
    ctx.setLineDash([18, 15]);
    ctx.strokeRect(42, 42, spec.width - 84, spec.height - 84);
    ctx.fillStyle = "rgba(216,255,90,.88)";
    ctx.font = "800 25px Arial, sans-serif";
    ctx.fillText("EDITABLE PLACEMENT GUIDE", 70, 91);
    ctx.restore();
  }
  function drawCard(element, index) {
    const cardWidth = 410;
    const cardHeight = 166;
    const x = element.x * spec.width - cardWidth / 2;
    const y = element.y * spec.height - cardHeight / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    roundedRect(ctx, x, y, cardWidth, cardHeight, 22, element.fill, null);
    ctx.restore();
    ctx.lineWidth = 5;
    roundedRect(ctx, x, y, cardWidth, cardHeight, 22, null, "rgba(20,27,45,.28)");
    ctx.fillStyle = "#141b2d";
    ctx.font = "800 20px Arial, sans-serif";
    ctx.fillText(`ELEMENT ${String(index + 1).padStart(2, "0")}`, x + 28, y + 40);
    const size = fitText(ctx, element.label || `ELEMENT ${index + 1}`, cardWidth - 56, 39, 950);
    ctx.font = `950 ${size}px Arial, sans-serif`;
    ctx.fillText(element.label || `ELEMENT ${index + 1}`, x + 28, y + 103);
  }
  function draw(withGuide = true) {
    const gradient = ctx.createLinearGradient(0, 0, spec.width, spec.height);
    gradient.addColorStop(0, background.value);
    gradient.addColorStop(1, accent.value);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, spec.width, spec.height);
    ctx.fillStyle = "rgba(10,16,29,.25)";
    ctx.fillRect(0, 0, spec.width, spec.height);
    ctx.fillStyle = accent.value;
    ctx.fillRect(78, 170, 230, 18);
    ctx.fillStyle = textColor.value;
    ctx.font = "850 27px Arial, sans-serif";
    ctx.fillText("END SCREEN TEMPLATE", 82, 137);
    const headlineText = headline.value.trim() || "WATCH WHAT COMES NEXT";
    const headlineSize = fitText(ctx, headlineText, 960, 112, 950);
    ctx.font = `950 ${headlineSize}px Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(headlineText, 82, 404);
    ctx.font = "700 35px Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.fillText(subtitle.value.trim() || "NEW VIDEOS EVERY WEEK", 86, 520);
    ctx.fillStyle = "rgba(255,255,255,.56)";
    ctx.font = "700 20px Arial, sans-serif";
    ctx.fillText("Drag the cards in the editor to set their positions.", 86, 603);
    state.elements.forEach(drawCard);
    if (withGuide) drawGuide();
    ctx.textBaseline = "alphabetic";
  }
  function renderControls() {
    elementList.innerHTML = state.elements.map((element, index) => `<div class="end-screen-element-control" data-element-index="${index}"><label for="end-element-${index}">Element ${String(index + 1).padStart(2, "0")}</label><input id="end-element-${index}" class="maker-input" type="text" value="${escapeAttribute(element.label)}" autocomplete="off" /><button class="end-screen-remove-button" type="button" data-remove-element="${index}" aria-label="Remove element ${index + 1}">Remove</button></div>`).join("");
    elementCount.textContent = `${state.elements.length} of ${spec.maxElements}`;
  }
  function escapeAttribute(value) { return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function refresh() { renderControls(); draw(); }
  function addElement() {
    if (state.elements.length >= spec.maxElements) {
      state.warning = "The fourth slot is already used. No more than 4 elements are available for a standard 16:9 end screen.";
      setValidation(state.warning, "is-warning");
      return;
    }
    const next = state.elements.length;
    state.elements.push({ label: next === 3 ? "CHANNEL" : `ELEMENT ${next + 1}`, x: 0.72, y: 0.31 + next * 0.22, fill: next % 2 ? "rgba(216,255,90,.94)" : "rgba(255,255,255,.92)" });
    state.warning = "";
    setValidation("Ready for a four-element standard 16:9 layout.", "is-ok");
    refresh();
  }
  function positionForPointer(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: clamp((event.clientX - rect.left) / rect.width, 0.12, 0.88), y: clamp((event.clientY - rect.top) / rect.height, 0.15, 0.85) };
  }
  function hitElement(event) {
    const rect = canvas.getBoundingClientRect();
    const point = { x: (event.clientX - rect.left) / rect.width * spec.width, y: (event.clientY - rect.top) / rect.height * spec.height };
    const cardWidth = 410;
    const cardHeight = 166;
    for (let index = state.elements.length - 1; index >= 0; index -= 1) {
      const element = state.elements[index];
      const x = element.x * spec.width - cardWidth / 2;
      const y = element.y * spec.height - cardHeight / 2;
      if (point.x >= x && point.x <= x + cardWidth && point.y >= y && point.y <= y + cardHeight) return index;
    }
    return -1;
  }
  canvas.addEventListener("pointerdown", (event) => {
    const index = hitElement(event);
    if (index < 0) return;
    state.dragging = index;
    canvas.setPointerCapture(event.pointerId);
    const position = positionForPointer(event);
    state.elements[index].x = position.x;
    state.elements[index].y = position.y;
    draw();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (state.dragging === null) return;
    const position = positionForPointer(event);
    state.elements[state.dragging].x = position.x;
    state.elements[state.dragging].y = position.y;
    draw();
  });
  function stopDragging() { state.dragging = null; }
  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);
  elementList.addEventListener("input", (event) => {
    if (!event.target.matches("[id^='end-element-']")) return;
    const index = Number(event.target.id.replace("end-element-", ""));
    state.elements[index].label = event.target.value;
    draw();
  });
  elementList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-element]");
    if (!button) return;
    state.elements.splice(Number(button.dataset.removeElement), 1);
    state.warning = "";
    setValidation("Element removed. The layout is still within the official limit.", "is-ok");
    refresh();
  });
  [headline, subtitle, background, accent, textColor].forEach((input) => input.addEventListener("input", () => draw()));
  addButton.addEventListener("click", addElement);
  function formatBytes(bytes) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(2)} MB`; }
  exportButton.addEventListener("click", () => {
    draw(false);
    canvas.toBlob((blob) => {
      if (!blob) { setValidation("The browser could not create a PNG.", "is-error"); return; }
      const link = document.createElement("a");
      link.download = "youtube-end-screen-template.png";
      link.href = URL.createObjectURL(blob);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      exportStatus.textContent = `Exported ${spec.width} × ${spec.height} PNG · ${formatBytes(blob.size)}.`;
      setValidation("PNG export complete. The placement guide was left out.", "is-ok");
      draw();
    }, "image/png");
  });
  renderControls();
  draw();
})();
