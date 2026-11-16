import { PaperSizeId, PrintSettings } from '../types/photobooth';

export const PAPER_SPECS: Record<
  PaperSizeId,
  {
    label: string;
    desc: string;
    widthMm: number;
    heightMm: number;
    canvasW: number;
    canvasH: number;
  }
> = {
  '4x6': {
    label: '4×6 인화지',
    desc: '100 × 150 mm · 포토 프린터 표준',
    widthMm: 100,
    heightMm: 150,
    canvasW: 1200,
    canvasH: 1800,
  },
  a4: {
    label: 'A4 용지',
    desc: '210 × 297 mm · 일반 가정/사무용',
    widthMm: 210,
    heightMm: 297,
    canvasW: 1754,
    canvasH: 2480,
  },
  '2x6': {
    label: '2×6 스트립',
    desc: '50 × 150 mm · 미니 포토부스 전용',
    widthMm: 50,
    heightMm: 150,
    canvasW: 600,
    canvasH: 1800,
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawCropCornerMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const len = 18;
  const offset = 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x - offset - len, y);
  ctx.lineTo(x - offset, y);
  ctx.moveTo(x, y - offset - len);
  ctx.lineTo(x, y - offset);
  // Top-right
  ctx.moveTo(x + w + offset, y);
  ctx.lineTo(x + w + offset + len, y);
  ctx.moveTo(x + w, y - offset - len);
  ctx.lineTo(x + w, y - offset);
  // Bottom-left
  ctx.moveTo(x - offset - len, y + h);
  ctx.lineTo(x - offset, y + h);
  ctx.moveTo(x, y + h + offset);
  ctx.lineTo(x, y + h + offset + len);
  // Bottom-right
  ctx.moveTo(x + w + offset, y + h);
  ctx.lineTo(x + w + offset + len, y + h);
  ctx.moveTo(x + w, y + h + offset);
  ctx.lineTo(x + w, y + h + offset + len);

  ctx.stroke();
  ctx.restore();
}

/**
 * Generates an exact paper-proportioned sheet DataURL for preview, download, and OS printing.
 */
export async function composePrintSheet(
  stripDataUrl: string,
  settings: PrintSettings
): Promise<string> {
  const img = await loadImage(stripDataUrl);
  const spec = PAPER_SPECS[settings.paperSize];

  const sheet = document.createElement('canvas');
  sheet.width = spec.canvasW;
  sheet.height = spec.canvasH;

  const ctx = sheet.getContext('2d');
  if (!ctx) return stripDataUrl;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  const imgRatio = img.naturalWidth / img.naturalHeight;
  const isVerticalStrip = imgRatio < 0.65; // 1x4 strip vs 2x2 grid or double strip

  // Determine grid arrangement on paper based on paperSize & strip orientation
  let cols = 1;
  let rows = 1;

  if (settings.paperSize === '4x6') {
    if (isVerticalStrip) {
      cols = 2; // Two 1x4 strips fit side by side on a 4x6 sheet cleanly!
      rows = 1;
    } else {
      cols = 1;
      rows = 1;
    }
  } else if (settings.paperSize === 'a4') {
    if (isVerticalStrip) {
      cols = settings.copies >= 2 ? 2 : 1;
      rows = settings.copies >= 3 ? 2 : 1;
    } else {
      cols = settings.copies >= 2 ? 2 : 1;
      rows = settings.copies >= 3 ? 2 : 1;
    }
  } else {
    // 2x6 single strip paper
    cols = 1;
    rows = 1;
  }

  const marginX = Math.round(sheet.width * 0.055);
  const marginY = Math.round(sheet.height * 0.05);
  const gapX = cols > 1 ? Math.round(sheet.width * 0.04) : 0;
  const gapY = rows > 1 ? Math.round(sheet.height * 0.04) : 0;

  const cellW = (sheet.width - marginX * 2 - gapX * (cols - 1)) / cols;
  const cellH = (sheet.height - marginY * 2 - gapY * (rows - 1)) / rows;

  const totalPlacements = Math.min(cols * rows, Math.max(1, settings.copies));

  for (let i = 0; i < totalPlacements; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Center single item when only 1 copy on 4x6 or A4
    let cellX = marginX + col * (cellW + gapX);
    let cellY = marginY + row * (cellH + gapY);

    if (totalPlacements === 1 && cols > 1) {
      cellX = (sheet.width - cellW) / 2;
    }

    // Fit image inside cell preserving aspect ratio
    let drawW = cellW;
    let drawH = drawW / imgRatio;
    if (drawH > cellH) {
      drawH = cellH;
      drawW = drawH * imgRatio;
    }

    const drawX = cellX + (cellW - drawW) / 2;
    const drawY = cellY + (cellH - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    if (settings.showCropMarks) {
      drawCropCornerMarks(ctx, drawX, drawY, drawW, drawH);
    }
  }

  return sheet.toDataURL('image/png', 0.96);
}

/**
 * Compresses a strip image into a lightweight JPEG thumbnail (~360px wide) for guestbook attachments.
 */
export async function createGuestbookThumbnail(
  stripDataUrl: string
): Promise<string> {
  const img = await loadImage(stripDataUrl);
  const targetW = 360;
  const targetH = Math.round((img.naturalHeight / img.naturalWidth) * targetW);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return stripDataUrl;
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Triggers real OS printer dialog using a dedicated hidden iframe with exact @page dimensions.
 * Works reliably inside embedded iframes without calling window.open().
 */
export function triggerHardwarePrinter(
  sheetDataUrl: string,
  paperSize: PaperSizeId
): Promise<void> {
  return new Promise((resolve) => {
    const spec = PAPER_SPECS[paperSize];

    const existing = document.getElementById('aesophoto-print-iframe');
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'aesophoto-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      window.print();
      resolve();
      return;
    }

    doc.open();
    doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>aesophoto Print</title>
    <style>
      @page {
        size: ${spec.widthMm}mm ${spec.heightMm}mm;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      img {
        width: 100%;
        height: 100%;
        max-width: ${spec.widthMm}mm;
        max-height: ${spec.heightMm}mm;
        object-fit: contain;
        display: block;
      }
    </style>
  </head>
  <body>
    <img id="print-img" src="${sheetDataUrl}" alt="aesophoto print" />
  </body>
</html>`);
    doc.close();

    const imgEl = doc.getElementById('print-img') as HTMLImageElement | null;
    const executePrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(() => {
        resolve();
      }, 300);
    };

    if (imgEl && !imgEl.complete) {
      imgEl.onload = () => setTimeout(executePrint, 60);
      imgEl.onerror = () => executePrint();
    } else {
      setTimeout(executePrint, 80);
    }
  });
}
