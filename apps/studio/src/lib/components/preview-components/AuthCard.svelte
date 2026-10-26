<script lang="ts">
  interface Props {
    mode?: 'signin' | 'signup';
    brandName?: string;
    title?: string;
    subtitle?: string;
    redirectHref?: string;
    style?: string;
    onNavigate?: (href: string) => void;
  }

  let {
    mode = 'signin',
    brandName = 'Acme Cloud',
    title = 'Welcome back',
    subtitle = 'Sign in to access your workspace',
    redirectHref = '/dashboard',
    style = '',
    onNavigate
  }: Props = $props();

  let email = $state('');
  let password = $state('');
  let statusMsg = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    statusMsg = `Authenticated! Redirecting to ${redirectHref}...`;
    if (onNavigate && redirectHref.startsWith('/')) {
      setTimeout(() => onNavigate(redirectHref), 400);
    }
  }
</script>

<section class="md-section" style="min-height: 75vh; display: flex; align-items: center; justify-content: center; {style}">
  <div class="md-card md-card-outlined" style="width: 100%; max-width: 26rem; padding: 2.25rem;">
    <div style="text-align: center; margin-bottom: 1.75rem;">
      <span class="md-badge" style="margin-bottom: 0.75rem;">{brandName}</span>
      <h2 class="md-headline-small" style="margin: 0 0 0.5rem 0;">{title}</h2>
      {#if subtitle}
        <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">{subtitle}</p>
      {/if}
    </div>
    <form onsubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label for="auth-email" class="md-label-large" style="display: block; margin-bottom: 0.375rem;">Email</label>
        <input id="auth-email" type="email" required bind:value={email} placeholder="you@company.com" class="md-input" />
      </div>
      <div>
        <label for="auth-password" class="md-label-large" style="display: block; margin-bottom: 0.375rem;">Password</label>
        <input id="auth-password" type="password" required bind:value={password} placeholder="••••••••" class="md-input" />
      </div>
      <button type="submit" class="md-btn md-btn-filled" style="width: 100%; margin-top: 0.5rem;">
        {mode === 'signup' ? 'Create Account' : 'Sign In'}
      </button>
      {#if statusMsg}
        <p class="md-label-medium" style="text-align: center; color: var(--md-sys-color-primary); margin: 0.5rem 0 0 0;">
          {statusMsg}
        </p>
      {/if}
    </form>
  </div>
</section>
