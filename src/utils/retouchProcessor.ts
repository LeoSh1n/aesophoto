import { RetouchConfig } from '../types/photobooth';

const retouchCache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Applies deterministic studio AI retouching (skin glow smoothing, shadow lift,
 * brightness balancing, and crisp clarity) directly on an HTML5 Canvas.
 * Levels 1, 2, 3 scale intensity cleanly.
 */
export async function applyStudioRetouch(
  src: string,
  retouch: RetouchConfig
): Promise<string> {
  if (!retouch.enabled) return src;

  const cacheKey = `${src.slice(0, 80)}_${src.length}_${retouch.strength}`;
  const cached = retouchCache.get(cacheKey);
  if (cached) return cached;

  const img = await loadImage(src);
  const width = img.naturalWidth || 1200;
  const height = img.naturalHeight || 900;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  // Create soft-glow blur layer for edge-preserving skin smoothing
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = width;
  glowCanvas.height = height;
  const glowCtx = glowCanvas.getContext('2d');

  // Strength tuning for 1, 2, 3
  const preset =
    retouch.strength === 1
      ? { blurPx: 3.5, softAlpha: 0.2, screenAlpha: 0.08, brightness: 1.04, contrast: 1.02, saturate: 1.02 }
      : retouch.strength === 2
      ? { blurPx: 6, softAlpha: 0.32, screenAlpha: 0.14, brightness: 1.08, contrast: 1.03, saturate: 1.04 }
      : { blurPx: 8.5, softAlpha: 0.44, screenAlpha: 0.2, brightness: 1.12, contrast: 1.04, saturate: 1.06 };

  // Base pass with studio tone lift
  ctx.filter = `brightness(${preset.brightness}) contrast(${preset.contrast}) saturate(${preset.saturate})`;
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';

  if (glowCtx) {
    glowCtx.filter = `blur(${preset.blurPx}px) brightness(1.06)`;
    glowCtx.drawImage(img, 0, 0, width, height);
    glowCtx.filter = 'none';

    // Blend smoothed layer via soft-light for smooth skin while preserving crisp contours
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = preset.softAlpha;
    ctx.drawImage(glowCanvas, 0, 0, width, height);

    // Subtle screen highlight lift for bright Korean photo booth glow
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = preset.screenAlpha;
    ctx.drawImage(glowCanvas, 0, 0, width, height);
    ctx.restore();
  }

  const outUrl = canvas.toDataURL('image/jpeg', 0.94);

  // Keep cache bounded
  if (retouchCache.size > 40) {
    const firstKey = retouchCache.keys().next().value;
    if (firstKey) retouchCache.delete(firstKey);
  }
  retouchCache.set(cacheKey, outUrl);

  return outUrl;
}

/**
 * Returns live CSS filter preview string combining retouch brightness lift + color/mono filter
 */
export function buildLivePreviewCssFilter(
  baseCssFilter: string,
  retouch: RetouchConfig
): string {
  const base = baseCssFilter === 'none' ? '' : baseCssFilter;
  if (!retouch.enabled) return base || 'none';

  const retouchCss =
    retouch.strength === 1
      ? 'brightness(105%) contrast(102%)'
      : retouch.strength === 2
      ? 'brightness(110%) contrast(103%) saturate(104%)'
      : 'brightness(115%) contrast(104%) saturate(106%)';

  return `${retouchCss} ${base}`.trim();
}
