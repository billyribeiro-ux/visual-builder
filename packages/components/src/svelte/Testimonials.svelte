<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Testimonial {
    quote: string;
    author: string;
    role: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    /** Adds a decorative five-star row above each quote. */
    showRating?: boolean;
    testimonials?: Testimonial[];
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Trusted by software teams',
    sectionDescription = '',
    showRating = false,
    testimonials = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const STARS = [0, 1, 2, 3, 4];

  /** First letters of the first two words of a name ("Priya Raman" → "PR"). */
  function initials(name: string): string {
    const letters = (name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('');
    return letters || '?';
  }
</script>

<section {...rest} class={['testimonials', className]}>
  <div class="md-container md-container--xl">
    <div class="md-section-header">
      {#if sectionEyebrow}
        <p class="md-eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
      {/if}
      <h2 class="md-section-title" data-prop="sectionTitle">{sectionTitle}</h2>
      {#if sectionDescription}
        <p class="md-section-description" data-prop="sectionDescription">{sectionDescription}</p>
      {/if}
    </div>

    <div class="grid">
      {#each testimonials as item, index (index)}
        <figure class="card">
          <div class="top">
            <div class="top-row">
              <span class="mark" aria-hidden="true"><Icon name="Quotes" size={18} /></span>
              {#if showRating}
                <div class="stars" role="img" aria-label="Rated 5 out of 5">
                  {#each STARS as star (star)}
                    <span class="star"></span>
                  {/each}
                </div>
              {/if}
            </div>
            <blockquote class="quote">
              <p data-prop={`testimonials.${index}.quote`}>{item.quote}</p>
            </blockquote>
          </div>
          <figcaption class="author">
            <span class="md-avatar avatar" aria-hidden="true">{initials(item.author)}</span>
            <span class="author-text">
              <span class="author-name" data-prop={`testimonials.${index}.author`}>{item.author}</span>
              {#if item.role}
                <span class="author-role" data-prop={`testimonials.${index}.role`}>{item.role}</span>
              {/if}
            </span>
          </figcaption>
        </figure>
      {/each}
    </div>
  </div>
</section>

<style>
  .testimonials {
    padding: var(--md-sys-section-space, 6rem) 0;
    background-color: var(--md-sys-color-surface);
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .card:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
  }
  .card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.75rem;
    min-width: 0;
    padding: 1.75rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level2);
  }
  .top {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--md-sys-shape-corner-medium, 10px);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
  }
  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .stars {
    display: flex;
    gap: 0.1875rem;
  }
  /* Solid star drawn as a CSS shape (decorative; the row carries the accessible label). */
  .star {
    width: 1rem;
    height: 1rem;
    background-color: var(--md-sys-color-primary);
    clip-path: polygon(50% 2%, 61.8% 35.4%, 97.6% 35.4%, 68.9% 57%, 79.4% 91%, 50% 70.6%, 20.6% 91%, 31.1% 57%, 2.4% 35.4%, 38.2% 35.4%);
  }
  .quote {
    font-size: 1.0625rem;
    line-height: 1.65;
    font-weight: 450;
    letter-spacing: -0.006em;
    color: var(--md-sys-color-on-surface);
  }
  .author {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .author-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .author-name {
    font-size: 0.9375rem;
    line-height: 1.4;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .author-role {
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
