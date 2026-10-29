<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

  interface ActivityItem {
    actor: string;
    action: string;
    target?: string;
    /** ISO 8601 timestamp. */
    time?: string;
    icon?: string;
    tone?: Tone;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    items?: ActivityItem[];
    /** Reference "now" (ISO 8601) for relative times; fixed by default so server and client render identically. */
    now?: string;
    showViewAll?: boolean;
    viewAllText?: string;
    viewAllHref?: string;
    class?: string;
  }

  let {
    title = 'Recent activity',
    items = [],
    now = '2026-10-28T12:00:00Z',
    showViewAll = true,
    viewAllText = 'View all activity',
    viewAllHref = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TONES: readonly Tone[] = ['primary', 'success', 'warning', 'danger', 'neutral', 'violet'];

  const nowMs = $derived.by(() => {
    const parsed = Date.parse(now);
    return Number.isFinite(parsed) ? parsed : Date.parse('2026-10-28T12:00:00Z');
  });

  function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  /** Absolute UTC timestamp, locale-independent (identical on server and client). */
  function absolute(ms: number): string {
    const d = new Date(ms);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  }

  /** Relative time from the `now` reference — deterministic, no clock access. */
  function relative(ms: number): string {
    const seconds = Math.round((nowMs - ms) / 1000);
    if (seconds < 0) return 'Scheduled';
    if (seconds < 45) return 'Just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    const d = new Date(ms);
    const sameYear = d.getUTCFullYear() === new Date(nowMs).getUTCFullYear();
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${sameYear ? '' : `, ${d.getUTCFullYear()}`}`;
  }

  const entries = $derived(
    (Array.isArray(items) ? items : []).map((item, index) => {
      const ms = typeof item.time === 'string' ? Date.parse(item.time) : NaN;
      const valid = Number.isFinite(ms);
      return {
        index,
        actor: item.actor ?? '',
        action: item.action ?? '',
        target: item.target ?? '',
        icon: item.icon || 'Pulse',
        tone: TONES.includes(item.tone as Tone) ? (item.tone as Tone) : 'neutral',
        initials: initials(item.actor ?? ''),
        datetime: valid ? new Date(ms).toISOString() : '',
        relative: valid ? relative(ms) : '',
        absolute: valid ? absolute(ms) : ''
      };
    })
  );
</script>

<section {...rest} class={['feed', className]}>
  <header class="header">
    <h3 class="title" data-prop="title">{title}</h3>
  </header>

  {#if entries.length === 0}
    <p class="empty">No activity yet.</p>
  {:else}
    <ol class="list">
      {#each entries as entry (entry.index)}
        <li class="item">
          <div class="avatar-wrap" aria-hidden="true">
            <span class="avatar">{entry.initials}</span>
            <span class={['badge', `tone-${entry.tone}`]}><Icon name={entry.icon} size={11} /></span>
          </div>
          <div class="body">
            <p class="text">
              <span class="actor" data-prop={`items.${entry.index}.actor`}>{entry.actor}</span>
              <span class="action" data-prop={`items.${entry.index}.action`}>{entry.action}</span>
              {#if entry.target}
                <span class="target" data-prop={`items.${entry.index}.target`}>{entry.target}</span>
              {/if}
            </p>
            {#if entry.datetime}
              <time class="time" datetime={entry.datetime} title={entry.absolute}>{entry.relative}</time>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}

  {#if showViewAll && viewAllText}
    <footer class="footer">
      <a class="view-all" href={safeHref(viewAllHref)}>
        <span data-prop="viewAllText">{viewAllText}</span>
        <Icon name="ArrowRight" size={14} />
      </a>
    </footer>
  {/if}
</section>

<style>
  .feed {
    --feed-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    min-width: 0;
    border: 1px solid var(--feed-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--feed-border);
  }
  .title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .empty {
    padding: 2rem 1.25rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .list {
    list-style: none;
    padding: 0.5rem 1.25rem;
  }
  .item {
    position: relative;
    display: flex;
    gap: 0.875rem;
    padding: 0.75rem 0;
  }
  /* Timeline connector between avatars. */
  .item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 1rem;
    top: 3rem;
    bottom: -0.25rem;
    width: 1px;
    background-color: var(--feed-border);
  }
  .avatar-wrap {
    position: relative;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
  }
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding-right: 0.125rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    font-weight: 650;
    letter-spacing: 0.02em;
  }
  .badge {
    position: absolute;
    right: -0.4375rem;
    bottom: -0.3125rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-primary);
  }
  .tone-primary { background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); }
  .tone-success { background-color: var(--md-sys-color-success); color: var(--md-sys-color-on-success); }
  .tone-warning { background-color: var(--md-sys-color-warning, #B26A00); color: var(--md-sys-color-on-warning, #FFFFFF); }
  .tone-danger { background-color: var(--md-sys-color-error); color: var(--md-sys-color-on-error); }
  .tone-neutral { background-color: var(--md-sys-color-on-surface-variant); color: var(--md-sys-color-surface-container-lowest); }
  .tone-violet { background-color: var(--md-sys-color-violet, #6E56CF); color: var(--md-sys-color-on-violet, #FFFFFF); }
  .body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.125rem 1rem;
    padding-top: 0.375rem;
  }
  .text {
    flex: 1 1 16rem;
    min-width: 0;
    font-size: 0.875rem;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant);
    overflow-wrap: anywhere;
  }
  .actor,
  .target {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .time {
    flex-shrink: 0;
    font-size: 0.75rem;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .footer {
    border-top: 1px solid var(--feed-border);
  }
  .view-all {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-height: 2.75rem;
    padding: 0.625rem 1.25rem;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
    border-radius: 0 0 var(--md-sys-shape-corner-medium, 12px) var(--md-sys-shape-corner-medium, 12px);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .view-all:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }
</style>
