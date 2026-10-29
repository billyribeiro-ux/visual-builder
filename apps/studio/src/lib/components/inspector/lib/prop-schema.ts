/**
 * Turns a component manifest's zod `propsSchema` (+ optional `propControls`) into a list of
 * inspector field descriptions. Defensive by design: manifests are being refactored
 * concurrently, so every introspection step tolerates missing/unknown schema shapes and falls
 * back to the runtime value type.
 */
import type { ComponentManifest } from '@app-viz/schema';

/**
 * Superset of the schema's `PropControl` (newer manifests add icon/image/date/code types,
 * numeric bounds, a unit hint and a group). Declared locally so the inspector type-checks
 * against both the published and the in-progress schema typings.
 */
export interface PropControlLike {
  label?: string;
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'url' | 'icon' | 'image' | 'date' | 'code';
  options?: Array<{ value: string; label: string }>;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  group?: string;
}

/** Minimal structural view of a zod v4 schema; we only ever read from it. */
export interface ZodLike {
  _zod?: { def?: Record<string, unknown> & { type?: string } };
  shape?: Record<string, ZodLike>;
  options?: unknown[];
  minValue?: number | null;
  maxValue?: number | null;
  isInt?: boolean;
}

export type PropKind =
  | 'text'
  | 'textarea'
  | 'link'
  | 'asset'
  | 'icon'
  | 'color'
  | 'enum'
  | 'boolean'
  | 'number'
  | 'objectList'
  | 'stringList'
  | 'matrix'
  | 'json'
  | 'date'
  | 'code'
  | 'numberList'
  | 'boolOrText'
  | 'numberOrText';

/** Built-in groups; manifests may also name their own via `propControls[key].group`. */
export type PropGroup = 'content' | 'buttons' | 'items' | 'settings' | (string & {});

export interface EnumOption {
  value: string;
  label: string;
}

export interface PropSpec {
  key: string;
  label: string;
  kind: PropKind;
  group: PropGroup;
  help?: string;
  options?: EnumOption[];
  min?: number;
  max?: number;
  step?: number;
  /** Unit hint for numbers, e.g. `ms`. */
  unit?: string;
  int?: boolean;
  /** Unwrapped schema of this prop (absent for props unknown to the manifest). */
  schema?: ZodLike;
  /** For list kinds: the unwrapped element schema. */
  itemSchema?: ZodLike;
  /** Declared default (schema default, else manifest defaultProps). */
  defaultValue?: unknown;
  hasDefault: boolean;
}

/* ------------------------------------------------------------------------------------------ */
/* zod introspection                                                                          */
/* ------------------------------------------------------------------------------------------ */

const WRAPPERS = new Set(['default', 'prefault', 'optional', 'nullable', 'catch', 'readonly', 'nonoptional']);

function defOf(s: ZodLike | undefined): (Record<string, unknown> & { type?: string }) | undefined {
  return s?._zod?.def;
}

export function unwrapSchema(s: ZodLike | undefined): { inner: ZodLike | undefined; defaultValue: unknown; hasDefault: boolean } {
  let cur = s;
  let defaultValue: unknown;
  let hasDefault = false;
  for (let guard = 0; guard < 12 && cur; guard++) {
    const def = defOf(cur);
    if (!def?.type) break;
    if ((def.type === 'default' || def.type === 'prefault') && !hasDefault) {
      try {
        defaultValue = (def as { defaultValue?: unknown }).defaultValue;
        hasDefault = true;
      } catch {
        // A throwing default getter means "no usable default".
      }
    }
    if (WRAPPERS.has(def.type)) {
      cur = def.innerType as ZodLike | undefined;
      continue;
    }
    if (def.type === 'pipe') {
      cur = def.in as ZodLike | undefined;
      continue;
    }
    break;
  }
  return { inner: cur, defaultValue, hasDefault };
}

export function schemaType(s: ZodLike | undefined): string {
  return defOf(s)?.type ?? 'unknown';
}

