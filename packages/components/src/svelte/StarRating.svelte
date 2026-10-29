<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { ICON_VIEWBOX } from './lib/icons.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Score; fractions render as partially filled stars. Clamped to 0–max. */
    rating?: number;
    /** Number of stars (1–10). */
    max?: number;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    tone?: 'gold' | 'primary' | 'neutral';
    align?: 'left' | 'center' | 'right';
    class?: string;
  }

  let {
    rating = 4.8,
    max = 5,
    label = '4.8 out of 5 from 2,400 reviews',
    size = 'md',
    tone = 'gold',
    align = 'left',
    class: className = '',
    ...rest
  }: Props = $props();

  /*
   * Solid star glyph: Phosphor "Star" (fill weight), MIT License, Copyright (c) 2020 Phosphor Icons.
   * The shared icon set only ships the outline (regular) weight, and a rating needs a solid,
   * clippable shape for partial fills.
   */
  const STAR_PATH =
    'M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z';

  const count = $derived(typeof max === 'number' && Number.isFinite(max) ? Math.min(10, Math.max(1, Math.round(max))) : 5);
  const score = $derived(typeof rating === 'number' && Number.isFinite(rating) ? Math.min(count, Math.max(0, rating)) : 0);
  /** Fill ratio (0–1) of every star. */
  const fills = $derived(Array.from({ length: count }, (_, i) => Math.min(1, Math.max(0, score - i))));
  const scoreText = $derived(String(Math.round(score * 10) / 10));
  const ariaLabel = $derived(`Rated ${scoreText} out of ${count} stars`);
</script>

<div {...rest} class={['rating', `rating--${size}`, `tone-${tone}`, `align-${align}`, className]}>
  <span class="stars" role="img" aria-label={ariaLabel}>
    {#each fills as fill, index (index)}
      <span class="star" aria-hidden="true">
        <svg class="glyph glyph--empty" viewBox={ICON_VIEWBOX} focusable="false"><path d={STAR_PATH} /></svg>
        {#if fill > 0}
          <span class="fill" style:width="{Math.round(fill * 1000) / 10}%">
            <svg class="glyph glyph--full" viewBox={ICON_VIEWBOX} focusable="false"><path d={STAR_PATH} /></svg>
          </span>
        {/if}
      </span>
    {/each}
  </span>
  {#if label}
    <span class="label" data-prop="label">{label}</span>
  {/if}
</div>

<style>
  .rating {
    --star-size: 20px;
    --star-color: #f5a524;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    color: var(--md-sys-color-on-surface);
  }
  .rating--sm {
    --star-size: 16px;
    gap: 0.375rem 0.625rem;
  }
  .rating--lg {
    --star-size: 28px;
  }
  .align-left {
    justify-content: flex-start;
  }
  .align-center {
    justify-content: center;
    text-align: center;
  }
  .align-right {
    justify-content: flex-end;
    text-align: right;
  }
  .tone-primary {
    --star-color: var(--md-sys-color-primary);
  }
  .tone-neutral {
    --star-color: var(--md-sys-color-on-surface);
  }

  .stars {
    display: inline-flex;
    flex: 0 0 auto;
    gap: calc(var(--star-size) * 0.1);
  }
  .star {
    position: relative;
    display: inline-block;
    width: var(--star-size);
    height: var(--star-size);
    flex: 0 0 auto;
  }
  .glyph {
    display: block;
    width: var(--star-size);
    height: var(--star-size);
    max-width: none;
    fill: currentColor;
  }
  .glyph--empty {
    color: color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, var(--md-sys-color-outline));
  }
  .fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    overflow: hidden;
    color: var(--star-color);
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
    color: var(--md-sys-color-on-surface-variant);
  }
  .rating--sm .label {
    font-size: 0.8125rem;
  }
  .rating--lg .label {
    font-size: 1rem;
  }
</style>
