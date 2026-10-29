<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { requestNavigation } from './lib/navigation.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    mode?: 'signin' | 'signup';
    brandName?: string;
    title?: string;
    subtitle?: string;
    redirectHref?: string;
    class?: string;
  }

  let {
    mode = 'signin',
    brandName = 'Halden',
    title = 'Welcome back',
    subtitle = '',
    redirectHref = '/dashboard',
    class: className = '',
    ...rest
  }: Props = $props();

  /** Unique per instance so several forms on one page keep valid label/input pairs. */
  const uid = $props.id();

  // Writable derived: follows the `mode` prop, toggled locally by the switch link.
  let currentMode = $derived(mode);
  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let statusMessage = $state('');
  let redirectTimer: ReturnType<typeof setTimeout> | undefined;

  const isSignUp = $derived(currentMode === 'signup');
  const brandInitial = $derived(brandName.trim().charAt(0).toUpperCase() || 'A');

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    statusMessage = isSignUp ? 'Account created. Redirecting…' : 'Signed in. Redirecting…';
    clearTimeout(redirectTimer);
    redirectTimer = setTimeout(() => requestNavigation(form, redirectHref), 400);
  }

  onDestroy(() => clearTimeout(redirectTimer));
</script>

<section {...rest} class={['auth', className]}>
  <div class="glow" aria-hidden="true"></div>
  <div class="card">
    <div class="header">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">{brandInitial}</span>
        <span class="brand-name" data-prop="brandName">{brandName}</span>
      </div>
      <h2 class="title" data-prop="title">{title}</h2>
      {#if subtitle}
        <p class="subtitle" data-prop="subtitle">{subtitle}</p>
      {/if}
    </div>
    <form class="form" onsubmit={handleSubmit}>
      {#if isSignUp}
        <div class="md-field">
          <label for="{uid}-name" class="md-field-label">Full name</label>
          <input id="{uid}-name" type="text" required autocomplete="name" bind:value={fullName} placeholder="Jordan Lee" class="md-input" />
        </div>
      {/if}
      <div class="md-field">
        <label for="{uid}-email" class="md-field-label">Work email</label>
        <input id="{uid}-email" type="email" required autocomplete="email" bind:value={email} placeholder="you@company.com" class="md-input" />
      </div>
      <div class="md-field">
        <label for="{uid}-password" class="md-field-label">Password</label>
        <input
          id="{uid}-password"
          type="password"
          required
          autocomplete={isSignUp ? 'new-password' : 'current-password'}
          bind:value={password}
          placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
          class="md-input"
        />
      </div>
      <button type="submit" class="md-btn md-btn--md md-btn--filled md-btn--block submit">
        {isSignUp ? 'Create account' : 'Sign in'}
      </button>
      {#if statusMessage}
        <p class="status" role="status">
          <Icon name="CheckCircle" size={16} />
          {statusMessage}
        </p>
      {/if}
    </form>
    <p class="switch">
      {isSignUp ? 'Already have an account?' : 'New here?'}
      <button type="button" class="switch-button" onclick={() => (currentMode = isSignUp ? 'signin' : 'signup')}>
        {isSignUp ? 'Sign in' : 'Create an account'}
      </button>
    </p>
  </div>
</section>

<style>
  .auth {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 75vh;
    padding: 4rem var(--md-sys-container-padding, 1.25rem);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .glow {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(42rem 26rem at 50% -6%, color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent), transparent 70%),
      radial-gradient(30rem 20rem at 85% 110%, color-mix(in srgb, var(--md-sys-color-tertiary) 7%, transparent), transparent 70%);
  }
  .card {
    width: 100%;
    max-width: 26rem;
    padding: 2.5rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-large, 20px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level4);
    color: var(--md-sys-color-on-surface);
  }
  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.75rem;
    text-align: center;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 60%),
      var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.08),
      0 1px 2px rgba(15, 23, 42, 0.16);
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1;
  }
  .brand-name {
    font-family: var(--md-sys-font-heading);
    font-size: 1.0625rem;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
  }
  .title {
    font-family: var(--md-sys-font-heading);
    font-size: 1.5rem;
    line-height: 1.25;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-tight, -0.022em);
  }
  .subtitle {
    margin-top: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--md-sys-color-on-surface-variant);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
  }
  .submit {
    margin-top: 0.375rem;
  }
  .status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-success);
  }
  .switch {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    text-align: center;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .switch-button {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 0.25rem;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    color: var(--md-sys-color-primary);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    text-underline-offset: 3px;
  }
  .switch-button:hover {
    text-decoration-color: currentColor;
  }
  @media (max-width: 479px) {
    .auth {
      padding-top: 2.5rem;
      padding-bottom: 2.5rem;
    }
    .card {
      padding: 1.75rem 1.5rem;
    }
  }
</style>
