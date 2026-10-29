<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionSubtitle?: string;
    submitText?: string;
    class?: string;
  }

  let {
    sectionEyebrow = 'Contact',
    sectionTitle = 'Get in touch',
    sectionSubtitle = '',
    submitText = 'Send message',
    class: className = '',
    ...rest
  }: Props = $props();

  /** Unique per instance so several forms on one page keep valid label/input pairs. */
  const uid = $props.id();
  let fullName = $state('');
  let email = $state('');
  let message = $state('');
  let sent = $state(false);
  let sentTimer: ReturnType<typeof setTimeout> | undefined;

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    sent = true;
    clearTimeout(sentTimer);
    sentTimer = setTimeout(() => (sent = false), 4000);
  }

  onDestroy(() => clearTimeout(sentTimer));
</script>

<section {...rest} class={['contact', className]}>
  <div class="md-container md-container--xl">
    <div class="layout">
      <div class="header">
        {#if sectionEyebrow}
          <p class="md-eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
        {/if}
        <h2 class="md-section-title title" id="{uid}-title" data-prop="sectionTitle">{sectionTitle}</h2>
        {#if sectionSubtitle}
          <p class="subtitle" data-prop="sectionSubtitle">{sectionSubtitle}</p>
        {/if}
      </div>

      <form class="form" aria-labelledby="{uid}-title" onsubmit={handleSubmit}>
        <div class="row">
          <div class="md-field">
            <label for="{uid}-name" class="md-field-label">Full name</label>
            <input id="{uid}-name" type="text" required autocomplete="name" bind:value={fullName} placeholder="Jordan Lee" class="md-input" />
          </div>
          <div class="md-field">
            <label for="{uid}-email" class="md-field-label">Work email</label>
            <input id="{uid}-email" type="email" required autocomplete="email" bind:value={email} placeholder="jordan@company.com" class="md-input" />
          </div>
        </div>
        <div class="md-field">
          <label for="{uid}-message" class="md-field-label">Message</label>
          <textarea id="{uid}-message" rows={5} required bind:value={message} placeholder="Tell us about your team and what you need." class="md-input"></textarea>
        </div>
        <div class="submit-row">
          <button type="submit" class="md-btn md-btn--md md-btn--filled submit">
            <span data-prop="submitText">{submitText}</span>
            <Icon name="PaperPlaneTilt" size={16} />
          </button>
          <p class="confirmation" role="status">
            {#if sent}
              <Icon name="CheckCircle" size={16} />
              Message received. We will reply within one business day.
            {/if}
          </p>
        </div>
      </form>
    </div>
  </div>
</section>

<style>
  .contact {
    width: 100%;
    padding: var(--md-sys-section-space, 6rem) 0;
    background-color: var(--md-sys-color-surface);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
    max-width: 40rem;
    margin: 0 auto;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: 4rem;
      max-width: none;
      align-items: start;
    }
  }
  .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
  }
  @media (min-width: 1024px) {
    .header {
      padding-top: 1rem;
    }
  }
  .subtitle {
    max-width: 30rem;
    font-size: var(--md-sys-font-size-lead, 1.125rem);
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
    padding: clamp(1.5rem, 1rem + 1.5vw, 2rem);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level3);
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }
  @media (min-width: 640px) {
    .row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .submit-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
    padding-top: 0.25rem;
  }
  .confirmation {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-success);
  }
  .confirmation:empty {
    display: none;
  }
  @media (max-width: 479px) {
    .submit {
      width: 100%;
    }
  }
</style>
