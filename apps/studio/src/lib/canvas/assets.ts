/**
 * Project asset resolution on the canvas.
 *
 * Elements reference uploaded images by their asset `localPath` (e.g. `/assets/logo.png`), which
 * is what the export serves from `static/`. Inside the studio there is no static server for
 * browser-stored uploads, so the canvas swaps those paths for the asset's data URL — in props
 * (after validation) and in compiled CSS (`url(...)`). The blueprint itself never changes.
 */
import { createContext } from 'svelte';
import type { BlueprintAsset } from '@app-viz/schema';

export type AssetUrlMap = ReadonlyMap<string, string>;

export const [getAssetUrls, setAssetUrls] = createContext<() => AssetUrlMap>();

const EMPTY: AssetUrlMap = new Map();

/** `localPath` → displayable URL (data URL, or an `svgContent`-derived data URL). */
export function buildAssetUrlMap(assets: readonly BlueprintAsset[] | undefined): AssetUrlMap {
  const map = new Map<string, string>();
  for (const asset of assets ?? []) {
    if (!asset.localPath) continue;
    const url = asset.dataUrl || (asset.svgContent ? `data:image/svg+xml;utf8,${encodeURIComponent(asset.svgContent)}` : '');
    if (url) map.set(asset.localPath, url);
  }
  return map;
}

/** Deep-replaces string values equal to an asset path with its displayable URL. */
export function resolveAssetRefs<T>(value: T, map: AssetUrlMap = EMPTY): T {
  if (map.size === 0) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') return map.get(v) ?? v;
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rewrites `url(<asset path>)` in an already-sanitized stylesheet. Runs after the CSS sanitizer,
 * and data URLs of images only contain URL-safe characters, so the result stays well-formed.
 */
export function rewriteCssAssetUrls(css: string, map: AssetUrlMap = EMPTY): string {
  let out = css;
  for (const [path, url] of map) {
    if (!out.includes(path)) continue;
    const re = new RegExp(`url\\(\\s*(["']?)${escapeRegExp(path)}\\1\\s*\\)`, 'g');
    out = out.replace(re, `url("${url.replace(/"/g, '%22')}")`);
  }
  return out;
}
