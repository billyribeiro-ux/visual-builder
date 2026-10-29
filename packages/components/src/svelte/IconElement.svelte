<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';
  import { resolveIconName } from './lib/icons.js';

  type Size = 'sm' | 'md' | 'lg' | 'xl';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Icon name (Phosphor name or alias). Unknown names render a sparkle. */
    name?: string;
    size?: Size;
    variant?: 'plain' | 'soft' | 'solid' | 'outline';
    tone?: 'default' | 'muted' | 'primary';
    align?: 'left' | 'center' | 'right';
    href?: string;
    /** Accessible label. Empty = decorative (links fall back to the icon name). */
    label?: string;
    class?: string;
  }

  let {
    name = 'Lightning',
    size = 'md',
    variant = 'soft',
    tone = 'primary',
    align = 'left',
    href = '',
    label = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const GLYPH: Record<Size, number> = { sm: 20, md: 28, lg: 40, xl: 56 };

  const glyph = $derived(GLYPH[size] ?? GLYPH.md);
  const framed = $derived(variant === 'soft' || variant === 'solid' || variant === 'outline');
  /** Links always need an accessible name: the label, else the icon's readable name. */
  const linkName = $derived(
    label.trim() ||
      (resolveIconName(name) ?? 'Icon')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())
  );
</script>

{#snippet glyphBox()}
  <span class={['box', `variant-${variant}`, framed && 'box--framed']} style:--icon-size="{glyph}px">
    <Icon {name} size={glyph} />
  </span>
{/snippet}

<div {...rest} class={['icon-element', `tone-${tone}`, `align-${align}`, className]}>
  {#if href}
    <a href={safeHref(href)} class="link">
      {@render glyphBox()}
      <span class="visually-hidden" data-prop="label">{linkName}</span>
    </a>
  {:else}
    {@render glyphBox()}
    {#if label}
      <span class="visually-hidden" data-prop="label">{label}</span>
    {/if}
  {/if}
</div>

<style>
  .icon-element {
    --tone: currentColor;
    --on-tone: var(--md-sys-color-surface);
    display: flex;
  }
  .tone-default {
    --tone: var(--md-sys-color-on-surface);
    --on-tone: var(--md-sys-color-surface);
  }
  .tone-muted {
    --tone: var(--md-sys-color-on-surface-variant);
    --on-tone: var(--md-sys-color-surface);
  }
  .tone-primary {
    --tone: var(--md-sys-color-primary);
    --on-tone: var(--md-sys-color-on-primary);
  }
  .align-left {
    justify-content: flex-start;
  }
  .align-center {
    justify-content: center;
  }
  .align-right {
    justify-content: flex-end;
  }
  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--tone);
    line-height: 0;
  }
  .box--framed {
    width: calc(var(--icon-size) * 2);
    height: calc(var(--icon-size) * 2);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    transition:
      transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .variant-soft {
    background-color: color-mix(in srgb, var(--tone) 12%, transparent);
  }
  .variant-solid {
    background-color: var(--tone);
    color: var(--on-tone);
  }
  .variant-outline {
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--tone) 55%, transparent);
  }
  .link {
    display: inline-flex;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
  }
  .link:hover .box--framed {
    transform: translateY(-1px);
  }
  .link:hover .variant-soft {
    background-color: color-mix(in srgb, var(--tone) 18%, transparent);
  }
  .link:hover .variant-plain {
    opacity: 0.8;
  }
  .link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
