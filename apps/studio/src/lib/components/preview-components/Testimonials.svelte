<script lang="ts">
  import Container from './Container.svelte';

  interface Testimonial {
    quote: string;
    author: string;
    role: string;
    /** Legacy field (not in the registry); rendered only when present. */
    company?: string;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    testimonials?: Testimonial[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Customer Success',
    sectionTitle = 'Loved by Modern Engineering Teams',
    testimonials = [],
    style = ''
  }: Props = $props();
</script>

<section style="padding: 5rem 0; background-color: var(--md-sys-color-surface); {style}">
  <Container maxWidth="xl">
    <div style="text-align: center; max-width: 680px; margin: 0 auto 3.5rem auto;">
      {#if sectionEyebrow}
        <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">
          {sectionEyebrow}
        </div>
      {/if}
      <h2 style="font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em;">{sectionTitle}</h2>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
      {#each testimonials as item, idx (idx)}
        <div class="md-card md-card--elevated" style="display: flex; flex-direction: column; justify-content: space-between;">
          <p style="font-size: 1rem; line-height: 1.6; font-style: italic; margin-bottom: 1.5rem; color: var(--md-sys-color-on-surface);">
            "{item.quote}"
          </p>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 40px; height: 40px; border-radius: var(--md-sys-shape-corner-full, 9999px); background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); display: flex; align-items: center; justify-content: center; font-weight: 700;">
              {(item.author || '?').charAt(0)}
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.875rem;">{item.author}</div>
              <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">{[item.role, item.company].filter(Boolean).join(', ')}</div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </Container>
</section>
