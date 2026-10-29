/**
 * Project assets in exports.
 *
 * In the blueprint an element references an asset by its `localPath` (e.g. `/assets/logo.png`);
 * older projects may still hold the asset's `data:` URL directly. Exports always ship the file
 * itself and rewrite every reference to the normalized public path, so generated code and build
 * specs never contain multi-megabyte data URLs.
 */
import type { BlueprintAsset, ProjectBlueprint } from '@app-viz/schema';
import { dedupePaths, normalizeAssetPath } from './paths.js';

export interface AssetFiles {
  /** Text assets (SVG) keyed by normalized path relative to the static root, e.g. `assets/logo.svg`. */
  text: Record<string, string>;
  /** Binary assets (PNG, JPEG, WebP, GIF, AVIF) keyed the same way. */
  binary: Record<string, Uint8Array>;
  /** Any reference form (`localPath` as stored, or the asset's data URL) → public path `/assets/…`. */
  publicPathFor: Map<string, string>;
  /** Assets that could not be exported (no SVG markup and no decodable image data URL). */
  skipped: string[];
  /** One entry per exported asset, in blueprint order. */
  manifest: Array<{ path: string; filename: string; mimeType: string; alt: string; width?: number; height?: number; bytes: number }>;
}

const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9.+-]+)(?:;charset=[\w-]+)?(;base64)?,(.*)$/is;

function decodeBase64(data: string): Uint8Array {
  const clean = data.replace(/\s+/g, '');
  const bin = globalThis.atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Decodes an asset to file content. Returns null when it has no usable payload. */
function assetContent(asset: BlueprintAsset): { kind: 'text'; value: string } | { kind: 'binary'; value: Uint8Array } | null {
  if (asset.svgContent && asset.svgContent.trim().startsWith('<svg')) return { kind: 'text', value: asset.svgContent };
  const match = asset.dataUrl ? DATA_URL_RE.exec(asset.dataUrl) : null;
  if (!match) return null;
  const [, mime, isBase64, payload] = match;
  try {
    if (/svg\+xml/i.test(mime)) {
      const svg = isBase64 ? new TextDecoder().decode(decodeBase64(payload)) : decodeURIComponent(payload);
      return svg.trim().startsWith('<svg') ? { kind: 'text', value: svg } : null;
    }
    if (!/^image\/(png|jpeg|jpg|gif|webp|avif)$/i.test(mime)) return null;
    return isBase64 ? { kind: 'binary', value: decodeBase64(payload) } : null;
  } catch {
    // Corrupt payloads are never half-written; the caller lists them in `skipped`.
    return null;
  }
}

/** Collects every exportable asset with deterministic, collision-free paths. */
export function collectAssetFiles(blueprint: ProjectBlueprint): AssetFiles {
  const all = (blueprint.assets ?? []).map((asset) => ({ asset, rel: normalizeAssetPath(asset.localPath), content: assetContent(asset) }));
  const entries = all.filter((e): e is typeof e & { content: NonNullable<typeof e.content> } => Boolean(e.rel && e.content));
  const skipped = all.filter((e) => !e.rel || !e.content).map((e) => e.asset.filename || e.asset.localPath);
  const paths = dedupePaths(
    entries.map((e) => e.rel),
    true
  );
  const out: AssetFiles = { text: {}, binary: {}, publicPathFor: new Map(), skipped, manifest: [] };
  entries.forEach((entry, i) => {
    const rel = paths[i];
    const publicPath = `/${rel}`;
    if (entry.content.kind === 'text') out.text[rel] = entry.content.value;
    else out.binary[rel] = entry.content.value;
    out.publicPathFor.set(entry.asset.localPath, publicPath);
    out.publicPathFor.set(publicPath, publicPath);
    if (entry.asset.dataUrl) out.publicPathFor.set(entry.asset.dataUrl, publicPath);
    out.manifest.push({
      path: publicPath,
      filename: entry.asset.filename,
      mimeType: entry.asset.mimeType,
      alt: entry.asset.alt,
      width: entry.asset.width,
      height: entry.asset.height,
      bytes: entry.content.kind === 'text' ? new TextEncoder().encode(entry.content.value).length : entry.content.value.length
    });
  });
  return out;
}

/** Deep-replaces string values that reference an asset (by stored path or data URL) with its public path. */
export function rewriteAssetReferences<T>(value: T, publicPathFor: ReadonlyMap<string, string>): T {
  if (publicPathFor.size === 0) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return publicPathFor.get(v) ?? v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, inner] of Object.entries(v as Record<string, unknown>)) out[k] = walk(inner);
      return out;
    }
    return v;
  };
  return walk(value) as T;
}
