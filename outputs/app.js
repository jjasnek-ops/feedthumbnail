(() => {
  const state = {
    mode: "desktop",
    theme: "light",
    image: null,
    imageUrl: "",
  };

  const fileInput = document.querySelector("#fileInput");
  const dropzone = document.querySelector("#dropzone");
  const fileStatus = document.querySelector("#fileStatus");
  const titleInput = document.querySelector("#titleInput");
  const mainThumbnail = document.querySelector("#mainThumbnail");
  const thumbnailPlaceholder = document.querySelector("#thumbnailPlaceholder");
  const previewStage = document.querySelector("#previewStage");
  const previewState = document.querySelector("#previewState");
  const viewLabel = document.querySelector("#viewLabel");
  const themeLabel = document.querySelector("#themeLabel");
  const downloadButton = document.querySelector("#downloadButton");

  const titleBindings = document.querySelectorAll('[data-bind="title"]');
  const modeButtons = document.querySelectorAll("[data-mode]");
  const themeButtons = document.querySelectorAll("[data-theme]");

  function setTitle(value) {
    const title = value.trim() || "Your video title goes here";
    titleBindings.forEach((node) => { node.textContent = title; });
  }

  function updateLabels() {
    const modeText = state.mode === "phone" ? "Phone" : "Desktop";
    const themeText = state.theme === "dark" ? "Dark" : "Light";
    previewStage.dataset.mode = state.mode;
    previewStage.dataset.theme = state.theme;
    previewState.textContent = `${modeText} · ${themeText}`;
    viewLabel.textContent = modeText;
    themeLabel.textContent = themeText;
    modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.mode === state.mode));
    themeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.theme === state.theme));
  }

  function clearImage() {
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.image = null;
    state.imageUrl = "";
    mainThumbnail.removeAttribute("src");
    mainThumbnail.classList.remove("is-visible");
    thumbnailPlaceholder.classList.remove("is-hidden");
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      fileStatus.textContent = "Choose an image file";
      clearImage();
      return;
    }

    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = URL.createObjectURL(file);
    state.image = new Image();
    state.image.onload = () => {
      mainThumbnail.src = state.imageUrl;
      mainThumbnail.classList.add("is-visible");
      thumbnailPlaceholder.classList.add("is-hidden");
      fileStatus.textContent = file.name;
    };
    state.image.src = state.imageUrl;
  }

  async function restoreHandoff() {
    const raw = sessionStorage.getItem("thumbnailTesterHandoff");
    if (!raw) return;
    sessionStorage.removeItem("thumbnailTesterHandoff");
    try {
      const handoff = JSON.parse(raw);
      if (!handoff.dataUrl) throw new Error("Missing local image data");
      const response = await fetch(handoff.dataUrl);
      const blob = await response.blob();
      loadFile(new File([blob], handoff.name || "youtube-thumbnail.jpg", { type: blob.type || "image/jpeg" }));
    } catch {
      fileStatus.textContent = "Could not restore the local thumbnail";
    }
  }

  function roundedRect(ctx, x, y, width, height, radius, fill, stroke) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function drawCover(ctx, image, x, y, width, height) {
    if (!image || !image.complete || !image.naturalWidth) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "#d8ff5a");
      gradient.addColorStop(1, "#ff795f");
      roundedRect(ctx, x, y, width, height, 18, gradient);
      ctx.fillStyle = "#141b2d";
      ctx.font = "900 30px Arial";
      ctx.fillText("YOUR THUMBNAIL", x + 28, y + height / 2);
      return;
    }
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = width / height;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;
    if (sourceRatio > targetRatio) {
      sourceWidth = image.naturalHeight * targetRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth / targetRatio;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }
    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function drawCanvasText(ctx, text, x, y, maxWidth, font, color, lineHeight, maxLines = 2) {
    ctx.font = font;
    ctx.fillStyle = color;
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
  }

  function exportPreview() {
    const phone = state.mode === "phone";
    const dark = state.theme === "dark";
    const width = phone ? 780 : 1600;
    const height = phone ? 1220 : 980;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const bg = dark ? "#161d2b" : "#e5eaf1";
    const surface = dark ? "#20283a" : "#ffffff";
    const ink = dark ? "#f5f7fb" : "#141b2d";
    const muted = dark ? "#9ca8ba" : "#788496";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const frameX = phone ? 72 : 56;
    const frameY = phone ? 32 : 48;
    const frameW = phone ? width - 144 : width - 112;
    const frameH = height - (phone ? 90 : 128);
    roundedRect(ctx, frameX, frameY, frameW, frameH, phone ? 32 : 18, surface);
    ctx.strokeStyle = dark ? "#39465e" : "#d8dee7";
    ctx.lineWidth = 2;
    roundedRect(ctx, frameX, frameY, frameW, frameH, phone ? 32 : 18, null, ctx.strokeStyle);

    const topH = phone ? 65 : 76;
    ctx.fillStyle = dark ? "#20283a" : "#ffffff";
    ctx.fillRect(frameX, frameY, frameW, topH);
    ctx.fillStyle = "#ff0033";
    roundedRect(ctx, frameX + 22, frameY + 27, 31, 22, 7, "#ff0033");
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 13px Arial";
    ctx.fillText("▶", frameX + 32, frameY + 42);
    ctx.fillStyle = ink;
    ctx.font = `900 ${phone ? 20 : 25}px Arial`;
    ctx.fillText("YouTube", frameX + 60, frameY + 44);
    roundedRect(ctx, frameX + (phone ? 188 : 390), frameY + 20, phone ? 220 : 480, 36, 18, dark ? "#303a4d" : "#f3f5f8");
    ctx.fillStyle = muted;
    ctx.font = "600 14px Arial";
    ctx.fillText("Search", frameX + (phone ? 207 : 414), frameY + 43);
    ctx.fillStyle = ink;
    ctx.font = "700 21px Arial";
    ctx.fillText("⌕", frameX + (phone ? 374 : 825), frameY + 45);

    const contentX = frameX + (phone ? 20 : 32);
    const contentY = frameY + topH + 26;
    const contentW = frameW - (phone ? 40 : 64);
    ctx.fillStyle = dark ? "#303a4d" : "#f0f2f5";
    roundedRect(ctx, contentX, contentY, 60, 28, 8, dark ? "#d8ff5a" : "#141b2d");
    ctx.fillStyle = dark ? "#141b2d" : "#ffffff";
    ctx.font = "800 12px Arial";
    ctx.fillText("All", contentX + 21, contentY + 19);

    const cardW = phone ? contentW : contentW * 0.62;
    const imageY = contentY + 50;
    const imageH = cardW * 9 / 16;
    drawCover(ctx, state.image, contentX, imageY, cardW, imageH);
    roundedRect(ctx, contentX + cardW - 74, imageY + imageH - 30, 57, 21, 5, "rgba(0,0,0,.78)");
    ctx.fillStyle = "#fff";
    ctx.font = "800 12px Arial";
    ctx.fillText("12:45", contentX + cardW - 64, imageY + imageH - 15);
    const infoY = imageY + imageH + 23;
    ctx.fillStyle = "#d8ff5a";
    ctx.beginPath(); ctx.arc(contentX + 17, infoY + 15, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#141b2d";
    ctx.font = "900 10px Arial";
    ctx.fillText("CT", contentX + 7, infoY + 19);
    drawCanvasText(ctx, titleInput.value.trim() || "Your video title goes here", contentX + 46, infoY + 10, cardW - 68, "900 19px Arial", ink, 24, 2);
    ctx.fillStyle = muted;
    ctx.font = "600 13px Arial";
    ctx.fillText("Creator Toolkit", contentX + 46, infoY + 65);
    ctx.fillText("128K views · 2 days ago", contentX + 46, infoY + 86);

    if (!phone) {
      const smallX = contentX + cardW + 30;
      const smallW = contentW - cardW - 30;
      const colors = [["#ff6e57", "#be3249"], ["#687aff", "#293b99"], ["#b4e83c", "#2f8f83"]];
      ["MAKE IT CLEAR", "THE SMART CUT", "TINY DETAILS"].forEach((label, index) => {
        const y = imageY + index * 170;
        const gradient = ctx.createLinearGradient(smallX, y, smallX + smallW, y + 100);
        gradient.addColorStop(0, colors[index][0]); gradient.addColorStop(1, colors[index][1]);
        roundedRect(ctx, smallX, y, smallW, 102, 10, gradient);
        ctx.fillStyle = "#fff";
        ctx.font = "900 18px Arial";
        ctx.fillText(label, smallX + 14, y + 56);
        ctx.fillStyle = ink;
        ctx.font = "800 14px Arial";
        drawCanvasText(ctx, ["How to make ideas instantly clear", "The smart cut for busy creators", "The tiny details people notice"][index], smallX, y + 127, smallW, "800 14px Arial", ink, 18, 2);
        ctx.fillStyle = muted; ctx.font = "600 12px Arial"; ctx.fillText("Creator channel · 41K views", smallX, y + 163);
      });
    } else {
      const lowerY = infoY + 126;
      ["MAKE IT CLEAR", "THE SMART CUT", "TINY DETAILS"].forEach((label, index) => {
        const y = lowerY + index * 135;
        const gradient = ctx.createLinearGradient(contentX, y, contentX + contentW, y + 88);
        gradient.addColorStop(0, ["#ff6e57", "#687aff", "#b4e83c"][index]); gradient.addColorStop(1, ["#be3249", "#293b99", "#2f8f83"][index]);
        roundedRect(ctx, contentX, y, 166, 94, 10, gradient);
        ctx.fillStyle = "#fff"; ctx.font = "900 17px Arial"; ctx.fillText(label, contentX + 12, y + 52);
        drawCanvasText(ctx, ["How to make ideas instantly clear", "The smart cut for busy creators", "The tiny details people notice"][index], contentX + 184, y + 23, contentW - 184, "800 15px Arial", ink, 19, 2);
        ctx.fillStyle = muted; ctx.font = "600 12px Arial"; ctx.fillText("Creator channel · 41K views", contentX + 184, y + 71);
      });
    }

    ctx.fillStyle = muted;
    ctx.font = "700 12px Arial";
    ctx.fillText(`${phone ? "Phone" : "Desktop"} · ${dark ? "Dark" : "Light"} · Thumbnail Tester`, frameX, height - 28);
    const link = document.createElement("a");
    link.download = `thumbnail-preview-${state.mode}-${state.theme}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  fileInput.addEventListener("change", (event) => loadFile(event.target.files[0]));
  titleInput.addEventListener("input", (event) => setTitle(event.target.value));
  modeButtons.forEach((button) => button.addEventListener("click", () => { state.mode = button.dataset.mode; updateLabels(); }));
  themeButtons.forEach((button) => button.addEventListener("click", () => { state.theme = button.dataset.theme; updateLabels(); }));
  downloadButton.addEventListener("click", exportPreview);

  ["dragenter", "dragover"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add("is-dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove("is-dragging"); }));
  dropzone.addEventListener("drop", (event) => loadFile(event.dataTransfer.files[0]));
  document.addEventListener("paste", (event) => {
    const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const imageFile = imageItem.getAsFile();
    if (imageFile) loadFile(new File([imageFile], "pasted-thumbnail.png", { type: imageFile.type }));
  });

  setTitle(titleInput.value);
  updateLabels();
  restoreHandoff();
})();