export function objectShape(s: ZodLike | undefined): Record<string, ZodLike> | undefined {
  if (schemaType(s) !== 'object') return undefined;
  try {
    return (s?.shape ?? (defOf(s)?.shape as Record<string, ZodLike> | undefined)) || undefined;
  } catch {
    return undefined;
  }
}

export function enumValues(s: ZodLike | undefined): string[] | undefined {
  const def = defOf(s);
  if (!def) return undefined;
  if (def.type === 'enum') {
    const entries = def.entries as Record<string, unknown> | undefined;
    const values = entries ? Object.values(entries) : s?.options;
    return Array.isArray(values) ? values.map(String) : undefined;
  }
  if (def.type === 'literal') {
    const values = def.values as unknown[] | undefined;
    return Array.isArray(values) ? values.map(String) : undefined;
  }
  if (def.type === 'union') {
    const opts = (def.options as ZodLike[] | undefined) ?? [];
    const all: string[] = [];
    for (const o of opts) {
      const vals = enumValues(unwrapSchema(o).inner);
      if (!vals) return undefined;
      all.push(...vals);
    }
    return all.length ? all : undefined;
  }
  return undefined;
}

function arrayElement(s: ZodLike | undefined): ZodLike | undefined {
  if (schemaType(s) !== 'array') return undefined;
  return unwrapSchema(defOf(s)?.element as ZodLike | undefined).inner;
}

/* ------------------------------------------------------------------------------------------ */
/* Labels                                                                                     */
/* ------------------------------------------------------------------------------------------ */

const ACRONYMS: Record<string, string> = {
  cta: 'CTA',
  url: 'URL',
  id: 'ID',
  seo: 'SEO',
  faq: 'FAQ',
  kpi: 'KPI',
  api: 'API',
  og: 'OG',
  ui: 'UI',
  css: 'CSS',
  html: 'HTML'
};

/** `primaryCtaHref` → `Primary CTA link`, `sectionTitle` → `Title`, `isPopular` → `Popular`. */
export function humanizeKey(key: string): string {
  let k = key;
  if (/^is[A-Z]/.test(k)) k = k.slice(2);
  if (/^section[A-Z]/.test(k)) k = k.slice(7);
  const words = k
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .map((w) => (w === 'href' ? 'link' : w));
  return words
    .map((w, i) => ACRONYMS[w] ?? (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.length === 1 ? w.toUpperCase() : w))
    .join(' ');
}

const ENUM_LABELS: Record<string, string> = {
  'flex-start': 'Start',
  'flex-end': 'End',
  start: 'Start',
  end: 'End',
  center: 'Center',
  stretch: 'Stretch',
  'space-between': 'Between',
  'space-around': 'Around',
  'space-evenly': 'Evenly',
  row: 'Row',
  column: 'Column',
  'row-reverse': 'Row reverse',
  'column-reverse': 'Column reverse',
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL',
  '2xl': '2XL',
  full: 'Full',
  left: 'Left',
  right: 'Right',
  signin: 'Sign in',
  signup: 'Sign up',
  up: 'Up',
  down: 'Down'
};

