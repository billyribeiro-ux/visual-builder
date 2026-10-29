<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    buttonText?: string;
    /** Small muted line under the form (privacy note, frequency…). */
    note?: string;
    class?: string;
  }

  let {
    title = 'Subscribe to product updates',
    subtitle = '',
    placeholder = 'you@company.com',
    buttonText = 'Subscribe',
    note = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  let email = $state('');
  let subscribed = $state(false);

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    subscribed = true;
    email = '';
  }
</script>

<section {...rest} class={['newsletter', className]}>
  <div class="md-container md-container--xl">
    <div class="card">
      <div class="copy">
        <span class="md-icon-tile md-icon-tile--lg icon" aria-hidden="true"><Icon name="EnvelopeSimple" size={22} /></span>
        <div class="copy-text">
          <h2 class="title" id="{uid}-title" data-prop="title">{title}</h2>
          {#if subtitle}
            <p class="subtitle" data-prop="subtitle">{subtitle}</p>
          {/if}
        </div>
      </div>
      <div class="form-col">
        <form class="form" aria-labelledby="{uid}-title" onsubmit={handleSubmit}>
          <label class="md-visually-hidden" for="{uid}-email">Email address</label>
          <input id="{uid}-email" type="email" required autocomplete="email" {placeholder} bind:value={email} class="md-input input" />
          <button type="submit" class="md-btn md-btn--md md-btn--filled submit" data-prop="buttonText">{buttonText}</button>
        </form>
        {#if subscribed}
          <p class="confirmation" role="status">
            <Icon name="CheckCircle" size={16} />
            Thanks for subscribing. Check your inbox to confirm.
          </p>
        {:else if note}
          <p class="note" data-prop="note">{note}</p>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .newsletter {
    width: 100%;
    padding: 4rem 0;
    background-color: var(--md-sys-color-surface);
  }
  .card {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
    align-items: center;
    padding: clamp(1.75rem, 1rem + 2.5vw, 3rem);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-large, 20px);
    background:
      radial-gradient(70% 120% at 0% 0%, color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent), transparent 65%),
      var(--md-sys-color-surface-container-low);
  }
  @media (min-width: 1024px) {
    .card {
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 3rem;
    }
  }
  .copy {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    min-width: 0;
  }
  .copy-text {
    min-width: 0;
  }
  .title {
    font-size: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
    line-height: 1.3;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-tight, -0.022em);
    color: var(--md-sys-color-on-surface);
  }
  .subtitle {
    margin-top: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .form-col {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .input {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
  }
  .submit {
    width: 100%;
  }
  @media (min-width: 640px) {
    .form {
      flex-direction: row;
    }
    .input {
      width: auto;
    }
    .submit {
      width: auto;
      flex-shrink: 0;
    }
  }
  .note {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
  .confirmation {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-success);
  }
  @media (max-width: 479px) {
    .icon {
      display: none;
    }
  }
</style>
