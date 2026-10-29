<script lang="ts" module>
  /** FNV-1a hash: the same name always maps to the same placeholder colors (SSR and client). */
  function hashName(name: string): number {
    let hash = 2166136261;
    for (const ch of name) {
      hash ^= ch.codePointAt(0) ?? 0;
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = Array.from(parts[0])[0] ?? '';
    const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? '') : '';
    return (first + last).toUpperCase();
  }

  /** Curated hues (blues, violets, pinks, teals): no muddy yellows or browns. */
  const PLACEHOLDER_HUES = [256, 290, 20, 315, 175, 345, 205, 230, 150, 270];

  /** Soft highlight + perceptually even OKLCH gradient derived from the name (large white initials stay legible). */
  function placeholderBackground(name: string): string {
    const hue = PLACEHOLDER_HUES[hashName(name || '?') % PLACEHOLDER_HUES.length];
    const second = (hue + 22) % 360;
    return [
      `radial-gradient(120% 100% at 15% 0%, oklch(0.8 0.07 ${hue} / 0.55), transparent 55%)`,
      `linear-gradient(150deg, oklch(0.62 0.1 ${hue}), oklch(0.5 0.11 ${second}))`
    ].join(', ');
  }

  const NETWORKS: Record<string, { icon: string; label: string }> = {
    linkedin: { icon: 'LinkedinLogo', label: 'LinkedIn' },
    x: { icon: 'XLogo', label: 'X' },
    github: { icon: 'GithubLogo', label: 'GitHub' },
    dribbble: { icon: 'DribbbleLogo', label: 'Dribbble' },
    instagram: { icon: 'InstagramLogo', label: 'Instagram' },
    website: { icon: 'Globe', label: 'website' },
    email: { icon: 'EnvelopeSimple', label: 'email' }
  };

  function networkOf(network: string | undefined): { icon: string; label: string } {
    return NETWORKS[String(network ?? '').toLowerCase()] ?? NETWORKS.website;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface MemberLink {
    network: string;
    href: string;
  }

  interface Member {
    name: string;
    role?: string;
    photoSrc?: string;
    bio?: string;
    links?: MemberLink[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    members?: Member[];
    columns?: number;
    variant?: 'cards' | 'minimal' | 'overlay';
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'center',
    members = [],
    columns = 4,
    variant = 'cards',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(members) ? members : []).filter((m) => m && typeof m === 'object'));
  const cols = $derived(Math.min(4, Math.max(2, Math.round(Number(columns) || 4))));
  const style = $derived(variant === 'minimal' || variant === 'overlay' ? variant : 'cards');
  const centered = $derived(align === 'center');
</script>

{#snippet socials(member: Member)}
  {@const links = Array.isArray(member.links) ? member.links : []}
  {#if links.length > 0}
    <ul class="links">
      {#each links as link, l (l)}
        {@const net = networkOf(link?.network)}
        <li>
          <a class="link" href={safeHref(link?.href)} aria-label="{member.name} on {net.label}">
            <Icon name={net.icon} size={18} />
          </a>
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<section {...rest} class={['team', `team--${style}`, className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
  <div class="md-container md-container--xl">
    {#if eyebrow || heading || subheading}
      <header class={['head', centered && 'head--center']}>
        {#if eyebrow}
          <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        {#if heading}
          <h2 id="{uid}-heading" class="heading" data-prop="heading">{heading}</h2>
        {/if}
        {#if subheading}
          <p class="subheading" data-prop="subheading">{subheading}</p>
        {/if}
      </header>
    {/if}

    {#if list.length > 0}
      <ul class={['grid', `grid--${cols}`]}>
        {#each list as member, i (i)}
          {@const photo = safeSrc(member.photoSrc)}
          <li class="member">
            <div class="photo">
              {#if photo}
                <img src={photo} alt={member.name} width="640" height="800" loading="lazy" />
              {:else}
                <div class="placeholder" style:background-image={placeholderBackground(member.name ?? '')} aria-hidden="true">
                  <span class="initials">{initialsOf(member.name ?? '')}</span>
                </div>
              {/if}
              {#if style === 'overlay'}
                <div class="overlay">
                  <div class="overlay-text">
                    <h3 class="name" data-prop={`members.${i}.name`}>{member.name}</h3>
                    {#if member.role}
                      <p class="role" data-prop={`members.${i}.role`}>{member.role}</p>
                    {/if}
                  </div>
                  {@render socials(member)}
                </div>
              {/if}
            </div>

            {#if style === 'overlay'}
              {#if member.bio}
                <p class="bio" data-prop={`members.${i}.bio`}>{member.bio}</p>
              {/if}
            {:else}
              <div class="body">
                <h3 class="name" data-prop={`members.${i}.name`}>{member.name}</h3>
                {#if member.role}
                  <p class="role" data-prop={`members.${i}.role`}>{member.role}</p>
                {/if}
                {#if member.bio}
                  <p class="bio" data-prop={`members.${i}.bio`}>{member.bio}</p>
                {/if}
                {@render socials(member)}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .team {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    padding: clamp(4rem, 3rem + 4vw, 6.5rem) 0;
  }

  /* Section header ------------------------------------------------------- */
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    max-width: 44rem;
    margin-bottom: clamp(2.5rem, 2rem + 2vw, 3.75rem);
  }
  .head--center {
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }
  .heading {
    font-size: clamp(1.875rem, 1.35rem + 1.9vw, 2.75rem);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.025em;
    color: var(--md-sys-color-on-surface);
    text-wrap: balance;
  }
  .subheading {
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  /* Grid ------------------------------------------------------------------- */
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
    list-style: none;
  }
  .team--minimal .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.5rem 1rem;
  }
  @media (min-width: 768px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .team--minimal .grid--3,
    .team--minimal .grid--4 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .grid {
      gap: 2rem;
    }
    .grid--3,
    .team--minimal .grid--3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .grid--4,
    .team--minimal .grid--4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
  .member {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* Photo + placeholder ---------------------------------------------------- */
  .photo {
    position: relative;
    overflow: hidden;
    background-color: var(--md-sys-color-surface-container);
  }
  .photo img,
  .placeholder {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .initials {
    color: #fff;
    font-size: clamp(2rem, 1.5rem + 1.5vw, 2.75rem);
    font-weight: 600;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  /* Cards ------------------------------------------------------------------ */
  .team--cards .member {
    overflow: hidden;
    border: 1px solid var(--sc-border);
    border-radius: 1rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 16px rgba(0, 0, 0, 0.04);
  }
  .team--cards .photo {
    aspect-ratio: 4 / 3;
  }
  .team--cards .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 1.25rem 1.25rem 1.375rem;
  }
  @media (max-width: 767px) {
    /* Compact list cards on phones: square thumbnail beside the text. */
    .team--cards .member {
      flex-direction: row;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
    }
    .team--cards .photo {
      flex: 0 0 88px;
      width: 88px;
      aspect-ratio: 1 / 1;
      border-radius: 0.75rem;
    }
    .team--cards .initials {
      font-size: 1.5rem;
    }
    .team--cards .body {
      padding: 0.125rem 0 0;
    }
    .team--cards .links {
      padding-top: 0.5rem;
    }
  }

  /* Minimal ---------------------------------------------------------------- */
  .team--minimal .member {
    align-items: center;
    text-align: center;
  }
  .team--minimal .photo {
    width: 112px;
    height: 112px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    box-shadow: 0 0 0 1px var(--sc-border);
  }
  .team--minimal .initials {
    font-size: 2rem;
  }
  .team--minimal .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 1.25rem;
  }
  .team--minimal .links {
    justify-content: center;
  }

  /* Overlay ---------------------------------------------------------------- */
  .team--overlay .photo {
    aspect-ratio: 4 / 5;
    border-radius: 1rem;
  }
  .overlay {
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 3.5rem 1.25rem 1.25rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.35) 55%, transparent);
    color: #fff;
  }
  .overlay-text {
    min-width: 0;
  }
  .team--overlay .overlay .name {
    color: #fff;
  }
  .team--overlay .overlay .role {
    color: rgba(255, 255, 255, 0.82);
  }
  .team--overlay .overlay .links {
    margin-top: 0;
  }
  .team--overlay .overlay .link {
    color: rgba(255, 255, 255, 0.9);
  }
  .team--overlay .overlay .link:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.16);
  }
  .team--overlay .bio {
    margin-top: 0.875rem;
  }

  /* Text ------------------------------------------------------------------- */
  .name {
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface);
  }
  .role {
    margin-top: 0.125rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-primary);
  }
  .bio {
    margin-top: 0.75rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Social links ----------------------------------------------------------- */
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: auto;
    padding-top: 1rem;
    list-style: none;
  }
  .team--minimal .links,
  .team--overlay .links {
    padding-top: 0.75rem;
  }
  .team--overlay .overlay .links {
    padding-top: 0;
    flex-wrap: nowrap;
  }
  .link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-left: -0.625rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--md-sys-color-on-surface-variant);
    transition:
      color 150ms var(--sc-ease),
      background-color 150ms var(--sc-ease);
  }
  .links li + li .link {
    margin-left: 0;
  }
  .team--minimal .link,
  .team--overlay .overlay .link {
    margin-left: 0;
  }
  .link:hover {
    color: var(--md-sys-color-primary);
    background-color: var(--md-sys-color-surface-container);
  }
</style>
