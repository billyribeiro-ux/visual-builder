<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface Project {
    title?: string;
    category?: string;
    imageUrl?: string;
    href?: string;
    summary?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    allLabel?: string;
    projects?: Project[];
    columns?: number;
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Selected work',
    sectionDescription = '',
    allLabel = 'All',
    projects = [],
    columns = 3,
    class: className = '',
    ...rest
  }: Props = $props();

  const MOTIF_ICONS = ['Browser', 'DeviceMobile', 'PenNib', 'Palette', 'ChartLineUp', 'Cube'];

  const cols = $derived(Math.min(4, Math.max(2, Math.round(Number(columns) || 3))));

  const items = $derived(
    (Array.isArray(projects) ? projects : []).map((project, index) => ({
      index,
      title: String(project?.title ?? ''),
      category: String(project?.category ?? '').trim(),
      image: safeSrc(project?.imageUrl),
      href: String(project?.href ?? ''),
      summary: String(project?.summary ?? '')
    }))
  );

  /** Filter chips: unique categories in order of first appearance. */
  const categories = $derived(
    items.map((item) => item.category).filter((category, index, all) => category !== '' && all.indexOf(category) === index)
  );

  let selected = $state<string | null>(null);
  /** A selection that no longer exists (e.g. the category was renamed) shows everything. */
  const active = $derived(selected !== null && categories.includes(selected) ? selected : null);
  const visible = $derived(active === null ? items : items.filter((item) => item.category === active));

  function categoryIndex(category: string): number {
    const at = categories.indexOf(category);
    return at === -1 ? 0 : at;
  }
</script>

