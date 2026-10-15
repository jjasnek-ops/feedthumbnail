(() => {
  const form = document.querySelector("#downloaderForm");
  const linksInput = document.querySelector("#videoLinks");
  const clearButton = document.querySelector("#clearLinks");
  const status = document.querySelector("#downloaderStatus");
  const results = document.querySelector("#downloaderResults");
  const emptyState = document.querySelector("#resultsEmpty");

  // These are the exact YouTube CDN filenames tested against a real public video.
  // The UI still reads naturalWidth/naturalHeight from every loaded image.
  const thumbnailFiles = [
    { file: "maxresdefault.jpg", label: "Max resolution file" },
    { file: "sddefault.jpg", label: "Standard file" },
    { file: "hqdefault.jpg", label: "High quality file" },
    { file: "mqdefault.jpg", label: "Medium quality file" },
    { file: "default.jpg", label: "Small file" },
  ];

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function parseVideoId(rawValue) {
    const raw = rawValue.trim();
    if (!raw) return null;
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    let url;
    try { url = new URL(raw); } catch { return null; }
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) return null;
    let candidate = "";
    if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] || "";
    if (!candidate && (url.pathname === "/watch" || url.pathname === "/watch/")) candidate = url.searchParams.get("v") || "";
    if (!candidate) {
      const segments = url.pathname.split("/").filter(Boolean);
      const markerIndex = segments.findIndex((segment) => ["shorts", "embed", "live", "v"].includes(segment));
      if (markerIndex >= 0) candidate = segments[markerIndex + 1] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
  }

  function makeUrl(videoId, file) {
    return `https://i.ytimg.com/vi/${videoId}/${file}`;
  }

  function setStatus(message, kind = "") {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function setCardUnavailable(card) {
    card.remove();
  }

  function addThumbnailCard(grid, videoId, fileSpec, groupStatus) {
    const imageUrl = makeUrl(videoId, fileSpec.file);
    const card = document.createElement("article");
    card.className = "thumbnail-file-card is-loading";
    card.innerHTML = `
      <div class="thumbnail-file-image-wrap"><img alt="${escapeHtml(fileSpec.label)} for video ${escapeHtml(videoId)}" /></div>
      <div class="thumbnail-file-meta">
        <div><span class="thumbnail-file-label">${escapeHtml(fileSpec.label)}</span><strong class="thumbnail-file-name">${escapeHtml(fileSpec.file)}</strong></div>
        <span class="thumbnail-file-dimensions">Checking image…</span>
      </div>
      <div class="thumbnail-file-actions">
        <a class="file-action save-action" href="${imageUrl}" download="${videoId}-${fileSpec.file}" target="_blank" rel="noopener">Save image ↗</a>
        <button class="file-action preview-action" type="button">Preview in tool ↗</button>
      </div>`;
    const image = card.querySelector("img");
    const dimensions = card.querySelector(".thumbnail-file-dimensions");
    const previewButton = card.querySelector(".preview-action");
    image.addEventListener("load", () => {
      card.classList.remove("is-loading");
      card.classList.add("is-ready");
      dimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
      groupStatus.loaded += 1;
    });
    image.addEventListener("error", () => {
      groupStatus.failed += 1;
      setCardUnavailable(card);
    });
    previewButton.addEventListener("click", () => sendToPreview(imageUrl, `${videoId}-${fileSpec.file}`));
    image.src = imageUrl;
    grid.append(card);
  }

  function addVideoGroup(videoId, originalValue, position) {
    const group = document.createElement("article");
    group.className = "download-result";
    group.innerHTML = `
      <div class="download-result-heading">
        <div><span class="section-kicker">VIDEO ${String(position).padStart(2, "0")}</span><h2>${escapeHtml(videoId)}</h2><p title="${escapeHtml(originalValue)}">${escapeHtml(originalValue)}</p></div>
        <button class="save-all-button" type="button">Save all available</button>
      </div>
      <div class="thumbnail-file-grid"></div>`;
    const grid = group.querySelector(".thumbnail-file-grid");
    const saveAll = group.querySelector(".save-all-button");
    const groupStatus = { loaded: 0, failed: 0 };
    thumbnailFiles.forEach((fileSpec) => addThumbnailCard(grid, videoId, fileSpec, groupStatus));
    saveAll.addEventListener("click", () => {
      const anchors = Array.from(grid.querySelectorAll("a.save-action"));
      anchors.forEach((anchor, index) => setTimeout(() => anchor.click(), index * 180));
      setStatus(`Started ${anchors.length} save action${anchors.length === 1 ? "" : "s"} for ${videoId}. Your browser may ask to allow multiple downloads.`, "success");
    });
    results.append(group);
  }

  async function sendToPreview(imageUrl, fileName) {
    setStatus("Preparing this image for the local preview tool…");
    try {
      const response = await fetch(imageUrl, { mode: "cors", cache: "force-cache" });
      if (!response.ok) throw new Error(`Image request returned ${response.status}`);
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("Could not read image"));
        reader.readAsDataURL(blob);
      });
      sessionStorage.setItem("thumbnailTesterHandoff", JSON.stringify({ dataUrl, name: fileName, sourceUrl: imageUrl }));
      window.location.href = "/?handoff=1";
    } catch (error) {
      setStatus("The browser could not hand this file into the preview. The direct image opened in a new tab instead.", "error");
      window.open(imageUrl, "_blank", "noopener");
    }
  }

  function runLookup(event) {
    event.preventDefault();
    const values = linksInput.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    results.querySelectorAll(".download-result").forEach((node) => node.remove());
    emptyState.hidden = true;
    if (!values.length) {
      emptyState.hidden = false;
      setStatus("Paste at least one YouTube link or video ID.", "error");
      return;
    }
    let valid = 0;
    let invalid = 0;
    values.forEach((value, index) => {
      const videoId = parseVideoId(value);
      if (!videoId) { invalid += 1; return; }
      valid += 1;
      addVideoGroup(videoId, value, valid);
    });
    if (!valid) {
      emptyState.hidden = false;
      setStatus("No valid YouTube video links were found. Use one link per line.", "error");
      return;
    }
    const invalidText = invalid ? ` ${invalid} line${invalid === 1 ? " was" : "s were"} skipped.` : "";
    setStatus(`Checking ${valid} video${valid === 1 ? "" : "s"}.${invalidText} Cards remain only when the direct image file loads.`, "success");
  }

  form.addEventListener("submit", runLookup);
  clearButton.addEventListener("click", () => {
    linksInput.value = "";
    results.querySelectorAll(".download-result").forEach((node) => node.remove());
    emptyState.hidden = false;
    setStatus("No links checked yet.");
    linksInput.focus();
  });
})();
