<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';

  type Variant = 'simple' | 'accent-border' | 'card' | 'large-centered';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'role'> {
    quote?: string;
    author?: string;
    /** Author role or company. */
    role?: string;
    avatarUrl?: string;
    variant?: Variant;
    class?: string;
  }

  let {
    quote = 'The fastest way to align a team is to put the work where everyone can see it.',
    author = '',
    role = '',
    avatarUrl = '',
    variant = 'accent-border',
    class: className = '',
    ...rest
  }: Props = $props();

  const VARIANTS: readonly Variant[] = ['simple', 'accent-border', 'card', 'large-centered'];

  const kind = $derived(VARIANTS.includes(variant) ? variant : 'accent-border');
  const avatarSrc = $derived(safeSrc(avatarUrl));
  let failedSrc = $state<string | null>(null);
  const showAvatar = $derived(avatarSrc !== '' && failedSrc !== avatarSrc);
  const initials = $derived(
    author
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
  );
  const hasMark = $derived(kind === 'card' || kind === 'large-centered');
</script>

<figure {...rest} class={['quote', `variant-${kind}`, className]}>
  {#if hasMark}
    <span class="mark" aria-hidden="true"><Icon name="Quotes" size={kind === 'large-centered' ? 40 : 28} /></span>
  {/if}
  <blockquote class="body">
    <p class="text" data-prop="quote">{quote}</p>
  </blockquote>
  {#if author || role}
    <figcaption class="cite">
      {#if showAvatar}
        <img
          class="avatar"
          src={avatarSrc}
          alt=""
          width="40"
          height="40"
          loading="lazy"
          decoding="async"
          onerror={() => (failedSrc = avatarSrc)}
        />
      {:else if initials}
        <span class="avatar avatar--initials" aria-hidden="true">{initials}</span>
      {/if}
      <span class="who">
        {#if author}
          <span class="author" data-prop="author">{author}</span>
        {/if}
        {#if role}
          <span class="role" data-prop="role">{role}</span>
        {/if}
      </span>
    </figcaption>
  {/if}
</figure>

<style>
  .quote {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .body {
    margin: 0;
  }
  .text {
    font-family: var(--md-sys-font-heading);
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.55;
    letter-spacing: -0.012em;
    max-width: 46rem;
    white-space: pre-line;
    text-wrap: pretty;
    overflow-wrap: break-word;
  }
  .mark {
    display: inline-flex;
    color: var(--md-sys-color-primary);
    line-height: 0;
  }
  .cite {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }
  .avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    object-fit: cover;
    box-shadow: 0 0 0 1px var(--md-sys-color-outline-variant);
  }
  .avatar--initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--md-sys-color-primary);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, var(--md-sys-color-surface-container-lowest));
    box-shadow: none;
  }
  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.4;
  }
  .author {
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .role {
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  .variant-accent-border {
    padding-left: 1.5rem;
    border-left: 3px solid var(--md-sys-color-primary);
  }
  .variant-card {
    gap: 1.25rem;
    padding: 2rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 8px 24px -16px rgba(0, 0, 0, 0.12);
  }
  .variant-card .text {
    font-size: 1.125rem;
  }
  .variant-large-centered {
    align-items: center;
    gap: 1.75rem;
    text-align: center;
  }
  .variant-large-centered .text {
    max-width: 30ch;
    font-size: clamp(1.5rem, 1.25rem + 1.1vw, 2rem);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .variant-large-centered .cite {
    text-align: left;
  }
  @media (max-width: 767px) {
    .variant-card {
      padding: 1.5rem;
    }
    .text {
      font-size: 1.125rem;
    }
  }
</style>
