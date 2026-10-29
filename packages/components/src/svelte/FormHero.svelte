<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    benefits?: string[];
    formTitle?: string;
    formDescription?: string;
    nameLabel?: string;
    emailLabel?: string;
    submitText?: string;
    privacyText?: string;
    successTitle?: string;
    successMessage?: string;
    class?: string;
  }

  let {
    eyebrow = '',
    title = 'Grow faster with less busywork',
    subtitle = '',
    benefits = [],
    formTitle = 'Get started',
    formDescription = '',
    nameLabel = 'Full name',
    emailLabel = 'Work email',
    submitText = 'Get started',
    privacyText = '',
    successTitle = "You're all set",
    successMessage = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const fallbackId = $props.id();
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `lead-${nodeId}` : fallbackId;
  });

  const points = $derived((Array.isArray(benefits) ? benefits : []).map((b) => String(b)));

  let name = $state('');
  let email = $state('');
  let nameError = $state('');
  let emailError = $state('');
  let attempted = $state(false);
  let submitted = $state(false);
  let successEl: HTMLElement | undefined = $state();

  function validateName(): string {
    return name.trim() ? '' : `${nameLabel || 'Name'} is required.`;
  }

  function validateEmail(): string {
    const v = email.trim();
    if (!v) return `${emailLabel || 'Email'} is required.`;
    return EMAIL_RE.test(v) ? '' : 'Enter a valid email address, like name@company.com.';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    attempted = true;
    nameError = validateName();
    emailError = validateEmail();
    if (nameError || emailError) {
      await tick();
      document.getElementById(nameError ? `${uid}-name` : `${uid}-email`)?.focus();
      return;
    }
    // Prototype only: nothing is sent anywhere. The success state is local.
    submitted = true;
    await tick();
    successEl?.focus();
  }

  function reset() {
    name = '';
    email = '';
    nameError = '';
    emailError = '';
    attempted = false;
    submitted = false;
  }
</script>

