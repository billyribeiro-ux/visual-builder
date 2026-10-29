<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeCssValue } from './lib/css.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    columns?: number;
    /** Token (sm, md, lg) or any CSS length. */
    gap?: string;
    alignItems?: 'stretch' | 'start' | 'center' | 'end';
    justifyItems?: 'stretch' | 'start' | 'center' | 'end';
    textAlign?: 'left' | 'center' | 'right';
    class?: string;
    children?: Snippet;
  }

  let {
    columns = 2,
    gap = '1.5rem',
    alignItems = 'stretch',
    justifyItems = 'stretch',
    textAlign = 'left',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const GAP_TOKENS: Record<string, string> = { sm: '1rem', md: '1.5rem', lg: '2.5rem' };
  const cols = $derived(Math.min(4, Math.max(1, Math.round(Number(columns) || 2))));
</script>

<div
  {...rest}
  class={['grid', `cols-${cols}`, className]}
  style:gap={GAP_TOKENS[gap] ?? safeCssValue(gap) ?? '1.5rem'}
  style:align-items={alignItems}
  style:justify-items={justifyItems}
  style:text-align={textAlign}
>
  {@render children?.()}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: 1fr;
  }
  .cols-1 {
    grid-template-columns: 1fr;
  }
  @media (min-width: 768px) {
    .cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (min-width: 1024px) {
    .cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
</style>
