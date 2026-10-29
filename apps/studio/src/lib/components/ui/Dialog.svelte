<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import IconButton from '#lib/ui/IconButton.svelte';
  import { focusScope, trapTab } from '../dialogs/focus-trap.js';

  type IconComponent = Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;

  interface Props {
    open: boolean;
    title: string;
    subtitle?: string;
    /** Back-compat alias for `subtitle`. */
    description?: string;
    /** sm 440 · md 560 · lg 720 · xl 960 · full min(1200px, 100vw - 48px). */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Fixed panel height (CSS length). Defaults to content height capped by the viewport. */
    height?: string;
    /** Removes body padding and scrolling so the content can lay itself out (split panes, tables). */
    flush?: boolean;
    icon?: IconComponent;
    /** Selector of the element that receives focus on open (falls back to `[data-autofocus]`). */
    initialFocus?: string;
    onclose: () => void;
    headerActions?: Snippet;
    children: Snippet;
    footer?: Snippet;
  }

  let {
    open,
    title,
    subtitle,
    description,
    size = 'lg',
    height,
    flush = false,
    icon: Icon,
    initialFocus,
    onclose,
    headerActions,
    children,
    footer
  }: Props = $props();

  const uid = $props.id();
  const sub = $derived(subtitle ?? description);

  /** Only a press that both starts and ends on the scrim closes (never a drag out of a text field). */
  let pressedScrim = false;

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      onclose();
      return;
    }
    trapTab(event, event.currentTarget as HTMLElement);
  }
</script>

{#if open}
  <div
    class="sx-dialog-scrim dlg-scrim"
    role="presentation"
    onpointerdown={(e) => (pressedScrim = e.target === e.currentTarget)}
    onclick={(e) => {
      if (pressedScrim && e.target === e.currentTarget) onclose();
      pressedScrim = false;
    }}
  >
    <div
      class={['sx-dialog', 'dlg', `dlg--${size}`, flush && 'dlg--flush']}
      style:height
      role="dialog"
      aria-modal="true"
      aria-labelledby="{uid}-title"
      aria-describedby={sub ? `${uid}-sub` : undefined}
      tabindex="-1"
      onkeydown={onKeydown}
      {@attach focusScope({ initial: initialFocus })}
    >
      <header class="sx-dialog__header dlg__header">
        {#if Icon}
          <span class="dlg__icon" aria-hidden="true"><Icon size={16} /></span>
        {/if}
        <div class="dlg__titles">
          <h2 id="{uid}-title" class="sx-dialog__title">{title}</h2>
          {#if sub}<p id="{uid}-sub" class="sx-dialog__subtitle">{sub}</p>{/if}
        </div>
        {#if headerActions}
          <div class="dlg__actions">{@render headerActions()}</div>
        {/if}
        <IconButton label="Close" kbd="Esc" icon={XIcon} onclick={onclose} />
      </header>
      <div class={['sx-dialog__body', 'dlg__body', flush && 'dlg__body--flush']}>
        {@render children()}
      </div>
      {#if footer}
        <footer class="sx-dialog__footer dlg__footer">{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dlg-scrim {
    animation: dlg-fade 160ms var(--sx-ease);
  }
  .dlg {
    outline: none;
    animation: dlg-pop 160ms var(--sx-ease);
    transform-origin: 50% 40%;
  }
  .dlg--sm {
    width: min(440px, 100%);
  }
  .dlg--md {
    width: min(560px, 100%);
  }
  .dlg--lg {
    width: min(720px, 100%);
  }
  .dlg--xl {
    width: min(960px, 100%);
  }
  .dlg--full {
    width: min(1200px, calc(100vw - 48px));
  }
  .dlg__header {
    min-height: 60px;
    flex-shrink: 0;
  }
  .dlg__icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: var(--sx-radius-md);
    color: var(--sx-text-2);
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
  }
  .dlg__titles {
    flex: 1;
    min-width: 0;
  }
  .dlg__titles :global(.sx-dialog__title),
  .dlg__titles :global(.sx-dialog__subtitle) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .dlg__actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dlg__body--flush {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .dlg__footer {
    flex-shrink: 0;
  }
  @keyframes dlg-fade {
    from {
      opacity: 0;
    }
  }
  @keyframes dlg-pop {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dlg-scrim,
    .dlg {
      animation: none;
    }
  }
</style>