/** Prop-specific option labels where the raw value alone is ambiguous. */
const PROP_ENUM_LABELS: Record<string, Record<string, string>> = {
  maxWidth: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px', full: 'Full width' },
  paddingY: { sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large' },
  surfaceTone: { surface: 'Surface', low: 'Low', container: 'Container', high: 'High', 'primary-container': 'Accent' },
  spacing: { sm: 'Small', md: 'Medium', lg: 'Large' }
};

export function enumLabel(propKey: string, value: string): string {
  return PROP_ENUM_LABELS[propKey]?.[value] ?? ENUM_LABELS[value] ?? humanizeKey(value);
}

/* ------------------------------------------------------------------------------------------ */
/* Classification                                                                             */
/* ------------------------------------------------------------------------------------------ */

const LONG_TEXT_RE = /(description|subtitle|body|message|answer|quote|content|bio|summary|tagline|detail|excerpt|caption|copyright)$/i;
const LINK_RE = /href$|link/i;
const ASSET_RE = /(src|url|image|img|logo|avatar|photo|thumbnail|poster)$/i;
const ICON_RE = /icon/i;
const COLOR_RE = /colou?r$/i;
const BUTTON_RE = /(cta|button|submit|href|link|redirect)/i;
const SETTINGS_KEYS = new Set([
  'gap',
  'maxWidth',
  'paddingY',
  'columns',
  'direction',
  'justify',
  'align',
  'alignItems',
  'justifyItems',
  'textAlign',
  'variant',
  'size',
  'tone',
  'mode',
  'spacing',
  'surfaceTone',
  'activeNav'
]);

function kindFromControl(control: PropControlLike | undefined): PropKind | undefined {
  switch (control?.type) {
    case 'textarea':
      return 'textarea';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'select':
      return 'enum';
    case 'color':
      return 'color';
    case 'url':
      return 'link';
    case 'icon':
      return 'icon';
    case 'image':
      return 'asset';
    case 'date':
      return 'date';
    case 'code':
      return 'code';
    case 'text':
      return 'text';
    default:
      return undefined;
  }
}

const DATE_KEY_RE = /(date|day|deadline|due|birthday)$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Primitive member types of a union (`string`, `number`, `boolean`, `enum`…). */
function unionMemberTypes(s: ZodLike | undefined): Set<string> {
  const out = new Set<string>();
  for (const o of (defOf(s)?.options as ZodLike[] | undefined) ?? []) {
    const inner = unwrapSchema(o).inner;
    const t = schemaType(inner);
    out.add(t === 'literal' ? typeof (defOf(inner)?.values as unknown[] | undefined)?.[0] : t);
  }
  return out;
}

function stringKind(key: string, value: unknown): PropKind {
  if (DATE_KEY_RE.test(key) && (value === undefined || value === '' || (typeof value === 'string' && ISO_DATE_RE.test(value)))) return 'date';
  if (LINK_RE.test(key)) return 'link';
  if (ASSET_RE.test(key)) return 'asset';
  if (ICON_RE.test(key)) return 'icon';
  if (COLOR_RE.test(key)) return 'color';
  if (LONG_TEXT_RE.test(key) || (typeof value === 'string' && (value.length > 60 || value.includes('\n')))) return 'textarea';
  return 'text';
}

/** Describes one prop (or one field of a repeater item) for the inspector. */
export function describeProp(
  key: string,
  rawSchema: ZodLike | undefined,
  value: unknown,
  options: { control?: PropControlLike; manifestDefault?: unknown; hasManifestDefault?: boolean } = {}
): PropSpec {
  const { inner, defaultValue: schemaDefault, hasDefault: schemaHasDefault } = unwrapSchema(rawSchema);
  const t = schemaType(inner);
  const control = options.control;
  const hasDefault = options.hasManifestDefault || schemaHasDefault;
  const defaultValue = options.hasManifestDefault ? options.manifestDefault : schemaDefault;
  const sample = value !== undefined ? value : defaultValue;

  const spec: PropSpec = {
    key,
    label: control?.label || humanizeKey(key),
    kind: 'text',
    group: 'content',
    help: control?.help,
    schema: inner,
    defaultValue,
    hasDefault
  };

  const values = control?.options ? undefined : enumValues(inner);
  const controlKind = kindFromControl(control);

  if (controlKind) {
    spec.kind = controlKind;
  } else if (control?.options || values) {
    spec.kind = 'enum';
  } else if (t === 'union' && unionMemberTypes(inner).has('boolean') && unionMemberTypes(inner).has('string')) {
    spec.kind = 'boolOrText';
  } else if (t === 'union' && unionMemberTypes(inner).has('number') && unionMemberTypes(inner).has('string')) {
    spec.kind = 'numberOrText';
  } else if (t === 'union' && typeof sample === 'boolean') {
    spec.kind = 'boolean';
  } else if (t === 'union' && typeof sample === 'number') {
    spec.kind = 'number';
  } else if (t === 'boolean' || (t === 'unknown' && typeof sample === 'boolean')) {
    spec.kind = 'boolean';
  } else if (t === 'number' || (t === 'unknown' && typeof sample === 'number')) {
    spec.kind = 'number';
  } else if (t === 'array' || (t === 'unknown' && Array.isArray(sample))) {
    const el = arrayElement(inner);
    const elType = schemaType(el);
    const first = Array.isArray(sample) ? sample[0] : undefined;
    spec.itemSchema = el;
    if (elType === 'object' || (elType === 'unknown' && first && typeof first === 'object' && !Array.isArray(first))) {
      spec.kind = 'objectList';
    } else if (elType === 'array' || (elType === 'unknown' && Array.isArray(first))) {
      spec.kind = 'matrix';
    } else if (elType === 'number' || (elType === 'unknown' && typeof first === 'number')) {
      spec.kind = 'numberList';
    } else if (elType === 'string' || elType === 'enum' || (elType === 'unknown' && (first === undefined || typeof first === 'string'))) {
      spec.kind = 'stringList';
    } else {
      spec.kind = 'json';
    }
  } else if (t === 'object' || t === 'record' || (t === 'unknown' && sample !== null && typeof sample === 'object')) {
    spec.kind = 'json';
  } else {
    spec.kind = stringKind(key, sample);
  }

  if (spec.kind === 'enum') {
    const raw = control?.options ?? (values ?? []).map((v) => ({ value: v, label: enumLabel(key, v) }));
    spec.options = raw.map((o) => ({ value: String(o.value), label: o.label }));
  }
  if (spec.kind === 'number') {
    const min = inner?.minValue;
    const max = inner?.maxValue;
    if (typeof min === 'number' && Number.isFinite(min)) spec.min = min;
    if (typeof max === 'number' && Number.isFinite(max)) spec.max = max;
    if (control?.min !== undefined) spec.min = control.min;
    if (control?.max !== undefined) spec.max = control.max;
    spec.step = control?.step;
    spec.unit = control?.unit;
    spec.int = inner?.isInt === true;
  }

  spec.group =
    spec.kind === 'objectList' ||
    spec.kind === 'stringList' ||
    spec.kind === 'numberList' ||
    spec.kind === 'matrix' ||
    (spec.kind === 'json' && Array.isArray(sample))
      ? 'items'
      : (spec.kind === 'text' || spec.kind === 'link') && BUTTON_RE.test(key)
        ? 'buttons'
        : spec.kind === 'enum' ||
            spec.kind === 'boolean' ||
            spec.kind === 'boolOrText' ||
            spec.kind === 'number' ||
            spec.kind === 'color' ||
            SETTINGS_KEYS.has(key)
          ? 'settings'
          : 'content';
  if (control?.group?.trim()) {
    const g = control.group.trim();
    const builtin = (Object.keys(GROUP_TITLES) as string[]).find((id) => id === g.toLowerCase() || GROUP_TITLES[id].toLowerCase() === g.toLowerCase());
    spec.group = builtin ?? g;
  }
  return spec;
}

/** All props of a node: schema keys in declaration order, then any extra keys present on the node. */
export function describeProps(manifest: ComponentManifest | undefined, props: Record<string, unknown> | undefined): PropSpec[] {
  const shape = objectShape(unwrapSchema(manifest?.propsSchema as ZodLike | undefined).inner) ?? {};
  const defaults = (manifest?.defaultProps ?? {}) as Record<string, unknown>;
  const keys = [...Object.keys(shape)];
  for (const k of Object.keys(props ?? {})) if (!keys.includes(k)) keys.push(k);
  return keys.map((key) =>
    describeProp(key, shape[key], props?.[key], {
      control: manifest?.propControls?.[key] as PropControlLike | undefined,
      manifestDefault: defaults[key],
      hasManifestDefault: key in defaults
    })
  );
}

export const GROUP_TITLES: Record<string, string> = {
  content: 'Content',
  buttons: 'Buttons & links',
  items: 'Items',
  settings: 'Settings'
};

const GROUP_ORDER: PropGroup[] = ['content', 'buttons', 'items', 'settings'];

/** Built-in groups in a fixed order, then manifest-defined groups in first-use order. */
export function groupSpecs(specs: PropSpec[]): Array<{ id: PropGroup; title: string; specs: PropSpec[] }> {
  const custom = [...new Set(specs.map((s) => s.group).filter((g) => !GROUP_ORDER.includes(g)))];
  return [...GROUP_ORDER, ...custom]
    .map((id) => ({ id, title: GROUP_TITLES[id] ?? id, specs: specs.filter((s) => s.group === id) }))
    .filter((g) => g.specs.length > 0);
}

/** Fields of one repeater item (object element schema, else the item's own keys). */
export function describeItemFields(itemSchema: ZodLike | undefined, item: unknown): PropSpec[] {
  const shape = objectShape(itemSchema) ?? {};
  const keys = [...Object.keys(shape)];
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    for (const k of Object.keys(item)) if (!keys.includes(k)) keys.push(k);
  }
  return keys.map((k) => describeProp(k, shape[k], (item as Record<string, unknown> | undefined)?.[k]));
}

