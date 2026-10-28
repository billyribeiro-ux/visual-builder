<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    direction?: 'column' | 'row' | 'column-reverse' | 'row-reverse' | string;
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly' | string;
    align?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | string;
    textAlign?: 'left' | 'center' | 'right' | string;
    gap?: string;
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let {
    maxWidth = 'xl',
    direction = '',
    justify = '',
    align = '',
    textAlign = '',
    gap = '',
    class: customClass = '',
    style = '',
    children
  }: Props = $props();

  const computedFlexStyle = $derived.by(() => {
    const parts: string[] = [];
    const hasFlexProp = Boolean(direction || justify || align || gap);
    if (hasFlexProp) {
      parts.push('display: flex');
      parts.push(`flex-direction: ${direction || 'column'}`);
    }
    if (justify) parts.push(`justify-content: ${justify}`);
    if (align) parts.push(`align-items: ${align}`);
    if (gap) parts.push(`gap: ${gap}`);
    if (textAlign) parts.push(`text-align: ${textAlign}`);
    if (style) parts.push(style);
    return parts.join('; ');
  });
</script>

<div class="md-container md-container--{maxWidth} {customClass}" style={computedFlexStyle}>
  {@render children?.()}
</div>
