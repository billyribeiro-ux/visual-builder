<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type ChartType = 'bar' | 'line' | 'area' | 'donut' | 'stacked-bar';
  type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

  interface ChartSeries {
    name: string;
    values: Array<number | null>;
    tone?: Tone;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    type?: ChartType;
    title?: string;
    subtitle?: string;
    labels?: string[];
    series?: ChartSeries[];
    showLegend?: boolean;
    showGrid?: boolean;
    showValues?: boolean;
    valuePrefix?: string;
    valueSuffix?: string;
    /** Plot height in px (160–640). */
    height?: number;
    class?: string;
  }

  let {
    type = 'bar',
    title = '',
    subtitle = '',
    labels = [],
    series = [],
    showLegend = true,
    showGrid = true,
    showValues = false,
    valuePrefix = '',
    valueSuffix = '',
    height = 280,
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();

  const TYPES: readonly ChartType[] = ['bar', 'line', 'area', 'donut', 'stacked-bar'];
  const TONES: readonly Tone[] = ['primary', 'success', 'warning', 'danger', 'neutral', 'violet'];
  /** Warning and violet have no theme token yet: overridable custom properties with neutral-safe fallbacks. */
  const TONE_COLORS: Record<Tone, string> = {
    primary: 'var(--md-sys-color-primary)',
    success: 'var(--md-sys-color-success)',
    warning: 'var(--md-sys-color-warning, #B26A00)',
    danger: 'var(--md-sys-color-error)',
    neutral: 'var(--md-sys-color-outline)',
    violet: 'var(--md-sys-color-violet, #6E56CF)'
  };
  /** Fixed donut slice order (validated for adjacent-pair colour-vision separation); slices past 5 fold into "Other". */
  const DONUT_TONES: readonly Tone[] = ['primary', 'warning', 'success', 'violet', 'danger'];
  const CHAR_W = 6.6;
  const MAX_DONUT_SLICES = 6;

  const chartType = $derived<ChartType>(TYPES.includes(type) ? type : 'bar');
  const isDonut = $derived(chartType === 'donut');
  const isStacked = $derived(chartType === 'stacked-bar');
  const isLinear = $derived(chartType === 'line' || chartType === 'area');
  const plotHeight = $derived(Math.min(640, Math.max(160, Math.round(Number(height) || 280))));

  /** Validated data: every series truncated to the shortest of labels/values; non-finite values become gaps. */
  const data = $derived.by(() => {
    const safeLabels = Array.isArray(labels) ? labels.map((l) => (typeof l === 'string' ? l : String(l ?? ''))) : [];
    const safeSeries = (Array.isArray(series) ? series : []).filter((s) => s && Array.isArray(s.values));
    const n = safeSeries.length ? Math.min(safeLabels.length, ...safeSeries.map((s) => s.values.length)) : 0;
    return {
      n,
      labels: safeLabels.slice(0, n),
      series: safeSeries.map((s, i) => {
        const tone: Tone = TONES.includes(s.tone as Tone) ? (s.tone as Tone) : 'primary';
        return {
          name: typeof s.name === 'string' && s.name.trim() ? s.name : `Series ${i + 1}`,
          tone,
          color: TONE_COLORS[tone],
          values: s.values.slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : null))
        };
      })
    };
  });

  const hasData = $derived(data.n > 0 && data.series.some((s) => s.values.some((v) => v !== null)));

  /* ------------------------------------------------------------------ formatting */

  function trimNumber(value: number, decimals: number): string {
    return String(Number(value.toFixed(decimals)));
  }

  function compactBody(abs: number): string {
    if (abs >= 1e9) return `${trimNumber(abs / 1e9, 1)}B`;
    if (abs >= 1e6) return `${trimNumber(abs / 1e6, 1)}M`;
    if (abs >= 1e4) return `${trimNumber(abs / 1e3, 1)}K`;
    return abs.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function withAffixes(value: number, body: string): string {
    return `${value < 0 ? '−' : ''}${valuePrefix}${body}${valueSuffix}`;
  }

  /** Full value for tooltips, the data table and screen readers. */
  function formatValue(value: number | null): string {
    if (value === null) return 'No data';
    return withAffixes(value, Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 }));
  }

  /** Compact value for axis ticks and direct labels (12.5K, 1.2M). */
  function formatCompact(value: number): string {
    return withAffixes(value, compactBody(Math.abs(value)));
  }

  function textWidth(text: string, charWidth = CHAR_W): number {
    return text.length * charWidth;
  }

  /* ------------------------------------------------------------------ nice-number scale */

  function niceNumber(range: number, round: boolean): number {
    const exponent = Math.floor(Math.log10(range));
    const fraction = range / 10 ** exponent;
    let nice: number;
    if (round) nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
    else nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return nice * 10 ** exponent;
  }

  function niceScale(min: number, max: number, maxTicks = 5): { lo: number; hi: number; ticks: number[] } {
    const span = max - min || Math.abs(max) || 1;
    const step = niceNumber(niceNumber(span, false) / (maxTicks - 1), true);
    const decimals = Math.max(0, -Math.floor(Math.log10(step)));
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(decimals)));
    return { lo: ticks[0], hi: ticks[ticks.length - 1], ticks };
  }

  /* ------------------------------------------------------------------ layout */

  let measuredWidth = $state(0);
  /** viewBox width: the measured container width (1 unit = 1px) once mounted; 640 during SSR. */
  const vw = $derived(measuredWidth > 0 ? measuredWidth : 640);

  function observeWidth(node: HTMLElement) {
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[0]?.contentRect.width ?? 0);
      if (width > 0 && width !== measuredWidth) measuredWidth = width;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }

  const cartesian = $derived.by(() => {
    if (isDonut || !hasData) return null;
    const n = data.n;
    let min = 0;
    let max = 0;
    const totals: number[] = [];
    for (let i = 0; i < n; i++) {
      if (isStacked) {
        const total = data.series.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0);
        totals.push(total);
        max = Math.max(max, total);
      } else {
        for (const s of data.series) {
          const v = s.values[i];
          if (v === null) continue;
          min = Math.min(min, v);
          max = Math.max(max, v);
        }
      }
    }
    const { lo, hi, ticks } = niceScale(min, max);
    const tickLabels = ticks.map(formatCompact);
    const longestTick = Math.max(...tickLabels.map((t) => textWidth(t)));
    const firstLabelW = textWidth(data.labels[0] ?? '');
    const lastLabelW = textWidth(data.labels[n - 1] ?? '');
    const padL = Math.ceil(Math.max(longestTick + 12, isLinear ? firstLabelW / 2 + 4 : 0));
    const padR = isLinear ? Math.ceil(Math.max(14, lastLabelW / 2 + 4)) : 6;
    const padT = showValues ? 24 : 12;
    const padB = 30;
    const plotW = Math.max(40, vw - padL - padR);
    const plotH = Math.max(40, plotHeight - padT - padB);
    const round2 = (v: number) => Math.round(v * 100) / 100;
    const y = (v: number) => round2(padT + ((hi - v) / (hi - lo || 1)) * plotH);
    const spacing = isLinear ? (n > 1 ? plotW / (n - 1) : plotW) : plotW / n;
    const x = (i: number) => round2(isLinear ? (n > 1 ? padL + i * spacing : padL + plotW / 2) : padL + spacing * (i + 0.5));
    // Hit band of every category (the band, never only the painted pixels).
    const bands = Array.from({ length: n }, (_, i) => {
      const half = isLinear ? (n > 1 ? spacing / 2 : plotW / 2) : spacing / 2;
      const x0 = Math.max(padL - (isLinear ? padL * 0.5 : 0), x(i) - half);
      const x1 = Math.min(vw - (isLinear ? padR * 0.5 : padR), x(i) + half);
      return { x0: round2(x0), x1: round2(x1) };
    });
    const maxLabelW = Math.max(...data.labels.map((l) => textWidth(l, 6.2)));
    const labelEvery = Math.max(1, Math.ceil((maxLabelW + 10) / spacing));
    return { lo, hi, ticks, tickLabels, padL, padR, padT, padB, plotW, plotH, y, x, spacing, bands, totals, labelEvery, baseline: y(Math.max(lo, Math.min(0, hi))) };
  });

  /** Rounded data-end, square at the baseline. */
  function barPath(x: number, w: number, yTop: number, yBase: number, radius = 4): string {
    const h = Math.abs(yBase - yTop);
    if (h < 0.5 || w <= 0) return '';
    const r = Math.min(radius, w / 2, h);
    if (yTop <= yBase) {
      return `M${x},${yBase}V${yTop + r}A${r},${r} 0 0 1 ${x + r},${yTop}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${yTop + r}V${yBase}Z`;
    }
    // Negative value: rounded end at the bottom.
    return `M${x},${yBase}V${yTop - r}A${r},${r} 0 0 0 ${x + r},${yTop}H${x + w - r}A${r},${r} 0 0 0 ${x + w},${yTop - r}V${yBase}Z`;
  }

  const bars = $derived.by(() => {
    const c = cartesian;
    if (!c || isLinear) return [];
    const nSeries = data.series.length;
    const out: Array<{ key: string; index: number; d: string; color: string; label?: { x: number; y: number; text: string } }> = [];
    if (isStacked) {
      const barW = Math.min(28, c.spacing * 0.56);
      for (let i = 0; i < data.n; i++) {
        let cum = 0;
        const segments = data.series
          .map((s, si) => ({ si, v: Math.max(0, s.values[i] ?? 0), color: s.color }))
          .filter((seg) => seg.v > 0);
        segments.forEach((seg, k) => {
          const isTop = k === segments.length - 1;
          const base = c.y(cum) - (k > 0 ? 2 : 0);
          const top = c.y(cum + seg.v);
          cum += seg.v;
          if (base - top < 0.5) return;
          const xBar = c.x(i) - barW / 2;
          const d = isTop
            ? barPath(xBar, barW, top, base)
            : `M${xBar},${base}V${top}H${xBar + barW}V${base}Z`;
          out.push({ key: `${i}-${seg.si}`, index: i, d, color: seg.color });
        });
        if (showValues && c.totals[i] > 0) {
          const text = formatCompact(c.totals[i]);
          if (textWidth(text) <= c.spacing - 4) out.push({ key: `${i}-total`, index: i, d: '', color: '', label: { x: c.x(i), y: c.y(c.totals[i]) - 8, text } });
        }
      }
      return out;
    }
    const gap = nSeries > 1 ? 2 : 0;
    const cap = nSeries > 1 ? 24 : 28;
    const barW = Math.max(2, Math.min(cap, (c.spacing * 0.72 - gap * (nSeries - 1)) / nSeries));
    const groupW = barW * nSeries + gap * (nSeries - 1);
    for (let i = 0; i < data.n; i++) {
      const x0 = c.x(i) - groupW / 2;
      data.series.forEach((s, si) => {
        const v = s.values[i];
        if (v === null) return;
        const xBar = x0 + si * (barW + gap);
        const d = barPath(xBar, barW, c.y(v), c.baseline);
        if (d) out.push({ key: `${i}-${si}`, index: i, d, color: s.color });
        if (showValues) {
          const text = formatCompact(v);
          const room = nSeries > 1 ? barW + gap : c.spacing - 4;
          if (textWidth(text) <= room) {
            out.push({ key: `${i}-${si}-v`, index: i, d: '', color: '', label: { x: xBar + barW / 2, y: v >= 0 ? c.y(v) - 8 : c.y(v) + 16, text } });
          }
        }
      });
    }
    return out;
  });

  /** Monotone cubic interpolation (no overshoot between points). */
  function monotonePath(points: Array<{ x: number; y: number }>): string {
    const n = points.length;
    if (n === 0) return '';
    const f = (v: number) => Math.round(v * 100) / 100;
    if (n === 1) return `M${f(points[0].x)},${f(points[0].y)}`;
    const dx: number[] = [];
    const slope: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      dx.push(points[i + 1].x - points[i].x);
      slope.push((points[i + 1].y - points[i].y) / (dx[i] || 1));
    }
    const tangent: number[] = [slope[0]];
    for (let i = 1; i < n - 1; i++) {
      if (slope[i - 1] * slope[i] <= 0) tangent.push(0);
      else tangent.push((3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]));
    }
    tangent.push(slope[n - 2]);
    let d = `M${f(points[0].x)},${f(points[0].y)}`;
    for (let i = 0; i < n - 1; i++) {
      const third = dx[i] / 3;
      d += `C${f(points[i].x + third)},${f(points[i].y + tangent[i] * third)} ${f(points[i + 1].x - third)},${f(points[i + 1].y - tangent[i + 1] * third)} ${f(points[i + 1].x)},${f(points[i + 1].y)}`;
    }
    return d;
  }

  const lines = $derived.by(() => {
    const c = cartesian;
    if (!c || !isLinear) return [];
    return data.series.map((s, si) => {
      // Split into contiguous runs so missing values render as gaps.
      const runs: Array<Array<{ x: number; y: number; i: number }>> = [];
      let current: Array<{ x: number; y: number; i: number }> = [];
      s.values.forEach((v, i) => {
        if (v === null) {
          if (current.length) runs.push(current);
          current = [];
        } else current.push({ x: c.x(i), y: c.y(v), i });
      });
      if (current.length) runs.push(current);
      const line = runs.map((run) => monotonePath(run)).join('');
      const area = runs
        .filter((run) => run.length > 1)
        .map((run) => `${monotonePath(run)}L${run[run.length - 1].x},${c.baseline}L${run[0].x},${c.baseline}Z`)
        .join('');
      const isolated = runs.filter((run) => run.length === 1).map((run) => run[0]);
      const lastRun = runs[runs.length - 1];
      const end = lastRun ? lastRun[lastRun.length - 1] : null;
      const labels =
        showValues && c.spacing >= 44
          ? s.values.flatMap((v, i) => (v === null ? [] : [{ i, x: c.x(i), y: c.y(v) - 10, text: formatCompact(v) }]))
          : showValues && end
            ? [{ i: end.i, x: end.x, y: end.y - 10, text: formatCompact(s.values[end.i] ?? 0) }]
            : [];
      return { key: si, name: s.name, color: s.color, line, area, isolated, end, labels, gradientId: `${uid}-grad-${si}` };
    });
  });

  /* ------------------------------------------------------------------ donut */

  const donut = $derived.by(() => {
    if (!isDonut || !hasData) return null;
    const first = data.series[0];
    const entries = data.labels
      .map((label, i) => ({ label, value: Math.max(0, first.values[i] ?? 0) }))
      .filter((e) => e.value > 0);
    let slices = entries;
    if (entries.length > MAX_DONUT_SLICES) {
      const head = entries.slice(0, MAX_DONUT_SLICES - 1);
      const other = entries.slice(MAX_DONUT_SLICES - 1).reduce((sum, e) => sum + e.value, 0);
      slices = [...head, { label: 'Other', value: other }];
    }
    const total = slices.reduce((sum, s) => sum + s.value, 0);
    if (total <= 0) return null;
    const size = Math.min(plotHeight, 280);
    const cx = size / 2;
    const cy = size / 2;
    const outer = size / 2 - 6;
    const inner = outer * 0.68;
    const pad = slices.length > 1 ? 2 / ((outer + inner) / 2) / 2 : 0;
    let angle = -Math.PI / 2;
    const folded = entries.length > MAX_DONUT_SLICES;
    const out = slices.map((s, i) => {
      const sweep = (s.value / total) * Math.PI * 2;
      const a0 = angle;
      const a1 = angle + sweep;
      angle = a1;
      const tone: Tone = folded && i === slices.length - 1 ? 'neutral' : DONUT_TONES[i % DONUT_TONES.length];
      const mid = (a0 + a1) / 2;
      const ringMid = (outer + inner) / 2;
      return {
        label: s.label,
        value: s.value,
        percent: (s.value / total) * 100,
        color: TONE_COLORS[tone],
        a0,
        a1,
        pad,
        cxPct: ((cx + Math.cos(mid) * ringMid) / size) * 100,
        cyPct: ((cy + Math.sin(mid) * ringMid) / size) * 100
      };
    });
    return { size, cx, cy, outer, inner, total, slices: out };
  });

  function arcPath(cx: number, cy: number, outer: number, inner: number, a0: number, a1: number, pad: number): string {
    const sweep = a1 - a0;
    if (sweep >= Math.PI * 2 - 1e-6) {
      // Full ring: two half arcs per edge.
      return `M${cx + outer},${cy}A${outer},${outer} 0 1 1 ${cx - outer},${cy}A${outer},${outer} 0 1 1 ${cx + outer},${cy}M${cx + inner},${cy}A${inner},${inner} 0 1 0 ${cx - inner},${cy}A${inner},${inner} 0 1 0 ${cx + inner},${cy}Z`;
    }
    const s = a0 + Math.min(pad, sweep / 4);
    const e = a1 - Math.min(pad, sweep / 4);
    const large = e - s > Math.PI ? 1 : 0;
    const p = (r: number, a: number) => `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`;
    return `M${p(outer, s)}A${outer},${outer} 0 ${large} 1 ${p(outer, e)}L${p(inner, e)}A${inner},${inner} 0 ${large} 0 ${p(inner, s)}Z`;
  }

  /* ------------------------------------------------------------------ interaction */

  let activeIndex = $state<number | null>(null);
  let focusIndex = $state(0);
  let hovering = false;

  const pointCount = $derived(isDonut ? (donut?.slices.length ?? 0) : data.n);
  const rovingIndex = $derived(Math.min(focusIndex, Math.max(0, pointCount - 1)));
  const active = $derived(activeIndex !== null && activeIndex < pointCount ? activeIndex : null);

  function pointLabel(i: number): string {
    if (isDonut && donut) {
      const s = donut.slices[i];
      return `${s.label}: ${formatValue(s.value)} (${trimNumber(s.percent, 1)}%)`;
    }
    const parts = data.series.map((s) => `${s.name} ${formatValue(s.values[i])}`);
    if (isStacked && cartesian) parts.push(`Total ${formatValue(cartesian.totals[i])}`);
    return `${data.labels[i]}: ${parts.join(', ')}`;
  }

  function indexFromPointer(event: PointerEvent, layer: HTMLElement): number | null {
    const rect = layer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    if (isDonut && donut) {
      const px = ((event.clientX - rect.left) / rect.width) * donut.size - donut.cx;
      const py = ((event.clientY - rect.top) / rect.height) * donut.size - donut.cy;
      const dist = Math.hypot(px, py);
      if (dist < donut.inner - 6 || dist > donut.outer + 10) return null;
      let a = Math.atan2(py, px);
      if (a < -Math.PI / 2) a += Math.PI * 2;
      const hit = donut.slices.findIndex((s) => a >= s.a0 && a < s.a1);
      return hit === -1 ? null : hit;
    }
    const c = cartesian;
    if (!c) return null;
    const px = ((event.clientX - rect.left) / rect.width) * vw;
    const hit = c.bands.findIndex((b) => px >= b.x0 && px < b.x1);
    return hit === -1 ? null : hit;
  }

  function trackPointer(layer: HTMLElement) {
    const move = (event: PointerEvent) => {
      hovering = true;
      activeIndex = indexFromPointer(event, layer);
    };
    const leave = () => {
      hovering = false;
      if (!layer.contains(document.activeElement)) activeIndex = null;
    };
    layer.addEventListener('pointermove', move);
    layer.addEventListener('pointerdown', move);
    layer.addEventListener('pointerleave', leave);
    return () => {
      layer.removeEventListener('pointermove', move);
      layer.removeEventListener('pointerdown', move);
      layer.removeEventListener('pointerleave', leave);
    };
  }

  function handlePointKeydown(event: KeyboardEvent, index: number) {
    if (pointCount === 0) return;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % pointCount;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + pointCount) % pointCount;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = pointCount - 1;
    else if (event.key === 'Escape') {
      activeIndex = null;
      return;
    } else return;
    event.preventDefault();
    focusIndex = next;
    activeIndex = next;
    document.getElementById(`${uid}-pt-${next}`)?.focus();
  }

  function handlePointFocus(index: number) {
    focusIndex = index;
    activeIndex = index;
  }

  function handlePointBlur() {
    if (!hovering) activeIndex = null;
  }

  /* ------------------------------------------------------------------ tooltip + summary */

  const tooltip = $derived.by(() => {
    if (active === null) return null;
    if (isDonut && donut) {
      const s = donut.slices[active];
      return {
        left: s.cxPct,
        top: s.cyPct,
        flip: s.cxPct > 55,
        heading: s.label,
        rows: [{ key: 'v', name: `${trimNumber(s.percent, 1)}% of total`, value: formatValue(s.value), color: s.color }]
      };
    }
    const c = cartesian;
    if (!c) return null;
    const left = (c.x(active) / vw) * 100;
    const rows = data.series.map((s, si) => ({ key: String(si), name: s.name, value: formatValue(s.values[active]), color: s.color }));
    if (isStacked) rows.push({ key: 'total', name: 'Total', value: formatValue(c.totals[active]), color: '' });
    return { left, top: (c.padT / plotHeight) * 100, flip: left > 58, heading: data.labels[active], rows };
  });

  const typeName = $derived(
    { bar: 'Bar chart', line: 'Line chart', area: 'Area chart', donut: 'Donut chart', 'stacked-bar': 'Stacked bar chart' }[chartType]
  );

  const summary = $derived.by(() => {
    const head = `${typeName}${title ? `: ${title}` : ''}.`;
    if (!hasData) return `${head} No data to display.`;
    if (isDonut && donut) {
      return `${head} Total ${formatValue(donut.total)}. ${donut.slices.map((s) => `${s.label} ${trimNumber(s.percent, 1)}%`).join(', ')}.`;
    }
    const range = data.n > 1 ? ` ${data.n} points from ${data.labels[0]} to ${data.labels[data.n - 1]}.` : '';
    const perSeries = data.series
      .map((s) => {
        const present = s.values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
        if (!present.length) return `${s.name}: no data.`;
        const low = present.reduce((a, b) => (b.v < a.v ? b : a));
        const high = present.reduce((a, b) => (b.v > a.v ? b : a));
        const last = present[present.length - 1];
        return `${s.name}: lowest ${formatValue(low.v)} (${data.labels[low.i]}), highest ${formatValue(high.v)} (${data.labels[high.i]}), latest ${formatValue(last.v)}.`;
      })
      .join(' ');
    return `${head}${range} ${perSeries}`;
  });

  const showLegendRow = $derived(showLegend && !isDonut && data.series.length > 1);
