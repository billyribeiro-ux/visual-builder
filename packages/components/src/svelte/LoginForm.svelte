<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';
  import { requestNavigation } from './lib/navigation.js';

  type Provider = 'google' | 'github' | 'apple' | 'microsoft';

  interface SocialProvider {
    provider?: Provider;
    label?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    subtitle?: string;
    socialProviders?: SocialProvider[];
    dividerText?: string;
    emailLabel?: string;
    passwordLabel?: string;
    rememberText?: string;
    forgotText?: string;
    forgotHref?: string;
    submitText?: string;
    footerText?: string;
    signupText?: string;
    signupHref?: string;
    redirectHref?: string;
    class?: string;
  }

  let {
    title = 'Welcome back',
    subtitle = '',
    socialProviders = [],
    dividerText = 'or',
    emailLabel = 'Email',
    passwordLabel = 'Password',
    rememberText = 'Remember me',
    forgotText = 'Forgot password?',
    forgotHref = '/forgot-password',
    submitText = 'Sign in',
    footerText = '',
    signupText = '',
    signupHref = '/signup',
    redirectHref = '/dashboard',
    class: className = '',
    ...rest
  }: Props = $props();

  const PROVIDER_ICONS: Record<Provider, string> = {
    google: 'GoogleLogo',
    github: 'GithubLogo',
    apple: 'AppleLogo',
    microsoft: 'WindowsLogo'
  };
  const PROVIDER_NAMES: Record<Provider, string> = {
    google: 'Google',
    github: 'GitHub',
    apple: 'Apple',
    microsoft: 'Microsoft'
  };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const fallbackId = $props.id();
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `login-${nodeId}` : fallbackId;
  });

  const providers = $derived(
    (Array.isArray(socialProviders) ? socialProviders : [])
      .filter((p) => p && typeof p.provider === 'string' && p.provider in PROVIDER_ICONS)
      .map((p, index) => {
        const provider = p.provider as Provider;
        return { index, provider, label: String(p.label ?? '').trim() || `Continue with ${PROVIDER_NAMES[provider]}` };
      })
  );

  let email = $state('');
  let password = $state('');
  let remember = $state(false);
  let showPassword = $state(false);
  let emailError = $state('');
  let passwordError = $state('');
  let attempted = $state(false);
  let status = $state('');
  let redirectTimer: ReturnType<typeof setTimeout> | undefined;

  function validateEmail(): string {
    const v = email.trim();
    if (!v) return `${emailLabel || 'Email'} is required.`;
    return EMAIL_RE.test(v) ? '' : 'Enter a valid email address, like name@company.com.';
  }

  function validatePassword(): string {
    return password ? '' : `${passwordLabel || 'Password'} is required.`;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    attempted = true;
    emailError = validateEmail();
    passwordError = validatePassword();
    if (emailError || passwordError) {
      status = '';
      await tick();
      document.getElementById(emailError ? `${uid}-email` : `${uid}-password`)?.focus();
      return;
    }
    // Prototype only: the credentials are validated for shape, never checked against an account.
    status = 'Demo sign-in only: no account was checked. Redirecting…';
    clearTimeout(redirectTimer);
    redirectTimer = setTimeout(() => requestNavigation(form, redirectHref), 900);
  }

  function socialSignIn(name: string) {
    status = `${name} sign-in is not connected in this prototype.`;
  }

  onDestroy(() => clearTimeout(redirectTimer));
</script>

