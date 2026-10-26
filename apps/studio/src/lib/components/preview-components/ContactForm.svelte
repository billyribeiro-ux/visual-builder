<script lang="ts">
  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionSubtitle?: string;
    submitText?: string;
    style?: string;
  }

  let {
    sectionEyebrow = 'CONTACT US',
    sectionTitle = 'Get in touch with our team',
    sectionSubtitle = '',
    submitText = 'Send Message',
    style = ''
  }: Props = $props();

  let fullName = $state('');
  let email = $state('');
  let message = $state('');
  let sent = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    sent = true;
    setTimeout(() => (sent = false), 4000);
  }
</script>

<section class="md-section" style={style}>
  <div class="md-container md-container-md">
    <div style="text-align: center; margin-bottom: 2.5rem;">
      {#if sectionEyebrow}
        <p class="md-label-large" style="color: var(--md-sys-color-primary); margin: 0 0 0.5rem 0;">{sectionEyebrow}</p>
      {/if}
      <h2 class="md-headline-large" style="margin: 0 0 0.75rem 0;">{sectionTitle}</h2>
      {#if sectionSubtitle}
        <p class="md-body-large" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">{sectionSubtitle}</p>
      {/if}
    </div>
    <form onsubmit={handleSubmit} class="md-card md-card-outlined" style="padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
      <div>
        <label for="contact-name" class="md-label-large" style="display: block; margin-bottom: 0.5rem;">Full Name</label>
        <input id="contact-name" type="text" required bind:value={fullName} placeholder="Jane Doe" class="md-input" />
      </div>
      <div>
        <label for="contact-email" class="md-label-large" style="display: block; margin-bottom: 0.5rem;">Work Email</label>
        <input id="contact-email" type="email" required bind:value={email} placeholder="jane@company.com" class="md-input" />
      </div>
      <div>
        <label for="contact-message" class="md-label-large" style="display: block; margin-bottom: 0.5rem;">Message</label>
        <textarea id="contact-message" rows={4} required bind:value={message} placeholder="How can we help?" class="md-input"></textarea>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <button type="submit" class="md-btn md-btn-filled">{submitText}</button>
        {#if sent}
          <span class="md-label-large" style="color: var(--md-sys-color-primary);">Message received! We'll reply shortly.</span>
        {/if}
      </div>
    </form>
  </div>
</section>
