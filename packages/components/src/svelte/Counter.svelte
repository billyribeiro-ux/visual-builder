<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';

  type Separator = 'comma' | 'period' | 'space' | 'apostrophe' | 'none';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'prefix'> {
    start?: number;
    end?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    label?: string;
    separator?: Separator;
    /** Animation length in ms; 0 shows the final value immediately. */
    duration?: number;
    align?: 'left' | 'center' | 'right';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  }

  let {
    start = 0,
    end = 12500,
    decimals = 0,
    prefix = '',
    suffix = '+',
    label = 'Teams onboarded',
    separator = 'comma',
    duration = 2000,
    align = 'center',
    size = 'lg',
    class: className = '',
    ...rest
  }: Props = $props();

  const GROUP_MARK: Record<Separator, string> = {
    comma: ',',
    period: '.',
    space: '\u00A0',
    apostrophe: '\u2019',
    none: ''
  };

  function finite(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  /** Fixed-decimal formatting with a configurable thousands separator (locale independent, SSR-stable). */
  function formatNumber(value: number, places: number, sep: Separator): string {
    const fixed = Math.abs(value).toFixed(places);
    const [whole, fraction] = fixed.split('.');
    const group = GROUP_MARK[sep] ?? ',';
    const grouped = group ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, group) : whole;
    const decimalMark = sep === 'period' ? ',' : '.';
    const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
    return `${sign}${grouped}${fraction ? decimalMark + fraction : ''}`;
  }

  const from = $derived(finite(start, 0));
  const to = $derived(finite(end, 0));
  const places = $derived(Math.min(4, Math.max(0, Math.round(finite(decimals, 0)))));
  const ms = $derived(Math.min(10000, Math.max(0, finite(duration, 0))));
  const finalText = $derived(formatNumber(to, places, separator));

  /** `null` shows the final value (server render, no-JS, reduced motion, finished animation). */
  let current = $state<number | null>(null);
  const shownText = $derived(current === null ? finalText : formatNumber(current, places, separator));

  /** Counts from `from` to `to` once, the first time the element scrolls into view. */
  const countOnView: Attachment<HTMLElement> = (node) => {
    const a = from;
    const b = to;
    const length = ms;
    void places;
    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof IntersectionObserver === 'undefined' || reduceMotion || length <= 0 || a === b) {
      current = null;
      return;
    }
    current = a;
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const startedAt = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / length);
          const eased = 1 - Math.pow(1 - progress, 3);
          current = progress >= 1 ? null : a + (b - a) * eased;
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  };
</script>

<div {...rest} class={['counter', `counter--${size}`, `counter--${align}`, className]}>
  <p class="figure">
    <span class="visually-hidden">{prefix}{finalText}{suffix}</span>
    <span class="value" aria-hidden="true" {@attach countOnView}>
      <span class="ghost">{prefix}{finalText}{suffix}</span>
      <span class="live">
        {#if prefix}<span class="affix" data-prop="prefix">{prefix}</span>{/if}<span class="digits">{shownText}</span>{#if suffix}<span
            class="affix"
            data-prop="suffix">{suffix}</span
          >{/if}
      </span>
    </span>
  </p>
  {#if label}
    <p class="label" data-prop="label">{label}</p>
  {/if}
</div>

<style>
  .counter {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    color: var(--md-sys-color-on-surface);
  }
  .counter--left {
    align-items: flex-start;
    text-align: left;
  }
  .counter--center {
    align-items: center;
    text-align: center;
  }
  .counter--right {
    align-items: flex-end;
    text-align: right;
  }

  .figure {
    margin: 0;
    font-family: var(--md-sys-font-heading, inherit);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.035em;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }
  .counter--sm .figure {
    font-size: 2rem;
  }
  .counter--md .figure {
    font-size: clamp(2.25rem, 3vw + 1.25rem, 2.75rem);
  }
  .counter--lg .figure {
    font-size: clamp(2.5rem, 4vw + 1.25rem, 3.5rem);
  }
  .counter--xl .figure {
    font-size: clamp(3rem, 6vw + 1rem, 4.5rem);
  }

  /* Ghost and live copies share one grid cell: the ghost (final value) reserves the width. */
  .value {
    display: inline-grid;
  }
  .ghost,
  .live {
    grid-area: 1 / 1;
    white-space: nowrap;
  }
  .ghost {
    visibility: hidden;
  }
  .counter--left .live {
    justify-self: start;
  }
  .counter--center .live {
    justify-self: center;
  }
  .counter--right .live {
    justify-self: end;
  }
  .affix {
    color: var(--md-sys-color-primary);
  }

  .label {
    margin: 0;
    max-width: 32ch;
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant);
  }
  .counter--sm .label {
    font-size: 0.875rem;
  }
  .counter--xl .label {
    font-size: 1.0625rem;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
