import type { BlueprintAsset } from '@app-viz/schema';

export const MAX_ASSET_BYTES = 2 * 1024 * 1024;

const RASTER_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']);
export const ACCEPT_ATTR = '.svg,image/svg+xml,image/png,image/jpeg,image/gif,image/webp,image/avif';

/** Elements that can execute script or pull in external documents. */
const BLOCKED_ELEMENTS = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'audio', 'video', 'handler', 'listener'];

/**
 * Parses SVG markup with the browser's XML parser (never executes anything) and strips script,
 * event handlers, `javascript:` / external `data:` URLs and embedded documents. Returns the
 * cleaned markup, or throws with a readable message when the markup is not a valid SVG.
 */
export function sanitizeSvg(raw: string): string {
  const doc = new DOMParser().parseFromString(raw.trim(), 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('The SVG markup could not be parsed.');
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== 'svg') throw new Error('The markup must start with an <svg> element.');
  for (const tag of BLOCKED_ELEMENTS) {
    for (const el of Array.from(root.getElementsByTagName(tag))) el.remove();
  }
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.replace(/[\s\u0000-\u001f]+/g, '').toLowerCase();
      const isLink = name === 'href' || name === 'xlink:href' || name === 'src';
      if (
        name.startsWith('on') ||
        value.includes('javascript:') ||
        (isLink && value.startsWith('data:') && !value.startsWith('data:image/')) ||
        (isLink && /^(https?:)?\/\//.test(value)) ||
        (name === 'style' && /expression\(|url\((?!['"]?#)/.test(value))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(root);
}

/** Intrinsic size from width/height attributes, else from the viewBox. */
export function svgDimensions(svg: string): { width?: number; height?: number } {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  const num = (v: string | null) => {
    const n = v ? Number.parseFloat(v) : Number.NaN;
    return Number.isFinite(n) && n > 0 && !/%$/.test(v ?? '') ? Math.round(n) : undefined;
  };
  const w = num(root.getAttribute('width'));
  const h = num(root.getAttribute('height'));
  if (w && h) return { width: w, height: h };
  const vb = (root.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) return { width: Math.round(vb[2]), height: Math.round(vb[3]) };
  return {};
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function rasterDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('The image could not be decoded.'));
    img.src = src;
  });
}

function readFile(file: File, as: 'text' | 'dataUrl'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('The file could not be read.'));
    if (as === 'text') reader.readAsText(file);
    else reader.readAsDataURL(file);
  });
}

export function safeFilename(name: string, fallback = 'asset'): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-{2,}/g, '-').replace(/^[-.]+/, '');
  return cleaned || fallback;
}

/** `logo.svg` -> `logo-2.svg` when the name is already used by another asset. */
export function uniqueFilename(name: string, taken: Iterable<string>): string {
  const used = new Set(Array.from(taken, (n) => n.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 2; ; i++) {
    const candidate = `${stem}-${i}${ext}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

/** Validates and converts an uploaded file into a project asset. Throws with a user-facing message. */
export async function fileToAsset(file: File, takenNames: Iterable<string>): Promise<BlueprintAsset> {
  if (file.size > MAX_ASSET_BYTES) throw new Error(`“${file.name}” is larger than the 2 MB limit.`);
  const svg = isSvgFile(file);
  if (!svg && !RASTER_TYPES.has(file.type)) throw new Error(`“${file.name}” is not a supported image (PNG, JPG, GIF, WebP, AVIF or SVG).`);
  const filename = uniqueFilename(safeFilename(file.name, svg ? 'asset.svg' : 'asset'), takenNames);
  const alt = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  if (svg) {
    const clean = sanitizeSvg(await readFile(file, 'text'));
    const dims = svgDimensions(clean);
    return {
      id: crypto.randomUUID(),
      filename,
      mimeType: 'image/svg+xml',
      size: new Blob([clean]).size,
      localPath: `/assets/${filename}`,
      alt,
      category: 'uploaded',
      svgContent: clean,
      dataUrl: svgDataUrl(clean),
      ...dims
    };
  }
  const dataUrl = await readFile(file, 'dataUrl');
  const dims = await rasterDimensions(dataUrl);
  return {
    id: crypto.randomUUID(),
    filename,
    mimeType: file.type,
    size: file.size,
    localPath: `/assets/${filename}`,
    alt,
    category: 'uploaded',
    dataUrl,
    width: dims.width,
    height: dims.height
  };
}

/** Builds an asset from pasted SVG markup. Throws with a user-facing message. */
export function svgMarkupToAsset(name: string, alt: string, markup: string, takenNames: Iterable<string>): BlueprintAsset {
  const clean = sanitizeSvg(markup);
  const base = safeFilename(name, 'asset.svg');
  const filename = uniqueFilename(base.toLowerCase().endsWith('.svg') ? base : `${base}.svg`, takenNames);
  return {
    id: crypto.randomUUID(),
    filename,
    mimeType: 'image/svg+xml',
    size: new Blob([clean]).size,
    localPath: `/assets/${filename}`,
    alt: alt.trim() || filename,
    category: 'illustration',
    svgContent: clean,
    dataUrl: svgDataUrl(clean),
    ...svgDimensions(clean)
  };
}

export function assetKind(asset: BlueprintAsset): string {
  if (asset.mimeType === 'image/svg+xml') return 'SVG';
  const sub = asset.mimeType.split('/')[1] ?? '';
  return sub === 'jpeg' ? 'JPG' : sub.toUpperCase() || 'File';
}
