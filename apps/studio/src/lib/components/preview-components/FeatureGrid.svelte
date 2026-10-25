<script lang="ts">
  import Container from './Container.svelte';

  interface FeatureItem {
    icon?: string;
    title: string;
    description: string;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    columns?: 2 | 3 | 4;
    features?: FeatureItem[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Core Capabilities',
    sectionTitle = 'Engineered for Performance and Developer Ergonomics',
    sectionDescription = 'Everything you need to craft scalable, accessible, reactive web applications with Svelte 5 runes.',
    columns = 3,
    features = [],
    style = ''
  }: Props = $props();
</script>

<section class="md-feature-grid" {style}>
  <Container maxWidth="xl">
    <div class="md-feature-grid__header">
      {#if sectionEyebrow}
        <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">
          {sectionEyebrow}
        </div>
      {/if}
      <h2 style="font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem;">{sectionTitle}</h2>
      {#if sectionDescription}
        <p style="color: var(--md-sys-color-on-surface-variant); font-size: 1rem;">{sectionDescription}</p>
      {/if}
    </div>

    <div class="md-feature-grid__cols md-feature-grid__cols--{columns}">
      {#each features as item, idx (idx)}
        <div class="md-card md-card--outlined">
          <div style="font-size: 1.5rem; margin-bottom: 1rem; width: 44px; height: 44px; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-secondary-container); display: flex; align-items: center; justify-content: center;">
            {item.icon || '⚡'}
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">{item.title}</h3>
          <p style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.5;">{item.description}</p>
        </div>
      {/each}
    </div>
  </Container>
</section>