<section {...rest} class={['portfolio', `cols-${cols}`, className]}>
  <div class="md-container md-container--xl">
    <div class="header">
      {#if sectionEyebrow}
        <p class="md-eyebrow eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
      {/if}
      <h2 class="heading" data-prop="sectionTitle">{sectionTitle}</h2>
      {#if sectionDescription}
        <p class="description" data-prop="sectionDescription">{sectionDescription}</p>
      {/if}
    </div>

    {#if categories.length > 1}
      <div class="filters" role="group" aria-label="Filter projects by category">
        <button type="button" class="chip" aria-pressed={active === null} onclick={() => (selected = null)}>
          <span data-prop="allLabel">{allLabel}</span>
          <span class="chip-count">{items.length}</span>
        </button>
        {#each categories as category (category)}
          <button type="button" class="chip" aria-pressed={active === category} onclick={() => (selected = category)}>
            {category}
            <span class="chip-count">{items.filter((item) => item.category === category).length}</span>
          </button>
        {/each}
      </div>
    {/if}
    <p class="sr-only" aria-live="polite">
      {visible.length === 1 ? 'Showing 1 project' : `Showing ${visible.length} projects`}{active ? ` in ${active}` : ''}
    </p>

    <ul class="grid">
      {#each visible as project (project.index)}
        {@const tone = categoryIndex(project.category) % 3}
        <li class="project">
          <article class="project-inner">
            <div class={['media', `tone-${tone}`]}>
              {#if project.image}
                <img src={project.image} alt="" width="800" height="600" loading="lazy" />
              {:else}
                <div class="placeholder" aria-hidden="true">
                  <span class="placeholder-frame">
                    <Icon name={MOTIF_ICONS[project.index % MOTIF_ICONS.length]} size={28} />
                  </span>
                </div>
              {/if}
              {#if project.summary}
                <div class="overlay" aria-hidden="true">
                  <p class="overlay-summary">{project.summary}</p>
                  <span class="overlay-cta">View project <Icon name="ArrowUpRight" size={16} /></span>
                </div>
              {/if}
            </div>
            <div class="caption">
              <div>
                <h3 class="title">
                  <a href={safeHref(project.href)} class="title-link" data-prop={`projects.${project.index}.title`}>{project.title}</a>
                </h3>
                {#if project.summary}
                  <p class="summary" data-prop={`projects.${project.index}.summary`}>{project.summary}</p>
                {/if}
              </div>
              {#if project.category}
                <span class="category" data-prop={`projects.${project.index}.category`}>{project.category}</span>
              {/if}
            </div>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .portfolio {
    padding: 6rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .header {
    max-width: 44rem;
    margin: 0 auto 2.5rem;
    text-align: center;
  }
  .eyebrow {
    margin-bottom: 0.75rem;
  }
  .heading {
    font-size: clamp(1.875rem, 1.3rem + 1.9vw, 2.75rem);
    line-height: 1.12;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  .description {
    margin-top: 1rem;
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  /* ---------------------------------------------------------------- filters */
  .filters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 2.5rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 40px;
    padding: 0 0.875rem 0 1rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
    transition:
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .chip:hover {
    color: var(--md-sys-color-on-surface);
    border-color: var(--md-sys-color-outline);
  }
  .chip[aria-pressed='true'] {
    background-color: var(--md-sys-color-on-surface);
    border-color: var(--md-sys-color-on-surface);
    color: var(--md-sys-color-surface);
  }
  .chip-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.375rem;
    height: 1.375rem;
    padding: 0 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: color-mix(in srgb, currentColor 12%, transparent);
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* ---------------------------------------------------------------- grid */
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem 1.5rem;
    list-style: none;
  }
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .cols-3 .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .cols-4 .grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .project {
    min-width: 0;
    animation: portfolio-in var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .project-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .media {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .tone-0 {
    --tone: var(--md-sys-color-primary);
  }
  .tone-1 {
    --tone: var(--md-sys-color-tertiary);
  }
  .tone-2 {
    --tone: var(--md-sys-color-secondary);
  }
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(ellipse 80% 80% at 0% 0%, color-mix(in srgb, var(--tone) 24%, transparent), transparent 70%),
      radial-gradient(ellipse 70% 70% at 100% 100%, color-mix(in srgb, var(--tone) 14%, transparent), transparent 70%),
      var(--md-sys-color-surface-container-low);
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .placeholder-frame {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44%;
    aspect-ratio: 4 / 3;
    border-radius: 12px;
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 88%, transparent);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    color: color-mix(in srgb, var(--tone) 80%, var(--md-sys-color-on-surface));
    box-shadow: 0 18px 36px -18px rgba(0, 0, 0, 0.3);
    transform: rotate(-3deg);
  }
  .project-inner:hover .media img,
  .project-inner:hover .placeholder {
    transform: scale(1.04);
  }

  /* Hover overlay (pointer devices): summary + cue. The same text is in the caption for everyone else. */
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.12) 65%, transparent);
    color: rgba(255, 255, 255, 0.96);
    opacity: 0;
    transition: opacity var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .overlay-summary {
    font-size: 0.9375rem;
    line-height: 1.5;
    transform: translateY(6px);
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .overlay-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .caption {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .title {
    font-size: 1.0625rem;
    line-height: 1.4;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .title-link {
    color: var(--md-sys-color-on-surface);
  }
  .title-link::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: 16px;
  }
  .title-link:focus-visible {
    outline: none;
  }
  .title-link:focus-visible::after {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 4px;
  }
  .summary {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
  .category {
    flex-shrink: 0;
    padding: 0.125rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25rem;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
  }

  @media (hover: hover) and (pointer: fine) {
    .project-inner:hover .overlay,
    .project-inner:focus-within .overlay {
      opacity: 1;
    }
    .project-inner:hover .overlay-summary,
    .project-inner:focus-within .overlay-summary {
      transform: translateY(0);
    }
    /* Visually hidden (still read by assistive tech): the overlay shows it on hover. */
    .summary {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  }
  @media (hover: none), (pointer: coarse) {
    .overlay {
      display: none;
    }
  }

  @media (max-width: 767px) {
    .portfolio {
      padding: 4rem 0;
    }
    .filters {
      flex-wrap: nowrap;
      justify-content: flex-start;
      overflow-x: auto;
      margin-inline: -1.5rem;
      padding: 0.25rem 1.5rem;
      scrollbar-width: none;
    }
    .chip {
      flex-shrink: 0;
      min-height: 44px;
    }
  }

  @keyframes portfolio-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
