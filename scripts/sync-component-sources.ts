/**
 * Mirrors the canonical site components into the codegen package:
 *
 *   packages/components/src/svelte/**  →  packages/codegen/src/generated/component-sources.ts
 *
 * The export writes these sources verbatim into `generated-app/src/lib/components/**` (and
 * `runtime.css` into the app's global CSS), so the exported app renders the exact files the
 * studio canvas renders. Editor-only `data-prop` attributes (used for on-canvas inline text
 * editing) are stripped. Output is deterministic (sorted keys, stable formatting).
 *
 *   pnpm sync:components
 *
 * A vitest test regenerates the module in memory and fails when the committed file is stale.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COMPONENTS_SOURCE_DIR = path.join(ROOT, 'packages/components/src/svelte');
export const GENERATED_MODULE_PATH = path.join(ROOT, 'packages/codegen/src/generated/component-sources.ts');

const INCLUDED_EXTENSIONS = new Set(['.svelte', '.ts', '.css']);

function listFiles(dir: string, base = dir): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile() && INCLUDED_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

/**
 * Removes every ` data-prop=…` attribute from Svelte markup. Handles `"…"`, `'…'` and
 * `{…}` values (including template literals with `${…}` placeholders, by brace matching).
 * Throws on an unterminated value so a malformed source can never be exported half-stripped.
 */
export function stripDataPropAttributes(source: string): string {
  const needle = 'data-prop=';
  let out = '';
  let cursor = 0;
  for (;;) {
    const index = source.indexOf(needle, cursor);
    if (index === -1) break;
    // Only strip real attributes (preceded by whitespace).
    if (!/\s/.test(source[index - 1] ?? '')) {
      out += source.slice(cursor, index + needle.length);
      cursor = index + needle.length;
      continue;
    }
    let start = index;
    while (start > cursor && /[ \t]/.test(source[start - 1])) start -= 1;
    if (start > cursor && source[start - 1] === '\n') {
      // Attribute on its own line: drop the whole line including its newline.
      start -= 1;
    }
    let end = index + needle.length;
    const opener = source[end];
    if (opener === '"' || opener === "'") {
      const close = source.indexOf(opener, end + 1);
      if (close === -1) throw new Error(`Unterminated data-prop attribute at offset ${index}`);
      end = close + 1;
    } else if (opener === '{') {
      let depth = 0;
      let i = end;
      for (; i < source.length; i++) {
        if (source[i] === '{') depth += 1;
        else if (source[i] === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      if (depth !== 0) throw new Error(`Unterminated data-prop expression at offset ${index}`);
      end = i + 1;
    } else {
      throw new Error(`Unsupported data-prop attribute value at offset ${index}`);
    }
    out += source.slice(cursor, start);
    cursor = end;
  }
  return out + source.slice(cursor);
}

/** Reads every canonical source (sorted by relative path) with editor-only attributes stripped. */
export function collectComponentSources(dir = COMPONENTS_SOURCE_DIR): Record<string, string> {
  const sources: Record<string, string> = {};
  for (const rel of listFiles(dir).sort()) {
    const raw = fs.readFileSync(path.join(dir, rel), 'utf8');
    sources[rel] = rel.endsWith('.svelte') ? stripDataPropAttributes(raw) : raw;
  }
  return sources;
}

/** Renders the generated TypeScript module (deterministic). */
export function renderComponentSourcesModule(sources: Record<string, string>): string {
  const keys = Object.keys(sources).sort();
  const body = keys.map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(sources[key])}`).join(',\n');
  return `// GENERATED — do not edit; run pnpm sync:components
// Source of truth: packages/components/src/svelte/** (data-prop editor attributes stripped).

/** Canonical site component sources keyed by path relative to packages/components/src/svelte. */
export const COMPONENT_SOURCES: Record<string, string> = {
${body}
};
`;
}

export function generateComponentSourcesModule(dir = COMPONENTS_SOURCE_DIR): string {
  return renderComponentSourcesModule(collectComponentSources(dir));
}

function main() {
  const module = generateComponentSourcesModule();
  fs.mkdirSync(path.dirname(GENERATED_MODULE_PATH), { recursive: true });
  fs.writeFileSync(GENERATED_MODULE_PATH, module);
  const count = Object.keys(collectComponentSources()).length;
  console.log(`Synced ${count} component source files → ${path.relative(ROOT, GENERATED_MODULE_PATH)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
