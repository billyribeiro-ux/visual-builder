<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    description?: string;
    initialName?: string;
    initialEmail?: string;
    notificationsEnabled?: boolean;
    class?: string;
  }

  let {
    title = 'Workspace preferences',
    description = '',
    initialName = '',
    initialEmail = '',
    notificationsEnabled = true,
    class: className = '',
    ...rest
  }: Props = $props();

  /** Unique per instance so several forms on one page keep valid label/input pairs. */
  const uid = $props.id();

  // Writable deriveds: initialised from props, re-initialised whenever the props change.
  let name = $derived(initialName);
  let email = $derived(initialEmail);
  let notifications = $derived(notificationsEnabled);

  let saved = $state(false);
  let savedTimer: ReturnType<typeof setTimeout> | undefined;

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    saved = true;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (saved = false), 3000);
  }

  function reset() {
    name = initialName;
    email = initialEmail;
    notifications = notificationsEnabled;
    saved = false;
    clearTimeout(savedTimer);
  }

  onDestroy(() => clearTimeout(savedTimer));
</script>

<div {...rest} class={['settings', className]}>
  <div class="header">
    <h2 class="title" data-prop="title">{title}</h2>
    {#if description}
      <p class="description" data-prop="description">{description}</p>
    {/if}
  </div>

  <form onsubmit={handleSubmit}>
    <div class="body">
      <div class="row">
        <div class="row-copy">
          <label for="{uid}-name" class="row-label">Display name</label>
          <p class="row-hint">Shown in the sidebar, emails and shared dashboards.</p>
        </div>
        <div class="row-control">
          <input id="{uid}-name" type="text" required autocomplete="organization" bind:value={name} class="md-input" />
        </div>
      </div>

      <div class="row">
        <div class="row-copy">
          <label for="{uid}-email" class="row-label">Notification email</label>
          <p class="row-hint" id="{uid}-email-hint">Alerts and the weekly digest are sent here.</p>
        </div>
        <div class="row-control">
          <input
            id="{uid}-email"
            type="email"
            autocomplete="email"
            aria-describedby="{uid}-email-hint"
            bind:value={email}
            class="md-input"
          />
        </div>
      </div>

      <div class="row row--switch">
        <div class="row-copy">
          <span class="row-label" id="{uid}-notifications-label">Email digest and alerts</span>
          <p class="row-hint" id="{uid}-notifications-hint">A weekly summary plus an email whenever an alert fires.</p>
        </div>
        <div class="row-control row-control--end">
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            aria-labelledby="{uid}-notifications-label"
            aria-describedby="{uid}-notifications-hint"
            class={['switch', notifications && 'switch--on']}
            onclick={() => (notifications = !notifications)}
          >
            <span class="switch-thumb"></span>
          </button>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="status-slot">
        {#if saved}
          <p class="success" role="status">
            <Icon name="CheckCircle" size={16} />
            Preferences saved
          </p>
        {/if}
      </div>
      <div class="actions">
        <button type="button" class="md-btn md-btn--sm md-btn--outlined" onclick={reset}>Reset</button>
        <button type="submit" class="md-btn md-btn--sm md-btn--filled">Save changes</button>
      </div>
    </div>
  </form>
</div>

<style>
  .settings {
    width: 100%;
    max-width: 48rem;
    overflow: hidden;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1);
    color: var(--md-sys-color-on-surface);
  }
  .header {
    padding: 1.375rem 1.5rem 1.25rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .title {
    font-family: var(--md-sys-font-heading);
    font-size: 1.125rem;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
  }
  .description {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
  .body {
    padding: 0 1.5rem;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.75rem;
    padding: 1.25rem 0;
  }
  .row + .row {
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .row--switch {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }
  .row-copy {
    min-width: 0;
  }
  .row-label {
    display: block;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 550;
    color: var(--md-sys-color-on-surface);
  }
  .row-hint {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
    line-height: 1.25rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .row-control {
    min-width: 0;
  }
  .row-control--end {
    display: flex;
    justify-content: flex-end;
  }
  @media (min-width: 640px) {
    .row {
      grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
      gap: 1.5rem;
      align-items: center;
    }
    .row--switch {
      grid-template-columns: minmax(0, 1fr) auto;
    }
  }

  /* 44×24 switch inside a 44px-tall hit area */
  .switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    width: 44px;
    height: 24px;
    padding: 2px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-highest);
    box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-strong, var(--md-sys-color-outline));
    transition:
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .switch::before {
    content: '';
    position: absolute;
    inset: -10px -2px;
  }
  .switch-thumb {
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.2),
      0 0 0 1px rgba(15, 23, 42, 0.06);
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .switch--on {
    background-color: var(--md-sys-color-primary);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-primary) 80%, #000000);
  }
  .switch--on .switch-thumb {
    transform: translateX(20px);
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .status-slot {
    min-width: 0;
  }
  .success {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    height: 1.75rem;
    padding: 0 0.625rem;
    border-radius: 9999px;
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
    font-size: 0.8125rem;
    font-weight: 550;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }
  @media (max-width: 479px) {
    .header,
    .body,
    .footer {
      padding-left: 1.125rem;
      padding-right: 1.125rem;
    }
    .actions {
      width: 100%;
    }
    .actions .md-btn {
      flex: 1;
    }
  }
</style>
