<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface NotificationItem {
    title: string;
    body?: string;
    /** ISO 8601 timestamp (shown relative to `now`) or display text such as "2h ago". */
    time?: string;
    read?: boolean;
    icon?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    items?: NotificationItem[];
    /** Reference "now" (ISO 8601) for relative times; fixed by default so server and client render identically. */
    now?: string;
    class?: string;
  }

  let { title = 'Notifications', items = [], now = '2026-10-28T12:00:00Z', class: className = '', ...rest }: Props = $props();

  const uid = $props.id();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' }
  ] as const;

  const safeItems = $derived(Array.isArray(items) ? items.filter((item) => item && typeof item.title === 'string') : []);
  /** Local read flags: initialised from props, re-initialised when `items` changes. */
  let readFlags = $derived(safeItems.map((item) => item.read === true));
  let tab = $state<'all' | 'unread'>('all');

  const unreadCount = $derived(readFlags.filter((r) => !r).length);
  const visible = $derived(
    safeItems.map((item, index) => ({ item, index, read: readFlags[index] ?? false })).filter((entry) => tab === 'all' || !entry.read)
  );

  const nowMs = $derived.by(() => {
    const parsed = Date.parse(now);
    return Number.isFinite(parsed) ? parsed : Date.parse('2026-10-28T12:00:00Z');
  });

  function isIso(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
  }

  /** Relative time from the `now` reference — deterministic, no clock access. */
  function relative(value: string): string {
    const ms = Date.parse(value);
    const minutes = Math.round((nowMs - ms) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;
    const d = new Date(ms);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }

  function markRead(index: number) {
    if (readFlags[index]) return;
    readFlags = readFlags.map((r, i) => (i === index ? true : r));
  }

  function markAllRead() {
    readFlags = readFlags.map(() => true);
  }

  function handleTabKeydown(event: KeyboardEvent, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;
    event.preventDefault();
    tab = TABS[next].id;
    document.getElementById(`${uid}-tab-${TABS[next].id}`)?.focus();
  }
</script>

<section {...rest} class={['notifications', className]}>
  <header class="header">
    <div class="heading-row">
      <h3 class="title" data-prop="title">{title}</h3>
      <button type="button" class="mark-all" onclick={markAllRead} disabled={unreadCount === 0}>
        <Icon name="Check" size={15} />
        Mark all as read
      </button>
    </div>
    <div class="tablist" role="tablist" aria-label="Filter notifications">
      {#each TABS as t, i (t.id)}
        <button
          type="button"
          role="tab"
          id="{uid}-tab-{t.id}"
          class={['tab', tab === t.id && 'is-active']}
          aria-selected={tab === t.id}
          aria-controls="{uid}-panel"
          tabindex={tab === t.id ? 0 : -1}
          onclick={() => (tab = t.id)}
          onkeydown={(event) => handleTabKeydown(event, i)}
        >
          {t.label}
          {#if t.id === 'unread' && unreadCount > 0}
            <span class="tab-count">{unreadCount}</span>
          {/if}
        </button>
      {/each}
    </div>
  </header>

  <div id="{uid}-panel" class="panel" role="tabpanel" aria-labelledby="{uid}-tab-{tab}">
    {#if visible.length === 0}
      <div class="empty">
        <span class="empty-icon" aria-hidden="true"><Icon name={tab === 'unread' ? 'CheckCircle' : 'Bell'} size={22} /></span>
        <p class="empty-title">{tab === 'unread' ? 'You are all caught up' : 'No notifications yet'}</p>
        <p class="empty-body">{tab === 'unread' ? 'New notifications will appear here.' : 'Updates about your workspace will appear here.'}</p>
      </div>
    {:else}
      <ul class="list">
        {#each visible as entry (entry.index)}
          {@const item = entry.item}
          <li class={['item', !entry.read && 'is-unread']}>
            <button type="button" class="row" onclick={() => markRead(entry.index)} aria-describedby={entry.read ? undefined : `${uid}-unread`}>
              <span class="icon-tile" aria-hidden="true"><Icon name={item.icon || 'Bell'} size={18} /></span>
              <span class="content">
                <span class="row-top">
                  <span class="item-title" data-prop={`items.${entry.index}.title`}>{item.title}</span>
                  {#if item.time}
                    {#if isIso(item.time)}
                      <time class="time" datetime={item.time}>{relative(item.time)}</time>
                    {:else}
                      <span class="time">{item.time}</span>
                    {/if}
                  {/if}
                </span>
                {#if item.body}
                  <span class="item-body" data-prop={`items.${entry.index}.body`}>{item.body}</span>
                {/if}
              </span>
              <span class="unread-dot" aria-hidden="true"></span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <p id="{uid}-unread" class="sr-only">Unread. Select to mark as read.</p>
</section>

<style>
  .notifications {
    --nl-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    position: relative;
    min-width: 0;
    border: 1px solid var(--nl-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
  .header {
    padding: 1rem 1.25rem 0;
    border-bottom: 1px solid var(--nl-border);
  }
  .heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .mark-all {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 2.25rem;
    padding: 0 0.625rem;
    margin-right: -0.625rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-primary);
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .mark-all:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent);
  }
  .mark-all:disabled {
    color: var(--md-sys-color-on-surface-variant);
    opacity: 0.6;
    cursor: default;
  }
  .tablist {
    display: flex;
    gap: 1.25rem;
    margin-top: 0.5rem;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 2.5rem;
    padding: 0 0.125rem;
    margin-bottom: -1px;
    border-bottom: 2px solid transparent;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .tab:hover {
    color: var(--md-sys-color-on-surface);
  }
  .tab.is-active {
    border-bottom-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-surface);
  }
  .tab-count {
    min-width: 1.25rem;
    padding: 0 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-size: 0.6875rem;
    line-height: 1.125rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .list {
    list-style: none;
  }
  .item + .item {
    border-top: 1px solid var(--nl-border);
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    width: 100%;
    padding: 0.875rem 1.25rem;
    text-align: left;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .row:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .row:focus-visible {
    outline-offset: -2px;
  }
  .is-unread .row {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 4%, transparent);
  }
  .is-unread .row:hover {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 7%, transparent);
  }
  .icon-tile {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border: 1px solid var(--nl-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-variant);
  }
  .content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .row-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .item-title {
    min-width: 0;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface);
  }
  .is-unread .item-title {
    font-weight: 650;
  }
  .time {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .item-body {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
    overflow-wrap: anywhere;
  }
  .unread-dot {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    margin-top: 0.4375rem;
    border-radius: 50%;
    background-color: transparent;
  }
  .is-unread .unread-dot {
    background-color: var(--md-sys-color-primary);
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2.5rem 1.25rem;
    text-align: center;
  }
  .empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    margin-bottom: 0.75rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
  }
  .empty-title {
    font-size: 0.875rem;
    font-weight: 600;
  }
  .empty-body {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
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
</style>