<section {...rest} class={['form-hero', className]}>
  <div class="backdrop" aria-hidden="true"></div>
  <div class="md-container md-container--xl layout">
    <div class="copy">
      {#if eyebrow}
        <p class="eyebrow">
          <span class="eyebrow-dot" aria-hidden="true"></span>
          <span data-prop="eyebrow">{eyebrow}</span>
        </p>
      {/if}
      <h1 class="title" data-prop="title">{title}</h1>
      {#if subtitle}
        <p class="subtitle" data-prop="subtitle">{subtitle}</p>
      {/if}
      {#if points.length > 0}
        <ul class="benefits">
          {#each points as point, index (index)}
            <li class="benefit">
              <span class="benefit-icon"><Icon name="Check" size={14} /></span>
              <span data-prop={`benefits.${index}`}>{point}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="card">
      {#if submitted}
        <div class="success" role="status" tabindex="-1" bind:this={successEl}>
          <span class="success-icon"><Icon name="CheckCircle" size={26} /></span>
          <h2 class="success-title" data-prop="successTitle">{successTitle}</h2>
          {#if successMessage}
            <p class="success-message" data-prop="successMessage">{successMessage}</p>
          {/if}
          <p class="demo-note">
            <Icon name="Info" size={16} />
            <span>This form is not connected to a backend yet, so nothing was sent or stored.</span>
          </p>
          <button type="button" class="md-btn md-btn--md md-btn--outlined" onclick={reset}>Start over</button>
        </div>
      {:else}
        <div class="card-header">
          <h2 class="card-title" id="{uid}-title" data-prop="formTitle">{formTitle}</h2>
          {#if formDescription}
            <p class="card-description" data-prop="formDescription">{formDescription}</p>
          {/if}
        </div>
        <form class="form" aria-labelledby="{uid}-title" novalidate onsubmit={handleSubmit}>
          <div class="field">
            <label for="{uid}-name" class="label" data-prop="nameLabel">{nameLabel}</label>
            <input
              id="{uid}-name"
              class={['control', nameError && 'control--invalid']}
              type="text"
              name="name"
              autocomplete="name"
              required
              aria-invalid={nameError ? 'true' : undefined}
              aria-describedby={nameError ? `${uid}-name-error` : undefined}
              bind:value={name}
              oninput={() => attempted && (nameError = validateName())}
            />
            {#if nameError}
              <p class="error" id="{uid}-name-error"><Icon name="WarningCircle" size={14} /><span>{nameError}</span></p>
            {/if}
          </div>
          <div class="field">
            <label for="{uid}-email" class="label" data-prop="emailLabel">{emailLabel}</label>
            <input
              id="{uid}-email"
              class={['control', emailError && 'control--invalid']}
              type="email"
              name="email"
              autocomplete="email"
              inputmode="email"
              placeholder="name@company.com"
              required
              aria-invalid={emailError ? 'true' : undefined}
              aria-describedby={emailError ? `${uid}-email-error` : undefined}
              bind:value={email}
              oninput={() => attempted && (emailError = validateEmail())}
            />
            {#if emailError}
              <p class="error" id="{uid}-email-error"><Icon name="WarningCircle" size={14} /><span>{emailError}</span></p>
            {/if}
          </div>
          <button type="submit" class="md-btn md-btn--lg md-btn--filled md-btn--block submit">
            <span data-prop="submitText">{submitText}</span>
            <Icon name="ArrowRight" size={18} />
          </button>
          {#if privacyText}
            <p class="privacy" data-prop="privacyText">{privacyText}</p>
          {/if}
        </form>
      {/if}
    </div>
  </div>
</section>

<style>
  .form-hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding: 6rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .backdrop {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(ellipse 45% 55% at 80% 40%, color-mix(in srgb, var(--md-sys-color-primary) 13%, transparent), transparent 70%),
      radial-gradient(ellipse 35% 40% at 95% 90%, color-mix(in srgb, var(--md-sys-color-tertiary) 9%, transparent), transparent 70%);
  }
  .layout {
    display: grid;
    gap: 3rem;
    align-items: center;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 5rem;
    }
  }

  /* ---------------------------------------------------------------- copy */
  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent);
    color: var(--md-sys-color-primary);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.25rem;
  }
  .eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: currentColor;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
  }
  .title {
    font-size: clamp(2.25rem, 1.5rem + 2.6vw, 3.75rem);
    line-height: 1.06;
    font-weight: 700;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  .subtitle {
    max-width: 34rem;
    margin-top: 1.25rem;
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .benefits {
    display: grid;
    gap: 0.875rem;
    margin-top: 2rem;
    list-style: none;
  }
  .benefit {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 1rem;
    line-height: 1.5rem;
    font-weight: 500;
  }
  .benefit-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    margin-top: 0.0625rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  /* ---------------------------------------------------------------- card */
  .card {
    width: 100%;
    max-width: 28rem;
    justify-self: end;
    padding: 2rem;
    border-radius: 20px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 24px 56px -24px rgba(0, 0, 0, 0.22);
  }
  .card-header {
    margin-bottom: 1.5rem;
  }
  .card-title {
    font-size: 1.375rem;
    line-height: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .card-description {
    margin-top: 0.375rem;
    font-size: 0.9375rem;
    line-height: 1.5rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
  }
  .control {
    width: 100%;
    min-height: 46px;
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
  .submit {
    margin-top: 0.5rem;
    font-weight: 600;
  }
  .privacy {
    font-size: 0.8125rem;
    line-height: 1.25rem;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
  }

  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 0;
    text-align: center;
    outline: none;
  }
  .success-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
  }
  .success-title {
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .success-message {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .demo-note {
    display: inline-flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin: 0.25rem 0 0.5rem;
    padding: 0.625rem 0.875rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container);
    font-size: 0.8125rem;
    line-height: 1.25rem;
    text-align: left;
    color: var(--md-sys-color-on-surface-variant);
  }
  .demo-note :global(.icon) {
    margin-top: 0.125rem;
  }

  @media (max-width: 1023px) {
    .card {
      justify-self: stretch;
      max-width: 36rem;
    }
  }
  @media (max-width: 767px) {
    .form-hero {
      padding: 4rem 0;
    }
    .card {
      padding: 1.5rem 1.25rem;
    }
    .subtitle {
      font-size: 1.0625rem;
    }
  }
</style>
