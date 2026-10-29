<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    text?: string;
    /** Link label; the link is hidden when empty. */
    linkText?: string;
    href?: string;
    tone?: 'primary' | 'dark' | 'subtle' | 'gradient';
    /** Icon name from the shared icon set, or `none`. */
    icon?: string;
    dismissible?: boolean;
    align?: 'left' | 'center';
    class?: string;
  }

  let {
    text = 'Workspace analytics are now available on every plan.',
    linkText = 'See what’s new',
    href = '/features',
    tone = 'dark',
    icon = 'Sparkle',
    dismissible = true,
    align = 'center',
    class: className = '',
    ...rest
  }: Props = $props();

  let dismissed = $state(false);
  const showIcon = $derived(Boolean(icon) && icon !== 'none');
</script>

{#if !dismissed}
  <div
    {...rest}
    role="region"
    aria-label="Announcement"
    class={['announcement', `tone-${tone}`, `align-${align}`, dismissible && 'announcement--dismissible', className]}
  >
    <div class="inner">
      <p class="message">
        {#if showIcon}
          <span class="icon"><Icon name={icon} size={16} /></span>
        {/if}
        <span class="text" data-prop="text">{text}</span>
        {#if linkText}
          <a class="link" href={safeHref(href)}>
            <span data-prop="linkText">{linkText}</span>
            <Icon name="ArrowRight" size={14} class="arrow" />
          </a>
        {/if}
      </p>
      {#if dismissible}
        <button type="button" class="dismiss" aria-label="Dismiss announcement" onclick={() => (dismissed = true)}>
          <Icon name="X" size={16} />
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .announcement {
    --bar-bg: var(--md-sys-color-on-surface);
    --bar-fg: var(--md-sys-color-surface);
    --bar-muted: color-mix(in srgb, var(--md-sys-color-surface) 72%, transparent);
    --bar-hover: rgba(255, 255, 255, 0.12);
    position: relative;
    width: 100%;
    background: var(--bar-bg);
    color: var(--bar-fg);
  }
  .tone-primary {
    --bar-bg: var(--md-sys-color-primary);
    --bar-fg: var(--md-sys-color-on-primary);
    --bar-muted: color-mix(in srgb, var(--md-sys-color-on-primary) 80%, transparent);
  }
  .tone-gradient {
    --bar-bg: linear-gradient(
      90deg,
      var(--md-sys-color-primary) 0%,
      color-mix(in srgb, var(--md-sys-color-primary) 70%, var(--md-sys-color-tertiary)) 55%,
      color-mix(in srgb, var(--md-sys-color-primary) 45%, var(--md-sys-color-tertiary)) 100%
    );
    --bar-fg: var(--md-sys-color-on-primary);
    --bar-muted: color-mix(in srgb, var(--md-sys-color-on-primary) 80%, transparent);
  }
  .tone-subtle {
    --bar-bg: var(--md-sys-color-surface-container-low);
    --bar-fg: var(--md-sys-color-on-surface);
    --bar-muted: var(--md-sys-color-on-surface-variant);
    --bar-hover: rgba(0, 0, 0, 0.06);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }

  .inner {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 1280px;
    min-height: 2.75rem;
    margin: 0 auto;
    padding: 0.5rem 1.5rem;
  }
  .align-center .inner {
    justify-content: center;
  }
  .announcement--dismissible .inner {
    padding-right: 3.5rem;
  }
  .announcement--dismissible.align-center .inner {
    padding-left: 3.5rem;
  }

  /* Inline flow (not flex) so the icon, message and link wrap like a sentence on small screens. */
  .message {
    min-width: 0;
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.5;
    letter-spacing: 0.005em;
    overflow-wrap: anywhere;
  }
  .align-center .message {
    text-align: center;
  }
  .icon {
    display: inline-flex;
    margin-right: 0.25rem;
    vertical-align: -0.1875em;
    color: var(--bar-muted);
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: 0.375rem;
    font-weight: 600;
    white-space: nowrap;
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
    transition: text-decoration-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .link:hover {
    text-decoration-color: currentColor;
  }
  .link :global(.arrow) {
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover :global(.arrow) {
    transform: translateX(2px);
  }
  .link:focus-visible,
  .dismiss:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .dismiss {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    display: inline-flex;
    width: 2.25rem;
    height: 2.25rem;
    align-items: center;
    justify-content: center;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--bar-muted);
    transform: translateY(-50%);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease,
      color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .dismiss:hover {
    color: var(--bar-fg);
    background-color: var(--bar-hover);
  }

  @media (max-width: 767px) {
    .inner {
      padding: 0.625rem 1rem;
    }
    .announcement--dismissible .inner,
    .announcement--dismissible.align-center .inner {
      padding-left: 1rem;
      padding-right: 3.25rem;
    }
    .message {
      font-size: 0.8125rem;
    }
    .dismiss {
      right: 0.375rem;
      width: 2.5rem;
      height: 2.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .link:hover :global(.arrow) {
      transform: none;
    }
  }
</style>
