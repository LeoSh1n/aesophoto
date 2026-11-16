import { FRAME_THEMES, PHOTO_FILTERS } from '../constants/studioPresets';
import { FrameThemeOption, StripConfig } from '../types/photobooth';
import { applyStudioRetouch } from './retouchProcessor';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = dWidth / dHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = img.naturalWidth;
  let sHeight = img.naturalHeight;

  if (imgRatio > targetRatio) {
    sWidth = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sWidth) / 2;
  } else {
    sHeight = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}

export function formatStudioDate(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  theme: FrameThemeOption,
  width: number,
  height: number,
  footerH: number
) {
  if (theme.patternType === 'gradient' && theme.bgSecondaryHex) {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, theme.bgHex);
    grad.addColorStop(1, theme.bgSecondaryHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (theme.patternType === 'y2k-chrome' && theme.bgSecondaryHex) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#F1F5F9');
    grad.addColorStop(0.32, '#94A3B8');
    grad.addColorStop(0.6, '#E2E8F0');
    grad.addColorStop(0.85, '#64748B');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Y2K metallic grid & star motif in footer
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, width - 36, height - 36);
    ctx.strokeStyle = 'rgba(15,23,42,0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, width - 52, height - 52);
    ctx.restore();
    return;
  }

  if (theme.patternType === 'checker' && theme.bgSecondaryHex) {
    const cellSize = 40;
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? theme.bgHex : theme.bgSecondaryHex;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // Solid clean band at the footer so branding text stays 100% legible
    ctx.fillStyle = theme.bgHex;
    ctx.fillRect(0, height - footerH, width, footerH);
    ctx.fillStyle = theme.bgSecondaryHex;
    ctx.fillRect(0, height - footerH, width, 4);
    return;
  }

  if (theme.patternType === 'dots' && theme.bgSecondaryHex) {
    ctx.fillStyle = theme.bgHex;
    ctx.fillRect(0, 0, width, height);

    const spacing = 44;
    ctx.fillStyle = theme.bgSecondaryHex;
    for (let y = 22; y < height - footerH + 10; y += spacing) {
      const offset = Math.floor(y / spacing) % 2 === 0 ? 0 : spacing / 2;
      for (let x = 22 + offset; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  // Solid or Film / Editorial base
  ctx.fillStyle = theme.bgHex;
  ctx.fillRect(0, 0, width, height);

  if (theme.patternType === 'editorial') {
    // Editorial hairline border & masthead top rule
    ctx.strokeStyle = theme.textHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    ctx.fillStyle = theme.textHex;
    ctx.font = '600 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('ISSUE NO. 04', 64, 48);
    ctx.textAlign = 'right';
    ctx.fillText('SEOUL EDITION', width - 64, 48);
  }

  if (
    theme.id === 'pure-white' ||
    theme.id === 'warm-paper' ||
    theme.id === 'haru-sky' ||
    theme.id === 'blush-pink' ||
    theme.id === 'butter-cream' ||
    theme.id === 'lavender-haze'
  ) {
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
  }
}

function drawFilmSprockets(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  footerH: number
) {
  const holeW = 24;
  const holeH = 34;
  const holeGap = 68;
  const leftX = 18;
  const rightX = width - 18 - holeW;

  ctx.save();
  ctx.fillStyle = '#27272A';
  for (let y = 38; y < height - footerH + 40; y += holeGap) {
    // Left sprocket hole
    ctx.beginPath();
    ctx.roundRect(leftX, y, holeW, holeH, 5);
    ctx.fill();
    // Right sprocket hole
    ctx.beginPath();
    ctx.roundRect(rightX, y, holeW, holeH, 5);
    ctx.fill();
  }
  ctx.restore();
}

function drawY2KSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.quadraticCurveTo(cx, cy, cx + size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + size);
  ctx.quadraticCurveTo(cx, cy, cx - size, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export async function renderSingleStripCanvas(
  cuts: (string | null)[],
  config: StripConfig
): Promise<HTMLCanvasElement> {
  const theme =
    FRAME_THEMES.find((t) => t.id === config.frameTheme) ?? FRAME_THEMES[0];
  const filterOpt =
    PHOTO_FILTERS.find((f) => f.id === config.filter) ?? PHOTO_FILTERS[0];

  const loadedImages = await Promise.all(
    [0, 1, 2, 3].map(async (idx) => {
      const src = cuts[idx];
      if (!src) return null;
      try {
        const retouchedSrc = await applyStudioRetouch(src, config.retouch);
        return await loadImage(retouchedSrc);
      } catch {
        return null;
      }
    })
  );

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  if (config.layout === '1x4') {
    const width = 1000;
    const padX = theme.patternType === 'film-sprocket' ? 76 : 64;
    const padTop = theme.patternType === 'editorial' ? 84 : 72;
    const gap = 36;
    const slotW = width - padX * 2;
    const slotH = Math.round(slotW * 0.72);
    const footerH = 260;
    const height = padTop + slotH * 4 + gap * 3 + footerH;

    canvas.width = width;
    canvas.height = height;

    drawFrameBackground(ctx, theme, width, height, footerH);

    if (theme.patternType === 'film-sprocket') {
      drawFilmSprockets(ctx, width, height, footerH);
    }

    for (let i = 0; i < 4; i++) {
      const x = padX;
      const y = padTop + i * (slotH + gap);
      const img = loadedImages[i];

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, slotW, slotH);
      ctx.clip();

      if (img) {
        ctx.filter = filterOpt.cssFilter;
        drawImageCover(ctx, img, x, y, slotW, slotH);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle =
          theme.id === 'jet-black' ||
          theme.id === 'studio-gray' ||
          theme.id === 'film-roll' ||
          theme.id === 'polka-dot'
            ? '#161618'
            : '#E4E4E7';
        ctx.fillRect(x, y, slotW, slotH);
        ctx.fillStyle = theme.mutedHex;
        ctx.font = '500 28px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`CUT 0${i + 1}`, x + slotW / 2, y + slotH / 2);
      }
      ctx.restore();

      ctx.strokeStyle = theme.slotBorderHex;
      ctx.lineWidth = theme.patternType === 'checker' || theme.patternType === 'y2k-chrome' ? 4 : 2;
      ctx.strokeRect(x, y, slotW, slotH);

      if (theme.patternType === 'film-sprocket') {
        ctx.fillStyle = theme.mutedHex;
        ctx.font = '600 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(`0${i + 1}A`, x + slotW - 12, y + 10);
      }
    }

    const footerCenterY = height - footerH / 2;

    if (theme.patternType === 'y2k-chrome') {
      drawY2KSparkle(ctx, 130, footerCenterY - 12, 22, '#FFFFFF');
      drawY2KSparkle(ctx, width - 130, footerCenterY + 14, 18, '#0F172A');
    }

    ctx.fillStyle = theme.textHex;
    ctx.font = '700 54px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hasMeta = config.showDate || config.caption.trim().length > 0;
    ctx.fillText(
      'aesophoto',
      width / 2,
      hasMeta ? footerCenterY - 26 : footerCenterY
    );

    if (hasMeta) {
      const parts: string[] = [];
      if (config.caption.trim().length > 0) parts.push(config.caption.trim());
      if (config.showDate) parts.push(formatStudioDate());
      const metaLine = parts.join('  ·  ');

      ctx.fillStyle = theme.mutedHex;
      ctx.font = '500 24px "JetBrains Mono", "Noto Sans KR", monospace';
      ctx.fillText(metaLine, width / 2, footerCenterY + 34);
    }
  } else {
    // 2x2 Grid Photo Frame
    const width = 1600;
    const padX = theme.patternType === 'film-sprocket' ? 88 : 72;
    const padTop = theme.patternType === 'editorial' ? 88 : 72;
    const gap = 36;
    const slotW = (width - padX * 2 - gap) / 2;
    const slotH = Math.round(slotW * 0.75);
    const footerH = 210;
    const height = padTop + slotH * 2 + gap + footerH;

    canvas.width = width;
    canvas.height = height;

    drawFrameBackground(ctx, theme, width, height, footerH);

    if (theme.patternType === 'film-sprocket') {
      drawFilmSprockets(ctx, width, height, footerH);
    }

    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = padX + col * (slotW + gap);
      const y = padTop + row * (slotH + gap);
      const img = loadedImages[i];

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, slotW, slotH);
      ctx.clip();

      if (img) {
        ctx.filter = filterOpt.cssFilter;
        drawImageCover(ctx, img, x, y, slotW, slotH);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle =
          theme.id === 'jet-black' ||
          theme.id === 'studio-gray' ||
          theme.id === 'film-roll' ||
          theme.id === 'polka-dot'
            ? '#161618'
            : '#E4E4E7';
        ctx.fillRect(x, y, slotW, slotH);
        ctx.fillStyle = theme.mutedHex;
        ctx.font = '500 26px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`CUT 0${i + 1}`, x + slotW / 2, y + slotH / 2);
      }
      ctx.restore();

      ctx.strokeStyle = theme.slotBorderHex;
      ctx.lineWidth = theme.patternType === 'checker' || theme.patternType === 'y2k-chrome' ? 4 : 2;
      ctx.strokeRect(x, y, slotW, slotH);
    }

    const footerBaselineY = height - footerH / 2 + 4;
    ctx.fillStyle = theme.textHex;
    ctx.font = '700 46px "Outfit", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('aesophoto', padX, footerBaselineY);

    if (theme.patternType === 'y2k-chrome') {
      drawY2KSparkle(ctx, padX + 250, footerBaselineY - 4, 16, '#FFFFFF');
    }

    const parts: string[] = [];
    if (config.caption.trim().length > 0) parts.push(config.caption.trim());
    if (config.showDate) parts.push(formatStudioDate());
    if (parts.length > 0) {
      ctx.fillStyle = theme.mutedHex;
      ctx.font = '500 22px "JetBrains Mono", "Noto Sans KR", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(parts.join('  ·  '), width - padX, footerBaselineY);
    }
  }

  return canvas;
}

