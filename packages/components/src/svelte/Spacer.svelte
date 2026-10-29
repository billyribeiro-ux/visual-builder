<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Height on tablet and desktop, in `unit`. */
    height?: number;
    /** Optional height at 767px and below, in `unit`. */
    mobileHeight?: number;
    unit?: 'px' | 'rem' | 'vh';
    class?: string;
  }

  let { height = 64, mobileHeight, unit = 'px', class: className = '', ...rest }: Props = $props();

  const UNITS = ['px', 'rem', 'vh'];

  /** Finite, non-negative and at most 800; anything else becomes `fallback`. */
  function clampLength(value: unknown, fallback: number | undefined): number | undefined {
    const n = typeof value === 'number' ? value : Number.NaN;
    return Number.isFinite(n) && n >= 0 ? Math.min(n, 800) : fallback;
  }

  const safeUnit = $derived(UNITS.includes(unit) ? unit : 'px');
  const desktop = $derived(`${clampLength(height, 64)}${safeUnit}`);
  const mobileValue = $derived(clampLength(mobileHeight, undefined));
  const mobile = $derived(mobileValue === undefined ? desktop : `${mobileValue}${safeUnit}`);
</script>

<div {...rest} class={['spacer', className]} style:--spacer-height={desktop} style:--spacer-height-mobile={mobile} aria-hidden="true"></div>

<style>
  .spacer {
    display: block;
    width: 100%;
    height: var(--spacer-height, 64px);
  }
  @media (max-width: 767px) {
    .spacer {
      height: var(--spacer-height-mobile, var(--spacer-height, 64px));
    }
  }
</style>
