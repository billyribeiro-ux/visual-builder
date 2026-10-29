/**
 * The Style tab's read/write model for one node + one style bucket.
 *
 * - `own`        values set in the bucket being edited (base, a breakpoint, or a state).
 * - `inherited`  what applies when the bucket does NOT set a key: the base/desktop cascade for
 *                breakpoint buckets, the effective style at the previewed breakpoint for states.
 * - writes go through UPDATE_STYLES (coalesced per key while dragging/typing);
 * - clearing a value really REMOVES the key from the bucket (the reducer merges objects, so an
 *   empty string would linger and, in an override bucket, mask the inherited value). Removal
 *   uses REMOVE_STYLE_KEYS, which also drops an override bucket once it is empty.
 */
import { createContext } from 'svelte';
import { resolveEffectiveStyles } from '@app-viz/engine';
import type { BlueprintNode, BreakpointKey, CSSProperties, ResponsiveStyle } from '@app-viz/schema';
import { editor } from '../../../state/editor.svelte.js';
import { cssValueError, humanizeCssKey } from './css-values.js';

export type StyleBucket = 'base' | BreakpointKey | 'hover' | 'focus' | 'active';
export type StyleMap = Record<string, string>;

const BREAKPOINTS: BreakpointKey[] = ['mobile', 'tablet', 'desktop', 'wide'];

function clean(css: CSSProperties | undefined | null): StyleMap {
  const out: StyleMap = {};
  if (!css) return out;
  for (const [k, v] of Object.entries(css)) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s !== '') out[k] = s;
  }
  return out;
}

function inheritedFor(styles: ResponsiveStyle | undefined, bucket: StyleBucket, previewed: BreakpointKey): StyleMap {
  if (!styles || bucket === 'base') return {};
  // Empty strings left behind by older editors must not mask inherited values.
  const cleaned: ResponsiveStyle = { base: clean(styles.base) };
  for (const bp of BREAKPOINTS) if (styles[bp]) cleaned[bp] = clean(styles[bp]);
  if (bucket === 'hover' || bucket === 'focus' || bucket === 'active') {
    return clean(resolveEffectiveStyles(cleaned, previewed));
  }
  const without: ResponsiveStyle = { ...cleaned, [bucket]: undefined };
  return clean(resolveEffectiveStyles(without, bucket));
}

export function bucketHasOverrides(node: BlueprintNode | null | undefined, bucket: StyleBucket): boolean {
  return Object.keys(clean(node?.styles?.[bucket] as CSSProperties | undefined)).length > 0;
}

export function createStyleTarget(getNode: () => BlueprintNode | null, getBucket: () => StyleBucket) {
  const own = $derived(clean(getNode()?.styles?.[getBucket()] as CSSProperties | undefined));
  const inherited = $derived(inheritedFor(getNode()?.styles, getBucket(), editor.activeBreakpoint));

  function removeKeys(node: BlueprintNode, bucket: StyleBucket, keys: string[]): void {
    if (keys.length === 0) return;
    editor.dispatch({ type: 'REMOVE_STYLE_KEYS', nodeId: node.id, breakpoint: bucket, keys });
  }

  /**
   * Applies a patch to the current bucket. Empty/null values remove the key. Unsafe values are
   * refused with a visible error (the stylesheet compiler would otherwise silently drop them).
   */
  function setMany(patch: Record<string, string | null | undefined>): boolean {
    const node = getNode();
    if (!node) return false;
    const bucket = getBucket();
    const sets: StyleMap = {};
    const removes: string[] = [];
    for (const [key, raw] of Object.entries(patch)) {
      const value = raw == null ? '' : String(raw).trim();
      if (value === '') {
        if (key in own || (node.styles?.[bucket] as CSSProperties | undefined)?.[key] !== undefined) removes.push(key);
        continue;
      }
      const error = cssValueError(value);
      if (error) {
        editor.notify('error', `${humanizeCssKey(key)} was not applied: ${error}.`);
        return false;
      }
      if (own[key] !== value) sets[key] = value;
    }
    const hasSets = Object.keys(sets).length > 0;
    if (!hasSets && removes.length === 0) return true;
    const run = () => {
      if (removes.length) removeKeys(getNode() ?? node, bucket, removes);
      if (hasSets) editor.dispatch({ type: 'UPDATE_STYLES', nodeId: node.id, breakpoint: bucket, styles: sets });
    };
    if (hasSets && removes.length) editor.transact(run);
    else run();
    return true;
  }

  return {
    get node() {
      return getNode();
    },
    get bucket() {
      return getBucket();
    },
    get own() {
      return own;
    },
    get inherited() {
      return inherited;
    },
    /** Value set in the edited bucket ('' when unset). */
    get: (key: string): string => own[key] ?? '',
    /** Value that applies when the edited bucket does not set the key. */
    inheritedOf: (key: string): string => inherited[key] ?? '',
    /** What actually applies for the edited bucket. */
    effective: (key: string): string => own[key] ?? inherited[key] ?? '',
    isSet: (key: string): boolean => key in own,
    anySet: (keys: readonly string[]): boolean => keys.some((k) => k in own),
    set: (key: string, value: string | null | undefined): boolean => setMany({ [key]: value }),
    setMany,
    reset: (keys: readonly string[]): boolean => setMany(Object.fromEntries(keys.map((k) => [k, '']))),
    endEdit: () => editor.endContinuousEdit()
  };
}

export type StyleTarget = ReturnType<typeof createStyleTarget>;

export const [getStyleTarget, setStyleTarget] = createContext<StyleTarget>();