export async function renderPrintableSheetDataUrl(
  cuts: (string | null)[],
  config: StripConfig
): Promise<string> {
  const singleCanvas = await renderSingleStripCanvas(cuts, config);

  if (config.layout === '1x4' && config.doublePrintSheet) {
    const gap = 48;
    const sheetMargin = 48;
    const sheet = document.createElement('canvas');
    sheet.width = singleCanvas.width * 2 + gap + sheetMargin * 2;
    sheet.height = singleCanvas.height + sheetMargin * 2;

    const ctx = sheet.getContext('2d');
    if (!ctx) return singleCanvas.toDataURL('image/png', 0.96);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheet.width, sheet.height);

    const leftX = sheetMargin;
    const rightX = sheetMargin + singleCanvas.width + gap;
    ctx.drawImage(singleCanvas, leftX, sheetMargin);
    ctx.drawImage(singleCanvas, rightX, sheetMargin);

    const cutX = sheetMargin + singleCanvas.width + gap / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(cutX, sheetMargin);
    ctx.lineTo(cutX, sheet.height - sheetMargin);
    ctx.stroke();
    ctx.restore();

    return sheet.toDataURL('image/png', 0.96);
  }

  return singleCanvas.toDataURL('image/png', 0.96);
}

export async function renderStripDataUrl(
  cuts: (string | null)[],
  config: StripConfig
): Promise<string> {
  const canvas = await renderSingleStripCanvas(cuts, config);
  return canvas.toDataURL('image/png', 0.96);
}
