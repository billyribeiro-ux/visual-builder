<script lang="ts">
  interface Props {
    variant?: 'elevated' | 'filled' | 'outlined';
    eyebrow?: string;
    title?: string;
    body?: string;
    actionText?: string;
    actionHref?: string;
    ctaText?: string;
    ctaHref?: string;
    align?: 'left' | 'center' | 'right';
    style?: string;
    onNavigate?: (href: string) => void;
  }

  let {
    variant = 'elevated',
    eyebrow = '',
    title = 'Card Title',
    body = '',
    actionText = '',
    actionHref = '#',
    ctaText = '',
    ctaHref = '#',
    align = 'left',
    style = '',
    onNavigate
  }: Props = $props();

  const resolvedActionText = $derived(actionText || ctaText);
  const resolvedActionHref = $derived(actionHref !== '#' ? actionHref : ctaHref);

  function handleNav(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<div
  class="md-card md-card-{variant}"
  style="{align === 'center' ? 'text-align: center; display: flex; flex-direction: column; align-items: center;' : align === 'right' ? 'text-align: right; display: flex; flex-direction: column; align-items: flex-end;' : ''}{style}"
>
  {#if eyebrow}
    <div class="md-label-medium" style="color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">{eyebrow}</div>
  {/if}
  {#if title}
    <h3 class="md-title-large" style="margin: 0 0 0.5rem 0;">{title}</h3>
  {/if}
  {#if body}
    <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.25rem 0;">{body}</p>
  {/if}
  {#if resolvedActionText}
    <a
      href={resolvedActionHref}
      onclick={(e) => handleNav(e, resolvedActionHref)}
      class="md-btn md-btn-tonal md-btn-sm"
    >
      {resolvedActionText}
    </a>
  {/if}
</div>