</script>

<figure {...rest} class={['chart', className]}>
  {#if title || subtitle}
    <figcaption class="caption">
      {#if title}
        <h3 class="title" data-prop="title">{title}</h3>
      {/if}
      {#if subtitle}
        <p class="subtitle" data-prop="subtitle">{subtitle}</p>
      {/if}
    </figcaption>
  {/if}

  {#if !hasData}
    <div class="empty" style:min-height="{plotHeight}px">
      <p>No data to display</p>
    </div>
  {:else if isDonut && donut}
    <div class="donut-layout">
      <div class="donut-plot" style:max-width="{donut.size}px">
        <svg class="svg" viewBox="0 0 {donut.size} {donut.size}" role="img" aria-label={summary}>
          {#each donut.slices as slice, i (i)}
            <path
              class={['slice', active !== null && active !== i && 'is-dimmed']}
              d={arcPath(donut.cx, donut.cy, active === i ? donut.outer + 4 : donut.outer, donut.inner, slice.a0, slice.a1, slice.pad)}
              style:fill={slice.color}
            />
          {/each}
          <text class="donut-total" x={donut.cx} y={donut.cy - 2} text-anchor="middle">{formatCompact(donut.total)}</text>
          <text class="donut-caption" x={donut.cx} y={donut.cy + 18} text-anchor="middle">Total</text>
        </svg>
        <div class="hit-layer" {@attach trackPointer}>
          {#each donut.slices as slice, i (i)}
            <button
              type="button"
              id="{uid}-pt-{i}"
              class="hit hit--dot"
              style:left="{slice.cxPct}%"
              style:top="{slice.cyPct}%"
              tabindex={i === rovingIndex ? 0 : -1}
              aria-label={pointLabel(i)}
              onfocus={() => handlePointFocus(i)}
              onblur={handlePointBlur}
              onkeydown={(event) => handlePointKeydown(event, i)}
            ></button>
          {/each}
        </div>
        {@render tip()}
      </div>
      {#if showLegend}
        <ul class="donut-legend">
          {#each donut.slices as slice, i (i)}
            <li class={['donut-legend-item', active === i && 'is-active']}>
              <span class="swatch" style:background-color={slice.color} aria-hidden="true"></span>
              <span class="legend-label">{slice.label}</span>
              <span class="legend-value">
                {#if showValues}<span class="legend-abs">{formatValue(slice.value)}</span>{/if}
                {trimNumber(slice.percent, 1)}%
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else if cartesian}
    {@const c = cartesian}
    <div class="plot" {@attach observeWidth}>
      <svg class="svg" viewBox="0 0 {vw} {plotHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label={summary}>
        {#if isLinear}
          <defs>
            {#each lines as l (l.key)}
              <linearGradient id={l.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style:stop-color={l.color} style:stop-opacity="0.22" />
                <stop offset="100%" style:stop-color={l.color} style:stop-opacity="0.02" />
              </linearGradient>
            {/each}
          </defs>
        {/if}

        {#each c.ticks as tick, ti (ti)}
          {#if showGrid || tick === 0}
            <line class={['grid', tick === 0 && 'grid--zero']} x1={c.padL} x2={vw - c.padR} y1={c.y(tick)} y2={c.y(tick)} />
          {/if}
          <text class="tick" x={c.padL - 10} y={c.y(tick)} dy="0.32em" text-anchor="end">{c.tickLabels[ti]}</text>
        {/each}

        {#each data.labels as label, i (i)}
          {#if i % c.labelEvery === 0}
            <text class="tick tick--x" x={c.x(i)} y={plotHeight - c.padB + 20} text-anchor="middle">{label}</text>
          {/if}
        {/each}

        {#if active !== null && !isLinear}
          <rect
            class="band"
            x={c.bands[active].x0 + 2}
            y={c.padT - 4}
            width={Math.max(0, c.bands[active].x1 - c.bands[active].x0 - 4)}
            height={c.plotH + 4}
            rx="6"
          />
        {/if}

        {#if isLinear}
          {#if active !== null}
            <line class="crosshair" x1={c.x(active)} x2={c.x(active)} y1={c.padT} y2={c.padT + c.plotH} />
          {/if}
          {#each lines as l (l.key)}
            {#if chartType === 'area' && l.area}
              <path class="area" d={l.area} fill="url(#{l.gradientId})" />
            {/if}
            <path class="line" d={l.line} style:stroke={l.color} />
            {#each l.isolated as p (p.i)}
              <circle class="marker" cx={p.x} cy={p.y} r="4" style:fill={l.color} />
            {/each}
            {#if l.end && active === null}
              <circle class="marker" cx={l.end.x} cy={l.end.y} r="4" style:fill={l.color} />
            {/if}
            {#each l.labels as lab (lab.i)}
              <text class="value-label" x={lab.x} y={lab.y} text-anchor="middle">{lab.text}</text>
            {/each}
          {/each}
          {#if active !== null}
            {#each data.series as s, si (si)}
              {@const v = s.values[active]}
              {#if v !== null}
                <circle class="marker marker--active" cx={c.x(active)} cy={c.y(v)} r="4.5" style:fill={s.color} />
              {/if}
            {/each}
          {/if}
        {:else}
          {#each bars as bar (bar.key)}
            {#if bar.label}
              <text class="value-label" x={bar.label.x} y={bar.label.y} text-anchor="middle">{bar.label.text}</text>
            {:else}
              <path class={['bar', active !== null && active !== bar.index && 'is-dimmed']} d={bar.d} style:fill={bar.color} />
            {/if}
          {/each}
        {/if}
      </svg>

      <div class="hit-layer" {@attach trackPointer}>
        {#each c.bands as band, i (i)}
          <button
            type="button"
            id="{uid}-pt-{i}"
            class="hit"
            style:left="{(band.x0 / vw) * 100}%"
            style:width="{((band.x1 - band.x0) / vw) * 100}%"
            style:top="{(c.padT / plotHeight) * 100}%"
            style:height="{(c.plotH / plotHeight) * 100}%"
            tabindex={i === rovingIndex ? 0 : -1}
            aria-label={pointLabel(i)}
            onfocus={() => handlePointFocus(i)}
            onblur={handlePointBlur}
            onkeydown={(event) => handlePointKeydown(event, i)}
          ></button>
        {/each}
      </div>
      {@render tip()}
    </div>
  {/if}

  {#if showLegendRow && hasData}
    <ul class="legend">
      {#each data.series as s, si (si)}
        <li class="legend-item">
          <span class={['swatch', isLinear && chartType === 'line' && 'swatch--line']} style:background-color={s.color} aria-hidden="true"></span>
          <span data-prop={`series.${si}.name`}>{s.name}</span>
        </li>
      {/each}
    </ul>
  {/if}

  {#if hasData}
    <table class="sr-only">
      <caption>{title || typeName}</caption>
      <thead>
        <tr>
          <th scope="col">{isDonut ? 'Segment' : 'Category'}</th>
          {#if isDonut && donut}
            <th scope="col">Value</th>
            <th scope="col">Share</th>
          {:else}
            {#each data.series as s, si (si)}
              <th scope="col">{s.name}</th>
            {/each}
          {/if}
        </tr>
      </thead>
      <tbody>
        {#if isDonut && donut}
          {#each donut.slices as slice, i (i)}
            <tr>
              <th scope="row">{slice.label}</th>
              <td>{formatValue(slice.value)}</td>
              <td>{trimNumber(slice.percent, 1)}%</td>
            </tr>
          {/each}
        {:else}
          {#each data.labels as label, i (i)}
            <tr>
              <th scope="row">{label}</th>
              {#each data.series as s, si (si)}
                <td>{formatValue(s.values[i])}</td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  {/if}
</figure>

{#snippet tip()}
  {#if tooltip}
    <div
      class={['tooltip', tooltip.flip && 'tooltip--flip']}
      style:left="{tooltip.left}%"
      style:top="{tooltip.top}%"
      aria-hidden="true"
    >
      <div class="tooltip-heading">{tooltip.heading}</div>
      {#each tooltip.rows as row (row.key)}
        <div class="tooltip-row">
          {#if row.color}
            <span class="tooltip-key" style:background-color={row.color}></span>
          {:else}
            <span class="tooltip-key tooltip-key--none"></span>
          {/if}
          <span class="tooltip-value">{row.value}</span>
          <span class="tooltip-name">{row.name}</span>
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

<style>
  .chart {
    --chart-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    --chart-grid: color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
    --chart-surface: var(--md-sys-color-surface-container-lowest);
    position: relative;
    min-width: 0;
    padding: 1.25rem 1.25rem 1rem;
    border: 1px solid var(--chart-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--chart-surface);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .caption {
    margin-bottom: 1rem;
  }
  .title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.005em;
  }
  .subtitle {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant);
  }
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--chart-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.875rem;
  }
  .plot,
  .donut-plot {
    position: relative;
    width: 100%;
  }
  .svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .grid {
    stroke: var(--chart-grid);
    stroke-width: 1;
    shape-rendering: crispEdges;
  }
  .grid--zero {
    stroke: var(--md-sys-color-outline-variant);
  }
  .tick {
    fill: var(--md-sys-color-on-surface-variant);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .value-label {
    fill: var(--md-sys-color-on-surface);
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .band {
    fill: var(--md-sys-color-on-surface);
    opacity: 0.045;
  }
  .bar,
  .slice {
    transition: opacity var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .is-dimmed {
    opacity: 0.4;
  }
  .line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .crosshair {
    stroke: var(--md-sys-color-outline);
    stroke-width: 1;
    shape-rendering: crispEdges;
  }
  .marker {
    stroke: var(--chart-surface);
    stroke-width: 2;
  }
  .donut-total {
    fill: var(--md-sys-color-on-surface);
    font-size: 22px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .donut-caption {
    fill: var(--md-sys-color-on-surface-variant);
    font-size: 12px;
  }
  .hit-layer {
    position: absolute;
    inset: 0;
  }
  .hit {
    position: absolute;
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    cursor: default;
  }
  .hit--dot {
    width: 2.5rem;
    height: 2.5rem;
    transform: translate(-50%, -50%);
    border-radius: 50%;
  }
  .hit:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
  .tooltip {
    position: absolute;
    z-index: 2;
    min-width: 9rem;
    max-width: 16rem;
    padding: 0.5rem 0.625rem;
    border: 1px solid var(--chart-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
    transform: translateX(12px);
    pointer-events: none;
    font-size: 0.75rem;
    line-height: 1.35;
  }
  .tooltip--flip {
    transform: translateX(calc(-100% - 12px));
  }
  .tooltip-heading {
    margin-bottom: 0.375rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
  }
  .tooltip-row {
    display: grid;
    grid-template-columns: 0.75rem auto 1fr;
    align-items: center;
    gap: 0.5rem;
    padding: 0.125rem 0;
  }
  .tooltip-key {
    width: 0.75rem;
    height: 2px;
    border-radius: 1px;
  }
  .tooltip-value {
    font-weight: 650;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .tooltip-name {
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    margin-top: 0.75rem;
    list-style: none;
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .swatch {
    flex-shrink: 0;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 3px;
  }
  .swatch--line {
    width: 0.875rem;
    height: 2px;
    border-radius: 1px;
  }
  .donut-layout {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5rem 2rem;
  }
  .donut-plot {
    flex: 0 1 auto;
    margin: 0 auto;
  }
  .donut-legend {
    flex: 1 1 14rem;
    display: grid;
    gap: 0.25rem;
    list-style: none;
    font-size: 0.8125rem;
  }
  .donut-legend-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.625rem;
    padding: 0.375rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
  }
  .donut-legend-item.is-active {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .legend-label {
    color: var(--md-sys-color-on-surface);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .legend-value {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .legend-abs {
    margin-right: 0.5rem;
    font-weight: 400;
    color: var(--md-sys-color-on-surface-variant);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