/* ------------------------------------------------------------------------------------------ */
/* New list items                                                                             */
/* ------------------------------------------------------------------------------------------ */

function emptyFor(spec: PropSpec, existing: unknown): unknown {
  if (spec.hasDefault && spec.defaultValue !== undefined && spec.defaultValue !== '') {
    return structuredClone(spec.defaultValue);
  }
  switch (spec.kind) {
    case 'boolean':
      return false;
    case 'number':
      return spec.min ?? 0;
    case 'enum':
      return spec.options?.[0]?.value ?? '';
    case 'objectList':
    case 'stringList':
    case 'numberList':
    case 'matrix':
      return [];
    case 'boolOrText':
      return false;
    case 'numberOrText':
      return spec.min ?? 0;
    case 'date':
      return '';
    case 'json':
      return {};
    case 'link':
      return '#';
    case 'icon':
    case 'asset':
    case 'color':
      return typeof existing === 'string' ? existing : '';
    default:
      return `New ${spec.label.toLowerCase()}`;
  }
}

/** Builds a fresh item shaped like the schema (or like the last existing item). */
export function newListItem(spec: PropSpec, items: readonly unknown[], columnCount?: number): unknown {
  const last = items[items.length - 1];
  if (spec.kind === 'stringList') return enumValues(spec.itemSchema)?.[0] ?? 'New item';
  if (spec.kind === 'numberList') return 0;
  if (spec.kind === 'matrix') {
    const cols = columnCount ?? (Array.isArray(last) ? last.length : 1);
    return Array.from({ length: Math.max(1, cols) }, () => '');
  }
  const fields = describeItemFields(spec.itemSchema, last);
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const existing = last && typeof last === 'object' ? (last as Record<string, unknown>)[f.key] : undefined;
    out[f.key] = emptyFor(f, existing);
  }
  return out;
}

/** First meaningful text of an item, used as its collapsed title. */
export function itemTitle(item: unknown): string {
  if (typeof item === 'string') return item;
  if (Array.isArray(item)) return item.map(String).find((s) => s.trim()) ?? '';
  if (item && typeof item === 'object') {
    for (const [k, v] of Object.entries(item)) {
      if (typeof v !== 'string' || !v.trim()) continue;
      if (LINK_RE.test(k) || ASSET_RE.test(k) || ICON_RE.test(k) || COLOR_RE.test(k)) continue;
      return v;
    }
  }
  return '';
}

/** `Features` → `feature`, `Testimonials` → `testimonial`, `Categories` → `category`. */
export function singularize(label: string): string {
  const l = label.toLowerCase();
  if (l.endsWith('ies')) return `${l.slice(0, -3)}y`;
  if (l.endsWith('ses')) return l.slice(0, -2);
  if (l.endsWith('s') && !l.endsWith('ss')) return l.slice(0, -1);
  return l;
}
