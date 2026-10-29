<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeCssValue } from './lib/css.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    surfaceTone?: 'surface' | 'low' | 'container' | 'high' | 'primary-container' | 'inverse';
    paddingY?: 'sm' | 'md' | 'lg' | 'xl';
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
    surfaceTone = 'surface',
    paddingY = 'lg',
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

  /** Node id of this section: layout styles target the inner content area. */
  const nodeId = $derived(rest['data-node-id']);
  const isFlex = $derived(Boolean(direction || justify || align || gap));
</script>

<section {...rest} class={['section', `tone-${surfaceTone}`, `pad-${paddingY}`, className]}>
  <div
    class={['md-container', `md-container--${maxWidth}`]}
    data-layout-of={nodeId}
    style:display={isFlex ? 'flex' : undefined}
    style:flex-direction={isFlex ? (direction ?? 'column') : undefined}
    style:justify-content={justify}
    style:align-items={align}
    style:gap={safeCssValue(gap)}
    style:text-align={textAlign}
  >
    {@render children?.()}
  </div>
</section>

<style>
  .section {
    width: 100%;
  }
  .tone-surface { background-color: var(--md-sys-color-surface); }
  .tone-low { background-color: var(--md-sys-color-surface-container-low); }
  .tone-container { background-color: var(--md-sys-color-surface-container); }
  .tone-high { background-color: var(--md-sys-color-surface-container-high); }
  .tone-primary-container {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .tone-inverse {
    background-color: var(--md-sys-color-inverse-surface);
    color: var(--md-sys-color-inverse-on-surface);
  }
  .pad-sm { padding: 3rem 0; }
  .pad-md { padding: 4rem 0; }
  .pad-lg { padding: var(--md-sys-section-space, 6rem) 0; }
  .pad-xl { padding: 6rem 0; }
  @media (min-width: 1024px) {
    .pad-xl { padding: 8rem 0; }
  }
</style>
