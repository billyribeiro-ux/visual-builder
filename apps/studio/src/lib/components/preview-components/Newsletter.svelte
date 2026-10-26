<script lang="ts">
  interface Props {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    buttonText?: string;
    style?: string;
  }

  let {
    title = 'Subscribe to product updates',
    subtitle = '',
    placeholder = 'you@company.com',
    buttonText = 'Subscribe',
    style = ''
  }: Props = $props();

  let email = $state('');
  let subscribed = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!email.trim()) return;
    subscribed = true;
    email = '';
  }
</script>

<section class="md-section" style="padding: 3.5rem 0; {style}">
  <div class="md-container md-container-lg">
    <div class="md-card md-card-outlined" style="padding: 2.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2rem;">
      <div style="max-width: 30rem;">
        <h3 class="md-headline-small" style="margin: 0 0 0.5rem 0;">{title}</h3>
        {#if subtitle}
          <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">{subtitle}</p>
        {/if}
      </div>
      <form onsubmit={handleSubmit} style="display: flex; flex-wrap: wrap; gap: 0.75rem; flex: 1; min-width: 18rem; max-width: 26rem;">
        <input
          type="email"
          required
          placeholder={placeholder}
          bind:value={email}
          aria-label="Email address"
          class="md-input"
          style="flex: 1;"
        />
        <button type="submit" class="md-btn md-btn-filled">{buttonText}</button>
        {#if subscribed}
          <p class="md-label-medium" style="width: 100%; margin: 0; color: var(--md-sys-color-primary);">
            Thanks for subscribing! Check your inbox shortly.
          </p>
        {/if}
      </form>
    </div>
  </div>
</section>
