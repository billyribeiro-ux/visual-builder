<script lang="ts">
  interface Props {
    variant?: 'elevated' | 'filled' | 'outlined';
    eyebrow?: string;
    title?: string;
    body?: string;
    actionText?: string;
    actionHref?: string;
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
    style = '',
    onNavigate
  }: Props = $props();

  function handleNav(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<div class="md-card md-card-{variant}" style={style}>
  {#if eyebrow}
    <div class="md-label-medium" style="color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">{eyebrow}</div>
  {/if}
  {#if title}
    <h3 class="md-title-large" style="margin: 0 0 0.5rem 0;">{title}</h3>
  {/if}
  {#if body}
    <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.25rem 0;">{body}</p>
  {/if}
  {#if actionText}
    <a
      href={actionHref}
      onclick={(e) => handleNav(e, actionHref)}
      class="md-btn md-btn-tonal md-btn-sm"
    >
      {actionText}
    </a>
  {/if}
</div>
