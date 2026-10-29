<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeCssValue } from './lib/css.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    direction?: 'column' | 'row' | 'column-reverse' | 'row-reverse';
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
    align?: 'stretch' | 'flex-start' | 'center' | 'flex-end';
    textAlign?: 'left' | 'center' | 'right';
    gap?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    maxWidth = 'xl',
    direction,
    justify,
    align,
    textAlign,
    gap,
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  /** Flex only when a layout prop is set; otherwise a plain block wrapper. */
  const isFlex = $derived(Boolean(direction || justify || align || gap));
</script>

<div
  {...rest}
  class={['md-container', `md-container--${maxWidth}`, className]}
  style:display={isFlex ? 'flex' : undefined}
  style:flex-direction={isFlex ? (direction ?? 'column') : undefined}
  style:justify-content={justify}
  style:align-items={align}
  style:gap={safeCssValue(gap)}
  style:text-align={textAlign}
>
  {@render children?.()}
</div>
