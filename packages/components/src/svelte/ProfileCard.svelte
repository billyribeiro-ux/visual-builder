<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeHref, safeSrc } from './lib/href.js';

  interface ProfileStat {
    label: string;
    value: string;
  }

  interface ProfileAction {
    label: string;
    href?: string;
    variant?: 'primary' | 'secondary';
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'role'> {
    name?: string;
    role?: string;
    avatarSrc?: string;
    coverStyle?: 'none' | 'gradient';
    stats?: ProfileStat[];
    actions?: ProfileAction[];
    badges?: string[];
    class?: string;
  }

  let {
    name = 'Team member',
    role = '',
    avatarSrc = '',
    coverStyle = 'gradient',
    stats = [],
    actions = [],
    badges = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const src = $derived(safeSrc(avatarSrc));
  /** The URL that failed to load (so a new URL is retried). */
  let failedSrc = $state('');
  const showImage = $derived(Boolean(src) && failedSrc !== src);

  const initials = $derived.by(() => {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
  });

  const safeStats = $derived(Array.isArray(stats) ? stats : []);
  const safeActions = $derived(Array.isArray(actions) ? actions.filter((a) => a && a.label) : []);
  const safeBadges = $derived(Array.isArray(badges) ? badges.filter((b) => typeof b === 'string' && b.trim()) : []);
</script>

<article {...rest} class={['profile', coverStyle === 'gradient' ? 'profile--cover' : 'profile--flat', className]}>
  {#if coverStyle === 'gradient'}
    <div class="cover" aria-hidden="true"></div>
  {/if}

  <div class="content">
    <div class="avatar">
      {#if showImage}
        <img src={src} alt={name} width="80" height="80" class="avatar-img" onerror={() => (failedSrc = src)} />
      {:else}
        <span class="avatar-initials" aria-hidden="true">{initials}</span>
      {/if}
    </div>

    <h3 class="name" data-prop="name">{name}</h3>
    {#if role}
      <p class="role" data-prop="role">{role}</p>
    {/if}

    {#if safeBadges.length}
      <ul class="badges" aria-label="Badges">
        {#each safeBadges as badge, index (index)}
          <li class="badge" data-prop={`badges.${index}`}>{badge}</li>
        {/each}
      </ul>
    {/if}

    {#if safeStats.length}
      <dl class="stats" style:--stat-count={Math.min(safeStats.length, 4)}>
        {#each safeStats as stat, index (index)}
          <div class="stat">
            <dt class="stat-label" data-prop={`stats.${index}.label`}>{stat.label}</dt>
            <dd class="stat-value" data-prop={`stats.${index}.value`}>{stat.value}</dd>
          </div>
        {/each}
      </dl>
    {/if}

    {#if safeActions.length}
      <div class="actions">
        {#each safeActions as action, index (index)}
          <a
            href={safeHref(action.href)}
            class={['md-btn', 'md-btn--sm', 'action', action.variant === 'primary' ? 'md-btn--filled' : 'md-btn--outlined action--secondary']}
            data-prop={`actions.${index}.label`}
          >
            {action.label}
          </a>
        {/each}
      </div>
    {/if}
  </div>
</article>

<style>
  .profile {
    --profile-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    position: relative;
    min-width: 0;
    max-width: 26rem;
    overflow: hidden;
    border: 1px solid var(--profile-border);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04);
  }
  .cover {
    height: 6rem;
    background:
      radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent) 0%, transparent 60%),
      radial-gradient(120% 140% at 100% 100%, color-mix(in srgb, var(--md-sys-color-tertiary) 35%, transparent) 0%, transparent 55%),
      linear-gradient(135deg, var(--md-sys-color-primary-container), color-mix(in srgb, var(--md-sys-color-primary) 25%, var(--md-sys-color-surface-container-lowest)));
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1.5rem 1.5rem;
  }
  .profile--cover .content {
    padding-top: 0;
  }
  .avatar {
    position: relative;
    width: 5rem;
    height: 5rem;
    margin-bottom: 0.875rem;
    border-radius: 50%;
    box-shadow: 0 0 0 4px var(--md-sys-color-surface-container-lowest), 0 2px 8px rgba(0, 0, 0, 0.08);
    background-color: var(--md-sys-color-primary-container);
    overflow: hidden;
  }
  .profile--cover .avatar {
    margin-top: -2.5rem;
  }
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--md-sys-color-on-primary-container);
    font-size: 1.5rem;
    font-weight: 650;
    letter-spacing: 0.01em;
  }
  .name {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.01em;
  }
  .role {
    margin-top: 0.125rem;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.375rem;
    margin-top: 0.875rem;
    list-style: none;
  }
  .badge {
    padding: 0.125rem 0.625rem;
    border: 1px solid var(--profile-border);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.25rem;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(var(--stat-count, 3), minmax(0, 1fr));
    width: 100%;
    margin-top: 1.25rem;
    border-top: 1px solid var(--profile-border);
    border-bottom: 1px solid var(--profile-border);
  }
  .stat {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.125rem;
    padding: 0.875rem 0.5rem;
  }
  .stat + .stat {
    border-left: 1px solid var(--profile-border);
  }
  .stat-label {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .stat-value {
    font-size: 1.0625rem;
    font-weight: 650;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    gap: 0.625rem;
    width: 100%;
    margin-top: 1.25rem;
  }
  .action {
    flex: 1 1 0;
    min-width: 0;
    min-height: 2.5rem;
  }
  .action--secondary {
    color: var(--md-sys-color-on-surface);
    border-color: var(--md-sys-color-outline-variant);
  }
</style>