<section {...rest} class={['login', className]}>
  <div class="card">
    <div class="header">
      <h2 class="title" data-prop="title">{title}</h2>
      {#if subtitle}
        <p class="subtitle" data-prop="subtitle">{subtitle}</p>
      {/if}
    </div>

    {#if providers.length > 0}
      <div class="social">
        {#each providers as p (p.index)}
          <button type="button" class="social-button" onclick={() => socialSignIn(PROVIDER_NAMES[p.provider])}>
            <Icon name={PROVIDER_ICONS[p.provider]} size={18} />
            <span data-prop={`socialProviders.${p.index}.label`}>{p.label}</span>
          </button>
        {/each}
      </div>
      <div class="divider" role="separator" aria-label={dividerText || undefined}>
        <span data-prop="dividerText">{dividerText}</span>
      </div>
    {/if}

    <form class="form" novalidate onsubmit={handleSubmit}>
      <div class="field">
        <label for="{uid}-email" class="label" data-prop="emailLabel">{emailLabel}</label>
        <input
          id="{uid}-email"
          class={['control', emailError && 'control--invalid']}
          type="email"
          name="email"
          autocomplete="email"
          inputmode="email"
          required
          placeholder="name@company.com"
          aria-invalid={emailError ? 'true' : undefined}
          aria-describedby={emailError ? `${uid}-email-error` : undefined}
          bind:value={email}
          oninput={() => attempted && (emailError = validateEmail())}
        />
        {#if emailError}
          <p class="error" id="{uid}-email-error"><Icon name="WarningCircle" size={14} /><span>{emailError}</span></p>
        {/if}
      </div>

      <div class="field">
        <div class="label-row">
          <label for="{uid}-password" class="label" data-prop="passwordLabel">{passwordLabel}</label>
          {#if forgotText}
            <a href={safeHref(forgotHref)} class="text-link" data-prop="forgotText">{forgotText}</a>
          {/if}
        </div>
        <div class="password-wrap">
          <input
            id="{uid}-password"
            class={['control', 'control--password', passwordError && 'control--invalid']}
            type={showPassword ? 'text' : 'password'}
            name="password"
            autocomplete="current-password"
            required
            aria-invalid={passwordError ? 'true' : undefined}
            aria-describedby={passwordError ? `${uid}-password-error` : undefined}
            bind:value={password}
            oninput={() => attempted && (passwordError = validatePassword())}
          />
          <button
            type="button"
            class="reveal"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            aria-controls="{uid}-password"
            onclick={() => (showPassword = !showPassword)}
          >
            <Icon name={showPassword ? 'EyeSlash' : 'Eye'} size={18} />
          </button>
        </div>
        {#if passwordError}
          <p class="error" id="{uid}-password-error"><Icon name="WarningCircle" size={14} /><span>{passwordError}</span></p>
        {/if}
      </div>

      {#if rememberText}
        <label class="remember">
          <input type="checkbox" name="remember" class="check" bind:checked={remember} />
          <span data-prop="rememberText">{rememberText}</span>
        </label>
      {/if}

      <button type="submit" class="md-btn md-btn--lg md-btn--filled md-btn--block submit">
        <span data-prop="submitText">{submitText}</span>
      </button>
    </form>

    <p class={['status', status && 'status--visible']} role="status">{status}</p>

    {#if footerText || signupText}
      <p class="footer">
        <span data-prop="footerText">{footerText}</span>
        {#if signupText}
          <a href={safeHref(signupHref)} class="text-link" data-prop="signupText">{signupText}</a>
        {/if}
      </p>
    {/if}
  </div>
</section>

<style>
  .login {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 4rem 1.5rem;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .card {
    width: 100%;
    max-width: 25rem;
    padding: 2.25rem 2rem 2rem;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 16px 40px -16px rgba(0, 0, 0, 0.14);
  }
  .header {
    text-align: center;
    margin-bottom: 1.75rem;
  }
  .title {
    font-size: 1.625rem;
    line-height: 2rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }
  .subtitle {
    margin-top: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.5rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  .social {
    display: grid;
    gap: 0.625rem;
  }
  .social-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    width: 100%;
    min-height: 44px;
    padding: 0 1rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 35%, var(--md-sys-color-outline-variant));
    background-color: var(--md-sys-color-surface-container-lowest);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition:
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .social-button:hover {
    background-color: var(--md-sys-color-surface-container-low);
    border-color: var(--md-sys-color-outline);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    margin: 1.5rem 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--md-sys-color-outline-variant);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
  }
  .text-link {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
    text-underline-offset: 3px;
  }
  .text-link:hover {
    text-decoration: underline;
  }
  .control {
    width: 100%;
    min-height: 44px;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 45%, var(--md-sys-color-outline-variant));
    border-radius: var(--md-sys-shape-corner-small, 8px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    outline: none;
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .control::placeholder {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 75%, transparent);
  }
  .control:focus {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  }
  .control--invalid {
    border-color: var(--md-sys-color-error);
  }
  .control--invalid:focus {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-error) 18%, transparent);
  }
  .password-wrap {
    position: relative;
  }
  .control--password {
    padding-right: 3rem;
  }
  .reveal {
    position: absolute;
    top: 50%;
    right: 0.25rem;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
  }
  .reveal:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .error {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    font-size: 0.8125rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: var(--md-sys-color-error);
  }
  .error :global(.icon) {
    margin-top: 0.1875rem;
  }
  .remember {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    min-height: 32px;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
  }
  .check {
    width: 18px;
    height: 18px;
    accent-color: var(--md-sys-color-primary);
    cursor: pointer;
  }
  .submit {
    margin-top: 0.25rem;
    font-weight: 600;
  }
  .status {
    font-size: 0.8125rem;
    line-height: 1.25rem;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
  }
  .status--visible {
    margin-top: 1rem;
    padding: 0.625rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container);
  }
  .footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.375rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--md-sys-color-surface-variant);
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  @media (max-width: 767px) {
    .login {
      padding: 2.5rem 1rem;
    }
    .card {
      padding: 1.75rem 1.25rem 1.5rem;
    }
  }
</style>
