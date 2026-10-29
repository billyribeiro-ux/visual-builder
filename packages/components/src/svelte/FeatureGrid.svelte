<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface FeatureItem {
    icon?: string;
    title: string;
    description: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    columns?: number;
    features?: FeatureItem[];
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Platform capabilities',
    sectionDescription = '',
    columns = 3,
    features = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const cols = $derived(Math.min(4, Math.max(1, Math.round(Number(columns) || 3))));
</script>

<section {...rest} class={['features', className]}>
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

    <div class={['cols', `cols-${cols}`]}>
      {#each features as feature, index (index)}
        <article class="card">
          <span class="md-icon-tile icon"><Icon name={feature.icon || 'Sparkle'} size={20} /></span>
          <h3 class="card-title" data-prop={`features.${index}.title`}>{feature.title}</h3>
          <p class="card-description" data-prop={`features.${index}.description`}>{feature.description}</p>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .features {
    padding: var(--md-sys-section-space, 6rem) 0;
    background-color: var(--md-sys-color-surface-container-low);
    border-top: 1px solid var(--md-sys-color-outline-variant);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  @media (min-width: 768px) {
    .cols {
      gap: 1.25rem;
    }
    .cols-2,
    .cols-3,
    .cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .cols {
      gap: 1.5rem;
    }
    .cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1.75rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1);
    transition:
      transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-emphasized, ease),
      box-shadow var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-emphasized, ease),
      border-color var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-emphasized, ease);
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: var(--md-sys-color-outline);
    box-shadow: var(--md-sys-elevation-level3);
  }
  .icon {
    margin-bottom: 1.25rem;
  }
  .card-title {
    font-size: 1.0625rem;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    color: var(--md-sys-color-on-surface);
    margin-bottom: 0.5rem;
  }
  .card-description {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  @media (prefers-reduced-motion: reduce) {
    .card:hover {
      transform: none;
    }
  }
</style>
