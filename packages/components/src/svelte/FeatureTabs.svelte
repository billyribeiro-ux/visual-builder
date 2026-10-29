<script lang="ts" module>
  const BAR_HEIGHTS = [34, 52, 41, 63, 48, 72, 58, 81, 66, 90, 74, 96];
  const BOARD_COLUMNS = [3, 2, 2];
  const LIST_ROWS = [0, 1, 2, 3, 4];
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';

  interface FeatureTab {
    title: string;
    description?: string;
    icon?: string;
    imageSrc?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    tabs?: FeatureTab[];
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'left',
    tabs = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(tabs) ? tabs : []).filter((t) => t && typeof t === 'object'));
  const count = $derived(list.length);
  let selected = $state(0);
  const active = $derived(count === 0 ? -1 : Math.min(Math.max(selected, 0), count - 1));
  const centered = $derived(align === 'center');

  function handleKeydown(event: KeyboardEvent, index: number) {
    if (count === 0) return;
    let next = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % count;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    selected = next;
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }
</script>

<section {...rest} class={['feature-tabs', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
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

    {#if count > 0}
      <div class="layout">
        <div class="tablist" role="tablist" aria-orientation="vertical" aria-label={heading || 'Features'}>
          {#each list as tab, i (i)}
            {@const isActive = i === active}
            <button
              type="button"
              role="tab"
              id="{uid}-tab-{i}"
              class={['tab', isActive && 'tab--active']}
              aria-selected={isActive}
              aria-controls="{uid}-panel-{i}"
              aria-labelledby="{uid}-tab-title-{i}"
              aria-describedby={tab.description ? `${uid}-tab-desc-${i}` : undefined}
              tabindex={isActive ? 0 : -1}
              onclick={() => (selected = i)}
              onkeydown={(event) => handleKeydown(event, i)}
            >
              <span class="tab-icon"><Icon name={tab.icon || 'Sparkle'} size={20} /></span>
              <span class="tab-text">
                <span id="{uid}-tab-title-{i}" class="tab-title" data-prop={`tabs.${i}.title`}>{tab.title}</span>
                {#if tab.description}
                  <span class="tab-desc-wrap">
                    <span id="{uid}-tab-desc-{i}" class="tab-desc" data-prop={`tabs.${i}.description`}>{tab.description}</span>
                  </span>
                {/if}
              </span>
            </button>
          {/each}
        </div>

        <div class="panels">
          {#each list as tab, i (i)}
            {@const src = safeSrc(tab.imageSrc)}
            {@const kind = i % 4}
            <div
              role="tabpanel"
              id="{uid}-panel-{i}"
              class="panel"
              aria-labelledby="{uid}-tab-{i}"
              tabindex="0"
              hidden={i !== active}
            >
              <div class="media">
                {#if src}
                  <img src={src} alt={tab.title} width="1200" height="900" loading="lazy" />
                {:else}
                  <div class="mock" role="img" aria-label="{tab.title}: illustrative product preview">
                    <div class="window">
                      <div class="chrome">
                        <span class="chrome-dots"><span></span><span></span><span></span></span>
                        <span class="chrome-url"></span>
                      </div>
                      <div class="app">
                        <div class="side">
                          <span class="side-logo"><Icon name={tab.icon || 'Sparkle'} size={14} /></span>
                          {#each [0, 1, 2, 3, 4] as n (n)}
                            <span class={['side-item', n === 1 && 'side-item--active']}></span>
                          {/each}
                        </div>
                        <div class="main">
                          <div class="main-head">
                            <span class="ln ln--title"></span>
                            <span class="chip chip--primary"></span>
                          </div>
                          {#if kind === 0}
                            <div class="board">
                              {#each BOARD_COLUMNS as cards, c (c)}
                                <div class="board-col">
                                  <span class="ln ln--xs"></span>
                                  {#each Array.from({ length: cards }, (_, k) => k) as k (k)}
                                    <div class="board-card">
                                      <span class={['tag', `tag--${(c + k) % 3}`]}></span>
                                      <span class="ln"></span>
                                      <span class="ln ln--short"></span>
                                      <span class="avatar-dot"></span>
                                    </div>
                                  {/each}
                                </div>
                              {/each}
                            </div>
                          {:else if kind === 1}
                            <div class="flow">
                              {#each ['Lightning', 'GitBranch', 'CheckCircle'] as glyph, n (glyph)}
                                <div class="flow-node">
                                  <span class={['flow-icon', n === 0 && 'flow-icon--primary']}><Icon name={glyph} size={14} /></span>
                                  <span class="flow-text"><span class="ln ln--short"></span><span class="ln ln--xs"></span></span>
                                </div>
                                {#if n < 2}
                                  <span class="flow-link"></span>
                                {/if}
                              {/each}
                            </div>
                          {:else if kind === 2}
                            <div class="stats">
                              {#each [0, 1, 2] as n (n)}
                                <div class="stat">
                                  <span class="ln ln--xs"></span>
                                  <span class={['stat-value', n === 0 && 'stat-value--primary']}></span>
                                </div>
                              {/each}
                            </div>
                            <div class="chart">
                              {#each BAR_HEIGHTS as h, n (n)}
                                <span class={['bar', n === BAR_HEIGHTS.length - 1 && 'bar--accent']} style:height="{h}%"></span>
                              {/each}
                            </div>
                          {:else}
                            <div class="rows">
                              {#each LIST_ROWS as n (n)}
                                <div class="row">
                                  <span class="row-avatar"></span>
                                  <span class="row-text"><span class="ln"></span><span class="ln ln--xs"></span></span>
                                  <span class={['chip', n % 2 === 0 ? 'chip--ok' : 'chip--muted']}></span>
                                </div>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .feature-tabs {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    --sc-tint: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
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

  /* Layout ----------------------------------------------------------------- */
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: 3.5rem;
      align-items: center;
    }
  }

  /* Tabs ------------------------------------------------------------------- */
  .tablist {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .tab {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.125rem;
    border: 1px solid transparent;
    border-radius: 1rem;
    text-align: left;
    color: var(--md-sys-color-on-surface-variant);
    transition:
      background-color 200ms var(--sc-ease),
      border-color 200ms var(--sc-ease),
      box-shadow 200ms var(--sc-ease);
  }
  .tab:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .tab--active,
  .tab--active:hover {
    border-color: var(--sc-border);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 6px 20px rgba(0, 0, 0, 0.05);
  }
  .tab::before {
    content: '';
    position: absolute;
    top: 1.125rem;
    bottom: 1.125rem;
    left: -1px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background-color: var(--md-sys-color-primary);
    opacity: 0;
    transition: opacity 200ms var(--sc-ease);
  }
  .tab--active::before {
    opacity: 1;
  }
  .tab-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 0.75rem;
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
    transition:
      background-color 200ms var(--sc-ease),
      color 200ms var(--sc-ease);
  }
  .tab--active .tab-icon {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .tab-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding-top: 0.5rem;
  }
  .tab-title {
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }
  .tab-desc-wrap {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 300ms var(--sc-ease);
  }
  .tab--active .tab-desc-wrap {
    grid-template-rows: 1fr;
  }
  .tab-desc {
    min-height: 0;
    overflow: hidden;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .tab--active .tab-desc {
    padding-top: 0.375rem;
  }

  /* Panel + media ---------------------------------------------------------- */
  .panel {
    border-radius: 1.25rem;
    animation: panel-in 350ms var(--sc-ease);
  }
  .panel[hidden] {
    display: none;
  }
  @keyframes panel-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .media {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border: 1px solid var(--sc-border);
    border-radius: 1.25rem;
    background-color: var(--md-sys-color-surface-container-low);
  }
  .media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Illustrative product window -------------------------------------------- */
  .mock {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(90% 80% at 0% 0%, var(--sc-tint), transparent 60%),
      radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px) 0 0 / 18px 18px;
  }
  .window {
    position: absolute;
    top: 9%;
    left: 7%;
    right: -6%;
    bottom: -8%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--sc-border);
    border-radius: 0.875rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.05),
      0 24px 60px rgba(0, 0, 0, 0.12);
  }
  .chrome {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid var(--sc-border);
  }
  .chrome-dots {
    display: inline-flex;
    gap: 5px;
  }
  .chrome-dots span {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .chrome-url {
    width: 34%;
    height: 14px;
    margin: 0 auto;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container);
  }
  .app {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 22%;
    padding: 0.875rem 0.75rem;
    border-right: 1px solid var(--sc-border);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .side-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-bottom: 0.375rem;
    border-radius: 7px;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .side-item {
    height: 8px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-high);
  }
  .side-item:nth-child(odd) {
    width: 75%;
  }
  .side-item--active {
    background-color: var(--sc-tint);
    box-shadow: inset 3px 0 0 var(--md-sys-color-primary);
  }
  .main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.875rem;
    min-width: 0;
    padding: 1rem 1.125rem;
  }
  .main-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ln {
    display: block;
    width: 80%;
    height: 7px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-high);
  }
  .ln--title {
    width: 32%;
    height: 10px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .ln--short {
    width: 55%;
  }
  .ln--xs {
    width: 35%;
    height: 6px;
  }
  .chip {
    display: inline-block;
    flex-shrink: 0;
    width: 52px;
    height: 16px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-high);
  }
  .chip--primary {
    width: 64px;
    height: 20px;
    background-color: var(--md-sys-color-primary);
  }
  .chip--ok {
    background-color: var(--md-sys-color-success-container, var(--md-sys-color-tertiary-container));
  }
  .chip--muted {
    background-color: var(--md-sys-color-surface-container);
  }

  /* Board */
  .board {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.625rem;
  }
  .board-col {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.625rem;
    background-color: var(--md-sys-color-surface-container-low);
  }
  .board-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.5rem 0.625rem;
    border: 1px solid var(--sc-border);
    border-radius: 0.5rem;
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .tag {
    width: 28px;
    height: 6px;
    border-radius: 9999px;
  }
  .tag--0 {
    background-color: var(--md-sys-color-primary);
  }
  .tag--1 {
    background-color: var(--md-sys-color-tertiary);
  }
  .tag--2 {
    background-color: var(--md-sys-color-outline);
  }
  .avatar-dot {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    width: 12px;
    height: 12px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-primary-container);
  }

  /* Flow */
  .flow {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.25rem 0 0 8%;
  }
  .flow-node {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 62%;
    padding: 0.625rem 0.75rem;
    border: 1px solid var(--sc-border);
    border-radius: 0.625rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  .flow-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
  }
  .flow-icon--primary {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .flow-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.375rem;
  }
  .flow-link {
    width: 1px;
    height: 18px;
    margin-left: 1.5rem;
    background-color: var(--md-sys-color-outline-variant);
  }

  /* Dashboard */
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.625rem;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.625rem;
    border: 1px solid var(--sc-border);
    border-radius: 0.625rem;
  }
  .stat-value {
    width: 60%;
    height: 12px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .stat-value--primary {
    background-color: var(--md-sys-color-primary);
  }
  .chart {
    display: flex;
    flex: 1;
    align-items: flex-end;
    gap: 5px;
    min-height: 60px;
    padding: 0.75rem 0.625rem 0;
    border: 1px solid var(--sc-border);
    border-radius: 0.625rem;
  }
  .bar {
    flex: 1;
    border-radius: 4px 4px 0 0;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  }
  .bar--accent {
    background-color: var(--md-sys-color-primary);
  }

  /* List */
  .rows {
    display: flex;
    flex-direction: column;
  }
  .flow {
    flex: 1;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0;
    border-bottom: 1px solid var(--sc-border);
  }
  .row-avatar {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 9999px;
    background: linear-gradient(135deg, var(--md-sys-color-primary-container), color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent));
  }
  .row-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.375rem;
    min-width: 0;
  }
</style>
