<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  type Network =
    | 'linkedin'
    | 'x'
    | 'github'
    | 'youtube'
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'dribbble'
    | 'discord'
    | 'slack'
    | 'medium'
    | 'threads'
    | 'email'
    | 'website'
    | 'rss';

  interface SocialItem {
    network: Network;
    href: string;
    /** Accessible name; defaults to the network name. */
    label?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    items?: SocialItem[];
    variant?: 'plain' | 'soft' | 'solid' | 'outline';
    shape?: 'circle' | 'rounded' | 'square';
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'center' | 'right';
    brandColors?: boolean;
    class?: string;
  }

  let {
    items = [],
    variant = 'soft',
    shape = 'circle',
    size = 'md',
    align = 'left',
    brandColors = false,
    class: className = '',
    ...rest
  }: Props = $props();

  /** Icon, display name and brand color per network (monochrome brands follow the theme text color). */
  const NETWORKS: Record<Network, { icon: string; name: string; brand: string }> = {
    linkedin: { icon: 'LinkedinLogo', name: 'LinkedIn', brand: '#0a66c2' },
    x: { icon: 'XLogo', name: 'X', brand: 'var(--md-sys-color-on-surface)' },
    github: { icon: 'GithubLogo', name: 'GitHub', brand: 'var(--md-sys-color-on-surface)' },
    youtube: { icon: 'YoutubeLogo', name: 'YouTube', brand: '#ff0000' },
    instagram: { icon: 'InstagramLogo', name: 'Instagram', brand: '#e4405f' },
    facebook: { icon: 'FacebookLogo', name: 'Facebook', brand: '#0866ff' },
    tiktok: { icon: 'TiktokLogo', name: 'TikTok', brand: 'var(--md-sys-color-on-surface)' },
    dribbble: { icon: 'DribbbleLogo', name: 'Dribbble', brand: '#ea4c89' },
    discord: { icon: 'DiscordLogo', name: 'Discord', brand: '#5865f2' },
    slack: { icon: 'SlackLogo', name: 'Slack', brand: '#4a154b' },
    medium: { icon: 'MediumLogo', name: 'Medium', brand: 'var(--md-sys-color-on-surface)' },
    threads: { icon: 'ThreadsLogo', name: 'Threads', brand: 'var(--md-sys-color-on-surface)' },
    email: { icon: 'EnvelopeSimple', name: 'Email', brand: 'var(--md-sys-color-primary)' },
    website: { icon: 'Globe', name: 'Website', brand: 'var(--md-sys-color-primary)' },
    rss: { icon: 'Rss', name: 'RSS feed', brand: '#f26522' }
  };

  const ICON_SIZE = { sm: 16, md: 20, lg: 24 } as const;
  const iconSize = $derived(ICON_SIZE[size] ?? 20);

  function isExternal(href: string): boolean {
    return /^https?:\/\//i.test(href);
  }
</script>

<ul
  {...rest}
  class={['social', `social--${variant}`, `social--${shape}`, `social--${size}`, `align-${align}`, brandColors && 'social--brand', className]}
  aria-label="Social links"
>
  {#each items as item, index (index)}
    {@const meta = NETWORKS[item.network] ?? NETWORKS.website}
    {@const url = safeHref(item.href)}
    {@const external = isExternal(url)}
    {@const name = item.label?.trim() || meta.name}
    <li class="entry" style:--brand={meta.brand}>
      <a
        class="link"
        href={safeHref(item.href)}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        aria-label={external ? `${name} (opens in a new tab)` : name}
      >
        <Icon name={meta.icon} size={iconSize} />
      </a>
    </li>
  {/each}
</ul>

<style>
  .social {
    --tile: 40px;
    --tile-radius: var(--md-sys-shape-corner-full, 9999px);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .social--sm {
    --tile: 32px;
    gap: 0.375rem;
  }
  .social--lg {
    --tile: 48px;
    gap: 0.625rem;
  }
  .social--rounded {
    --tile-radius: 10px;
  }
  .social--square {
    --tile-radius: var(--md-sys-shape-corner-extra-small, 4px);
  }
  .align-left {
    justify-content: flex-start;
  }
  .align-center {
    justify-content: center;
  }
  .align-right {
    justify-content: flex-end;
  }

  .entry {
    display: flex;
  }

  .link {
    position: relative;
    display: inline-flex;
    width: var(--tile);
    height: var(--tile);
    align-items: center;
    justify-content: center;
    border-radius: var(--tile-radius);
    color: var(--md-sys-color-on-surface-variant);
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  /* Small tiles keep a 40px touch target. */
  .social--sm .link::after {
    content: '';
    position: absolute;
    inset: -4px;
  }
  .link:hover {
    transform: translateY(-1px);
  }
  .link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  /* ---- Theme colors ----------------------------------------------------- */
  .social--plain .link:hover {
    color: var(--md-sys-color-on-surface);
  }
  .social--soft .link {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high);
  }
  .social--soft .link:hover {
    color: var(--md-sys-color-primary);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, var(--md-sys-color-surface-container-high));
  }
  .social--solid .link {
    color: var(--md-sys-color-on-primary);
    background-color: var(--md-sys-color-primary);
  }
  .social--solid .link:hover {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 86%, #000);
  }
  .social--outline .link {
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .social--outline .link:hover {
    border-color: var(--md-sys-color-on-surface);
  }

  /* ---- Brand colors ----------------------------------------------------- */
  .social--brand.social--plain .link,
  .social--brand.social--outline .link {
    color: var(--brand);
  }
  .social--brand.social--plain .link:hover {
    color: color-mix(in srgb, var(--brand) 80%, var(--md-sys-color-on-surface));
  }
  .social--brand.social--outline .link:hover {
    border-color: var(--brand);
  }
  .social--brand.social--soft .link {
    color: var(--brand);
    background-color: color-mix(in srgb, var(--brand) 11%, transparent);
  }
  .social--brand.social--soft .link:hover {
    color: var(--brand);
    background-color: color-mix(in srgb, var(--brand) 18%, transparent);
  }
  .social--brand.social--solid .link {
    color: var(--md-sys-color-surface-container-lowest, #fff);
    background-color: var(--brand);
  }
  .social--brand.social--solid .link:hover {
    background-color: color-mix(in srgb, var(--brand) 86%, #000);
  }

  @media (prefers-reduced-motion: reduce) {
    .link:hover {
      transform: none;
    }
  }
</style>
