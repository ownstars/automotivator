(() => {
  "use strict";

  const canvas = document.getElementById("poster-canvas");
  const ctx = canvas.getContext("2d");

  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const titleInput = document.getElementById("title-input");
  const subtitleInput = document.getElementById("subtitle-input");
  const titleColor = document.getElementById("title-color");
  const titleFont = document.getElementById("title-font");
  const posterSize = document.getElementById("poster-size");
  const uppercaseToggle = document.getElementById("uppercase-toggle");
  const borderToggle = document.getElementById("border-toggle");
  const downloadBtn = document.getElementById("download-btn");
  const sampleBtn = document.getElementById("sample-btn");

  const FONTS = {
    serif: '"Times New Roman", Times, Georgia, serif',
    sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    slab: '"Courier New", Courier, monospace',
  };

  let image = null;

  // ---------- image loading ----------

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      image = img;
      render();
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", () => loadFile(fileInput.files[0]));

  ["dragenter", "dragover"].forEach((type) =>
    dropZone.addEventListener(type, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((type) =>
    dropZone.addEventListener(type, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    })
  );
  dropZone.addEventListener("drop", (e) => loadFile(e.dataTransfer.files[0]));

  document.addEventListener("paste", (e) => {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        loadFile(item.getAsFile());
        return;
      }
    }
  });

  // ---------- procedurally drawn sample image ----------

  sampleBtn.addEventListener("click", () => {
    const c = document.createElement("canvas");
    c.width = 900;
    c.height = 600;
    const g = c.getContext("2d");

    // dusk sky
    const sky = g.createLinearGradient(0, 0, 0, c.height);
    sky.addColorStop(0, "#1d2a52");
    sky.addColorStop(0.55, "#b3547a");
    sky.addColorStop(0.8, "#f2a65a");
    g.fillStyle = sky;
    g.fillRect(0, 0, c.width, c.height);

    // sun
    g.fillStyle = "#ffe9b0";
    g.beginPath();
    g.arc(c.width * 0.62, c.height * 0.62, 70, 0, Math.PI * 2);
    g.fill();

    // mountain layers
    const ranges = [
      { color: "#3c2f52", base: 0.68, jag: 90, seed: 3 },
      { color: "#2a2140", base: 0.8, jag: 70, seed: 7 },
      { color: "#191430", base: 0.92, jag: 50, seed: 11 },
    ];
    for (const r of ranges) {
      g.fillStyle = r.color;
      g.beginPath();
      g.moveTo(0, c.height);
      for (let x = 0; x <= c.width; x += 30) {
        const wobble =
          Math.sin((x / c.width) * Math.PI * r.seed) * r.jag +
          Math.sin((x / c.width) * Math.PI * r.seed * 2.7) * (r.jag / 3);
        g.lineTo(x, c.height * r.base - Math.abs(wobble));
      }
      g.lineTo(c.width, c.height);
      g.closePath();
      g.fill();
    }

    // a lone climber flag on the tallest peak
    g.strokeStyle = "#0d0a1c";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(c.width * 0.335, c.height * 0.395);
    g.lineTo(c.width * 0.335, c.height * 0.33);
    g.stroke();
    g.fillStyle = "#e74c3c";
    g.beginPath();
    g.moveTo(c.width * 0.335, c.height * 0.33);
    g.lineTo(c.width * 0.38, c.height * 0.35);
    g.lineTo(c.width * 0.335, c.height * 0.37);
    g.closePath();
    g.fill();

    const img = new Image();
    img.onload = () => {
      image = img;
      render();
    };
    img.src = c.toDataURL("image/png");
  });

  // ---------- text helpers ----------

  function wrapText(text, maxWidth) {
    const lines = [];
    for (const paragraph of text.split("\n")) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;
      let line = words[0];
      for (const word of words.slice(1)) {
        if (ctx.measureText(line + " " + word).width <= maxWidth) {
          line += " " + word;
        } else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function fitFontSize(text, fontFor, targetSize, minSize, maxWidth) {
    let size = targetSize;
    while (size > minSize) {
      ctx.font = fontFor(size);
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  }

  // ---------- poster rendering ----------

  function render() {
    const posterW = parseInt(posterSize.value, 10);
    const family = FONTS[titleFont.value];

    let title = titleInput.value.trim();
    if (uppercaseToggle.checked) title = title.toUpperCase();
    const subtitle = subtitleInput.value.trim();

    // layout metrics, all proportional to poster width
    const padSide = Math.round(posterW * 0.016);
    const padTop = Math.round(posterW * 0.016);
    const imgMaxW = posterW - padSide * 2;
    const imgMaxH = Math.round(posterW * 0.85);

    // scale image to fit
    let imgW = imgMaxW;
    let imgH = Math.round(imgMaxW * 0.66);
    if (image) {
      const scale = Math.min(imgMaxW / image.width, imgMaxH / image.height);
      imgW = Math.round(image.width * scale);
      imgH = Math.round(image.height * scale);
    }

    // title sizing: bold small-caps scaled to span ~78% of the poster width,
    // like the classic posters, clamped so short titles don't become huge
    if (canvas.width !== posterW) canvas.width = posterW; // font measure needs a ctx
    ctx.letterSpacing = "0.03em";
    const titleFor = (s) => `small-caps bold ${s}px ${family}`;
    let titleSize = 0;
    if (title) {
      ctx.font = titleFor(100);
      const widthAt100 = ctx.measureText(title).width;
      titleSize = Math.round((posterW * 0.78) / widthAt100 * 100);
      titleSize = Math.max(Math.round(posterW / 26), Math.min(titleSize, Math.round(posterW / 6)));
      titleSize = fitFontSize(title, titleFor, titleSize, Math.round(posterW / 26), imgMaxW);
    }

    // subtitle wrapping (small-caps with wide tracking)
    const subSize = Math.max(13, Math.round(posterW / 38));
    ctx.letterSpacing = "0.12em";
    ctx.font = `small-caps ${subSize}px ${family}`;
    const subLines = subtitle ? wrapText(subtitle, imgMaxW) : [];
    const subLineH = Math.round(subSize * 1.5);

    // vertical layout
    const gapImgTitle = Math.round(posterW * 0.02);
    const ruleGap = Math.round(posterW * 0.012);
    const ruleH = Math.max(2, Math.round(posterW / 320));
    const gapTitleSub = Math.round(posterW * 0.022);
    const padBottom = Math.round(posterW * 0.045);

    let textBlockH = 0;
    if (titleSize) textBlockH += titleSize + ruleGap + ruleH;
    if (subLines.length) {
      if (titleSize) textBlockH += gapTitleSub;
      textBlockH += subLines.length * subLineH;
    }

    const posterH =
      padTop + imgH + (textBlockH ? gapImgTitle + textBlockH : gapImgTitle) + padBottom;

    canvas.width = posterW;
    canvas.height = posterH;

    // background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, posterW, posterH);

    // image (or placeholder)
    const imgX = Math.round((posterW - imgW) / 2);
    const imgY = padTop;
    if (image) {
      ctx.drawImage(image, imgX, imgY, imgW, imgH);
    } else {
      const ph = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
      ph.addColorStop(0, "#2b2f3a");
      ph.addColorStop(1, "#171a21");
      ctx.fillStyle = ph;
      ctx.fillRect(imgX, imgY, imgW, imgH);
      ctx.fillStyle = "#8a8fa0";
      ctx.letterSpacing = "0.05em";
      ctx.font = `${Math.round(posterW / 32)}px ${FONTS.sans}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Your image goes here", posterW / 2, imgY + imgH / 2);
    }

    // classic thin white frame, offset from the image edge
    if (borderToggle.checked) {
      const off = Math.max(3, Math.round(posterW / 260));
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1.5, posterW / 500);
      ctx.strokeRect(
        imgX - off + 0.5,
        imgY - off + 0.5,
        imgW + off * 2 - 1,
        imgH + off * 2 - 1
      );
    }

    // title with underline rule, both in the title color
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let cursorY = imgY + imgH + gapImgTitle;
    if (titleSize) {
      cursorY += titleSize;
      ctx.letterSpacing = "0.03em";
      ctx.font = titleFor(titleSize);
      ctx.fillStyle = titleColor.value;
      // letter-spacing trails the last glyph; nudge left by half to re-center
      const trail = titleSize * 0.015;
      ctx.fillText(title, posterW / 2 - trail, cursorY);
      const ruleW = Math.min(ctx.measureText(title).width, imgMaxW);
      cursorY += ruleGap;
      ctx.fillRect(Math.round((posterW - ruleW) / 2), cursorY, Math.round(ruleW), ruleH);
      cursorY += ruleH;
    }

    // subtitle in letter-spaced small caps
    if (subLines.length) {
      if (titleSize) cursorY += gapTitleSub;
      ctx.letterSpacing = "0.12em";
      ctx.font = `small-caps ${subSize}px ${family}`;
      ctx.fillStyle = "#cccccc";
      for (const line of subLines) {
        cursorY += subLineH;
        ctx.fillText(line, posterW / 2, cursorY - (subLineH - subSize) / 2);
      }
    }
  }

  // ---------- download ----------

  downloadBtn.addEventListener("click", () => {
    const name = (titleInput.value.trim() || "poster")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "poster";
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  });

  // ---------- live updates ----------

  [titleInput, subtitleInput].forEach((el) => el.addEventListener("input", render));
  [titleColor, titleFont, posterSize, uppercaseToggle, borderToggle].forEach((el) =>
    el.addEventListener("change", render)
  );

  render();
})();
