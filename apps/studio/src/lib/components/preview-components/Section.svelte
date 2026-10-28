<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'surface' | 'surface-low' | 'surface-high' | 'primary-container' | 'low' | 'container' | 'high' | string;
    surfaceTone?: string;
    paddingY?: 'sm' | 'md' | 'lg' | 'xl' | string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
    direction?: 'column' | 'row' | 'column-reverse' | 'row-reverse' | string;
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly' | string;
    align?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | string;
    textAlign?: 'left' | 'center' | 'right' | string;
    gap?: string;
    style?: string;
    contentStyle?: string;
    children?: Snippet;
  }

  let {
    variant = 'surface',
    surfaceTone = '',
    paddingY = 'lg',
    maxWidth = 'xl',
    direction = '',
    justify = '',
    align = '',
    textAlign = '',
    gap = '',
    style = '',
    contentStyle = '',
    children
  }: Props = $props();

  const bgMap: Record<string, string> = {
    surface: 'var(--md-sys-color-surface)',
    low: 'var(--md-sys-color-surface-container-low)',
    'surface-low': 'var(--md-sys-color-surface-container-low)',
    container: 'var(--md-sys-color-surface-container)',
    high: 'var(--md-sys-color-surface-container-high)',
    'surface-high': 'var(--md-sys-color-surface-container-high)',
    'primary-container': 'var(--md-sys-color-primary-container)'
  };

  const padMap: Record<string, string> = {
    sm: '2rem 0',
    md: '3.5rem 0',
    lg: '5rem 0',
    xl: '7rem 0'
  };

  const effectiveBg = $derived(bgMap[surfaceTone || variant] || bgMap.surface);

  const innerFlexStyle = $derived.by(() => {
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
    if (contentStyle) parts.push(contentStyle);
    return parts.join('; ');
  });
</script>

<section
  class="md-section"
  style="background-color: {effectiveBg}; padding: {padMap[paddingY] || padMap.lg}; {style}"
>
  <div class="md-container md-container--{maxWidth}" style={innerFlexStyle}>
    {@render children?.()}
  </div>
</section>
