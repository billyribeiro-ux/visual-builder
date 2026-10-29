<script module lang="ts">
  export type GlyphName =
    | 'justify-start'
    | 'justify-center'
    | 'justify-end'
    | 'justify-between'
    | 'justify-around'
    | 'justify-evenly'
    | 'align-start'
    | 'align-center'
    | 'align-end'
    | 'align-stretch'
    | 'align-baseline'
    | 'corner-tl'
    | 'corner-tr'
    | 'corner-br'
    | 'corner-bl'
    | 'radius-all'
    | 'border-none'
    | 'border-solid'
    | 'border-dashed'
    | 'border-dotted';

  interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  interface GlyphDef {
    rects?: Rect[];
    /** Solid guide lines (container edges): [x1, y1, x2, y2]. */
    lines?: Array<[number, number, number, number]>;
    /** Dashed guide lines (center / baseline). */
    dashed?: Array<[number, number, number, number]>;
    path?: string;
    /** Stroke dash pattern for `path` (border style previews). */
    dash?: string;
  }

  const EDGES_V: Array<[number, number, number, number]> = [
    [1.5, 2.5, 1.5, 13.5],
    [14.5, 2.5, 14.5, 13.5]
  ];

  /**
   * Hand-drawn 16px glyphs for flexbox/grid distribution and corner radius. Drawn for a
   * horizontal main axis; the caller rotates them for column / reversed directions.
   */
  const GLYPHS: Record<GlyphName, GlyphDef> = {
    'justify-start': { lines: [EDGES_V[0]], rects: [{ x: 3, y: 4, w: 3, h: 8 }, { x: 7, y: 4, w: 3, h: 8 }] },
    'justify-center': { dashed: [[8, 2, 8, 14]], rects: [{ x: 4.5, y: 4, w: 3, h: 8 }, { x: 8.5, y: 4, w: 3, h: 8 }] },
    'justify-end': { lines: [EDGES_V[1]], rects: [{ x: 6, y: 4, w: 3, h: 8 }, { x: 10, y: 4, w: 3, h: 8 }] },
    'justify-between': { lines: EDGES_V, rects: [{ x: 3, y: 4, w: 2.5, h: 8 }, { x: 6.75, y: 4, w: 2.5, h: 8 }, { x: 10.5, y: 4, w: 2.5, h: 8 }] },
    'justify-around': { lines: EDGES_V, rects: [{ x: 3.75, y: 4, w: 2, h: 8 }, { x: 7, y: 4, w: 2, h: 8 }, { x: 10.25, y: 4, w: 2, h: 8 }] },
    'justify-evenly': { lines: EDGES_V, rects: [{ x: 4.25, y: 4, w: 1.75, h: 8 }, { x: 7.125, y: 4, w: 1.75, h: 8 }, { x: 10, y: 4, w: 1.75, h: 8 }] },
    'align-start': { lines: [[2, 1.5, 14, 1.5]], rects: [{ x: 4, y: 3, w: 3, h: 5 }, { x: 9, y: 3, w: 3, h: 9 }] },
    'align-center': { dashed: [[2, 8, 14, 8]], rects: [{ x: 4, y: 5.5, w: 3, h: 5 }, { x: 9, y: 3, w: 3, h: 10 }] },
    'align-end': { lines: [[2, 14.5, 14, 14.5]], rects: [{ x: 4, y: 8, w: 3, h: 5 }, { x: 9, y: 4, w: 3, h: 9 }] },
    'align-stretch': {
      lines: [
        [2, 1.5, 14, 1.5],
        [2, 14.5, 14, 14.5]
      ],
      rects: [{ x: 4, y: 3, w: 3, h: 10 }, { x: 9, y: 3, w: 3, h: 10 }]
    },
    'align-baseline': { dashed: [[2, 9.5, 14, 9.5]], rects: [{ x: 4, y: 5, w: 3, h: 4.5 }, { x: 9, y: 3, w: 3, h: 6.5 }] },
    'corner-tl': { path: 'M3.5 13V8a4.5 4.5 0 0 1 4.5-4.5h5' },
    'corner-tr': { path: 'M3 3.5h5a4.5 4.5 0 0 1 4.5 4.5v5' },
    'corner-br': { path: 'M12.5 3v5a4.5 4.5 0 0 1-4.5 4.5H3' },
    'corner-bl': { path: 'M13 12.5H8A4.5 4.5 0 0 1 3.5 8V3' },
    'radius-all': { path: 'M3.5 7V6a2.5 2.5 0 0 1 2.5-2.5h1M9 3.5h1A2.5 2.5 0 0 1 12.5 6v1M12.5 9v1a2.5 2.5 0 0 1-2.5 2.5H9M7 12.5H6A2.5 2.5 0 0 1 3.5 10V9' },
    'border-none': { path: 'M3 13L13 3', dash: '' },
    'border-solid': { path: 'M2 8h12' },
    'border-dashed': { path: 'M2 8h12', dash: '3 2' },
    'border-dotted': { path: 'M2.5 8h11', dash: '0.01 2.5' }
  };
</script>

<script lang="ts">
  interface Props {
    name: GlyphName;
    size?: number;
    /** Degrees, for column / reversed axes. */
    rotate?: number;
  }

  let { name, size = 16, rotate = 0 }: Props = $props();

  const g = $derived(GLYPHS[name]);
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 16 16"
  fill="none"
  aria-hidden="true"
  focusable="false"
  style:transform={rotate ? `rotate(${rotate}deg)` : undefined}
>
  {#each g.lines ?? [] as [x1, y1, x2, y2] (`${x1}-${y1}-${x2}-${y2}`)}
    <line {x1} {y1} {x2} {y2} stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.55" />
  {/each}
  {#each g.dashed ?? [] as [x1, y1, x2, y2] (`${x1}-${y1}-${x2}-${y2}`)}
    <line {x1} {y1} {x2} {y2} stroke="currentColor" stroke-width="1" stroke-dasharray="1.5 1.5" opacity="0.55" />
  {/each}
  {#each g.rects ?? [] as r (`${r.x}-${r.y}-${r.w}-${r.h}`)}
    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="0.75" fill="currentColor" />
  {/each}
  {#if g.path}
    <path d={g.path} stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray={g.dash || undefined} />
  {/if}
</svg>

<style>
  svg {
    display: block;
    flex-shrink: 0;
    transition: transform var(--sx-dur) var(--sx-ease);
  }
</style>
