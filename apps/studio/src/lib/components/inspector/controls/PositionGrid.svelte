<script lang="ts">
  import { tooltip } from '../../../ui/tooltip.js';

  interface Props {
    /** A CSS `<position>` such as `center top` or `50% 50%`. */
    value: string;
    inherited?: boolean;
    onchange: (value: string) => void;
    ariaLabel: string;
  }

  let { value, inherited = false, onchange, ariaLabel }: Props = $props();

  const X = ['left', 'center', 'right'] as const;
  const Y = ['top', 'center', 'bottom'] as const;
  const NAMES: Record<string, string> = { left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom', center: 'Center' };

  /** Normalizes keyword / percentage positions to an `x y` keyword pair (or '' if custom). */
  const normalized = $derived.by(() => {
    const parts = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const pct: Record<string, string> = { '0%': 'start', '50%': 'center', '100%': 'end' };
    const toX = (t: string) => (t === 'start' ? 'left' : t === 'end' ? 'right' : t);
    const toY = (t: string) => (t === 'start' ? 'top' : t === 'end' ? 'bottom' : t);
    if (parts.length === 0) return '';
    if (parts.length === 1) {
      const p = pct[parts[0]] ?? parts[0];
      if (p === 'top' || p === 'bottom') return `center ${p}`;
      if (p === 'left' || p === 'right') return `${p} center`;
      return p === 'center' ? 'center center' : '';
    }
    let [a, b] = parts.map((p) => pct[p] ?? p);
    if (a === 'top' || a === 'bottom' || b === 'left' || b === 'right') [a, b] = [b, a];
    const x = toX(a);
    const y = toY(b);
    return (X as readonly string[]).includes(x) && (Y as readonly string[]).includes(y) ? `${x} ${y}` : '';
  });

  function label(x: string, y: string): string {
    if (x === 'center' && y === 'center') return 'Center';
    if (x === 'center') return NAMES[y];
    if (y === 'center') return NAMES[x];
    return `${NAMES[y]} ${NAMES[x].toLowerCase()}`;
  }
</script>

<div class={['pg', inherited && 'pg--inherited']} role="group" aria-label={ariaLabel}>
  {#each Y as y (y)}
    {#each X as x (x)}
      {@const v = `${x} ${y}`}
      <button
        type="button"
        class="pg__cell"
        aria-pressed={normalized === v}
        aria-label={label(x, y)}
        {@attach tooltip(label(x, y))}
        onclick={() => onchange(v)}
      >
        <span class="pg__dot"></span>
      </button>
    {/each}
  {/each}
</div>

<style>
  .pg {
    display: grid;
    grid-template-columns: repeat(3, 20px);
    grid-template-rows: repeat(3, 20px);
    gap: 2px;
    padding: 3px;
    border-radius: var(--sx-radius-sm);
    background: var(--sx-hover);
    width: max-content;
  }
  .pg__cell {
    display: grid;
    place-items: center;
    border-radius: 3px;
  }
  .pg__cell:hover {
    background: var(--sx-panel);
  }
  .pg__dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--sx-text-3);
  }
  .pg__cell[aria-pressed='true'] {
    background: var(--sx-panel);
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.12);
  }
  .pg__cell[aria-pressed='true'] .pg__dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--sx-accent);
  }
  .pg--inherited .pg__cell[aria-pressed='true'] .pg__dot {
    background: var(--sx-text-2);
  }
</style>
