<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    badgeText?: string;
    /** Small reassurance line under the buttons (trial terms, compliance…). */
    proofText?: string;
    align?: 'left' | 'center';
    /** Decorative product preview beside (or below) the copy. */
    visual?: 'app' | 'none';
    class?: string;
  }

  let {
    eyebrow = '',
    title = 'Know what changed, why, and what to do next.',
    subtitle = 'Bring product, revenue and infrastructure metrics into one live workspace.',
    primaryCtaText = 'Start free trial',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = 'View pricing',
    secondaryCtaHref = '/pricing',
    badgeText = '',
    proofText = '',
    align = 'left',
    visual = 'app',
    class: className = '',
    ...rest
  }: Props = $props();

  /** Unique per instance: the chart gradient id must not collide when several heroes render. */
  const uid = $props.id();
  const centered = $derived(align === 'center');
  const showVisual = $derived(visual !== 'none');

  // Decorative illustration data (shapes only — the preview contains no text).
  const BARS = [38, 52, 44, 66, 58, 74, 62, 81, 70, 88, 79, 94];
  const NAV_ROWS = [72, 56, 64, 48, 60];
  const TABLE_ROWS = [
    { name: 64, value: 40, tone: 'success' },
    { name: 52, value: 34, tone: 'primary' },
    { name: 70, value: 44, tone: 'warning' }
  ] as const;
</script>

<section {...rest} class={['hero', centered && 'hero--centered', className]}>
  <div class="backdrop" aria-hidden="true"></div>
  <div class="md-container md-container--xl inner">
    <div class={['layout', centered && 'layout--centered', !showVisual && 'layout--solo']}>
      <div class="copy">
        {#if badgeText}
          <div class="md-eyebrow md-eyebrow--pill badge">
            <Icon name="Sparkle" size={14} class="badge-icon" />
            <span data-prop="badgeText">{badgeText}</span>
          </div>
        {/if}
        {#if eyebrow}
          <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        <h1 class="title" data-prop="title">{title}</h1>
        {#if subtitle}
          <p class="subtitle" data-prop="subtitle">{subtitle}</p>
        {/if}
        <div class="actions">
          {#if primaryCtaText}
            <a href={safeHref(primaryCtaHref)} class="md-btn md-btn--lg md-btn--filled">
              <span data-prop="primaryCtaText">{primaryCtaText}</span>
              <Icon name="ArrowRight" size={16} />
            </a>
          {/if}
          {#if secondaryCtaText}
            <a href={safeHref(secondaryCtaHref)} class="md-btn md-btn--lg md-btn--outlined" data-prop="secondaryCtaText">
              {secondaryCtaText}
            </a>
          {/if}
        </div>
        {#if proofText}
          <p class="proof">
            <Icon name="CheckCircle" size={16} class="proof-icon" />
            <span data-prop="proofText">{proofText}</span>
          </p>
        {/if}
      </div>

      {#if showVisual}
        <div class="visual" aria-hidden="true">
          <div class="window">
            <div class="chrome">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
              <span class="address"></span>
            </div>
            <div class="app">
              <div class="side">
                <span class="side-brand"></span>
                {#each NAV_ROWS as width, i (i)}
                  <span class={['side-row', i === 0 && 'side-row--active']}>
                    <span class="side-icon"></span>
                    <span class="bar" style:width="{width}%"></span>
                  </span>
                {/each}
              </div>
              <div class="main">
                <div class="main-head">
                  <span class="bar bar--title"></span>
                  <span class="head-tools">
                    <span class="chip"></span>
                    <span class="btn-shape"></span>
                  </span>
                </div>
                <div class="kpis">
                  {#each [0, 1, 2] as k (k)}
                    <div class="kpi">
                      <span class="bar bar--label"></span>
                      <span class="bar bar--value" style:width="{58 + k * 9}%"></span>
                      <span class={['delta', k === 2 && 'delta--down']}></span>
                    </div>
                  {/each}
                </div>
                <div class="chart">
                  <div class="chart-head">
                    <span class="bar bar--label"></span>
                    <span class="legend"><span class="legend-dot"></span><span class="legend-dot legend-dot--muted"></span></span>
                  </div>
                  <svg class="chart-svg" viewBox="0 0 320 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="{uid}-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" class="stop-a" />
                        <stop offset="100%" class="stop-b" />
                      </linearGradient>
                    </defs>
                    <path class="grid-line" d="M0 30H320M0 60H320M0 90H320" />
                    <path
                      class="area"
                      fill="url(#{uid}-fill)"
                      d="M0 96 C 24 92, 40 80, 64 82 S 104 64, 128 68 S 168 50, 192 54 S 232 30, 256 36 S 296 18, 320 14 L 320 120 L 0 120 Z"
                    />
                    <path class="line line--muted" d="M0 104 C 32 100, 56 96, 88 94 S 152 84, 184 86 S 248 72, 280 70 S 308 66, 320 64" />
                    <path class="line" d="M0 96 C 24 92, 40 80, 64 82 S 104 64, 128 68 S 168 50, 192 54 S 232 30, 256 36 S 296 18, 320 14" />
                  </svg>
                  <div class="bars">
                    {#each BARS as h, i (i)}
                      <span class="col" style:height="{h}%"></span>
                    {/each}
                  </div>
                </div>
                <div class="rows">
                  {#each TABLE_ROWS as row, i (i)}
                    <div class="row">
                      <span class="avatar"></span>
                      <span class="bar" style:width="{row.name}%"></span>
                      <span class="bar bar--num" style:width="{row.value}px"></span>
                      <span class={['pill', `pill--${row.tone}`]}></span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
          <div class="float-card">
            <span class="float-icon"><Icon name="Lightning" size={16} /></span>
            <span class="float-lines">
              <span class="bar bar--float-a"></span>
              <span class="bar bar--float-b"></span>
            </span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding: clamp(3.5rem, 2rem + 5vw, 7rem) 0 clamp(3rem, 1.5rem + 3vw, 4.5rem);
    background-color: var(--md-sys-color-surface);
  }
  .backdrop {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(60% 55% at 78% 8%, color-mix(in srgb, var(--md-sys-color-primary) 13%, transparent), transparent 70%),
      radial-gradient(45% 45% at 8% 0%, color-mix(in srgb, var(--md-sys-color-tertiary) 7%, transparent), transparent 70%);
  }
  .backdrop::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: radial-gradient(70% 60% at 50% 0%, #000 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(70% 60% at 50% 0%, #000 0%, transparent 75%);
    opacity: 0.55;
  }
  .hero--centered .backdrop {
    background:
      radial-gradient(55% 50% at 50% 0%, color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent), transparent 72%);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(3rem, 2rem + 3vw, 4.5rem);
    align-items: center;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
      gap: 4rem;
    }
    .layout--solo {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .layout--centered,
  .layout--solo {
    justify-items: center;
  }
  @media (min-width: 1024px) {
    .layout--centered {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }
  .layout--centered .copy,
  .layout--solo .copy {
    align-items: center;
    max-width: 52rem;
    margin: 0 auto;
    text-align: center;
  }

  .badge {
    margin-bottom: 1.5rem;
    max-width: 100%;
  }
  .badge span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge :global(.badge-icon) {
    color: var(--md-sys-color-primary);
  }
  .eyebrow {
    margin-bottom: 1rem;
  }
  .title {
    font-size: clamp(2.375rem, 1.55rem + 2.75vw, 3.625rem);
    line-height: 1.06;
    font-weight: 700;
    letter-spacing: var(--md-sys-tracking-tighter, -0.035em);
    color: var(--md-sys-color-on-surface);
    margin-bottom: 1.5rem;
    max-width: 16em;
  }
  .layout--centered .title,
  .layout--solo .title {
    font-size: var(--md-sys-font-size-display, clamp(2.5rem, 1.75rem + 3.2vw, 4.5rem));
    max-width: 20ch;
  }
  .subtitle {
    font-size: var(--md-sys-font-size-lead, 1.125rem);
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    max-width: 36rem;
    margin-bottom: 2.25rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .layout--centered .actions,
  .layout--solo .actions {
    justify-content: center;
  }
  .proof {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .proof :global(.proof-icon) {
    color: var(--md-sys-color-success);
  }
  @media (max-width: 479px) {
    .actions {
      width: 100%;
    }
    .actions .md-btn {
      flex: 1 1 100%;
    }
  }

  /* ------------------------------------------------------------------ preview */
  .visual {
    position: relative;
    width: 100%;
    min-width: 0;
  }
  .visual::before {
    content: '';
    position: absolute;
    inset: 8% -6% -10% 6%;
    z-index: -1;
    border-radius: 40px;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent), transparent);
    filter: blur(24px);
    pointer-events: none;
  }
  .layout--centered .visual {
    max-width: 65rem;
    margin: 0 auto;
  }
  .window {
    position: relative;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-large, 20px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--md-sys-color-surface-container) 60%, transparent),
      var(--md-sys-elevation-level5);
    overflow: hidden;
  }
  .chrome {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-outline);
  }
  .address {
    flex: 0 1 38%;
    height: 16px;
    margin-left: auto;
    margin-right: auto;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 6px;
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .app {
    display: grid;
    grid-template-columns: 22% minmax(0, 1fr);
    min-height: 0;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 12px;
    border-right: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .side-brand {
    width: 52%;
    height: 12px;
    margin: 2px 6px 10px;
    border-radius: 4px;
    background-color: var(--md-sys-color-on-surface);
    opacity: 0.82;
  }
  .side-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 26px;
    padding: 0 8px;
    border-radius: 7px;
  }
  .side-row--active {
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1), 0 0 0 1px var(--md-sys-color-outline-variant);
  }
  .side-icon {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
    border-radius: 3px;
    background-color: var(--md-sys-color-outline);
  }
  .side-row--active .side-icon {
    background-color: var(--md-sys-color-primary);
  }
  .bar {
    display: block;
    height: 7px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-highest);
  }
  .main {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    min-width: 0;
  }
  .main-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .bar--title {
    width: 34%;
    height: 11px;
    background-color: var(--md-sys-color-on-surface);
    opacity: 0.85;
  }
  .head-tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chip {
    width: 54px;
    height: 22px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 6px;
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .btn-shape {
    width: 46px;
    height: 22px;
    border-radius: 6px;
    background-color: var(--md-sys-color-primary);
  }
  .kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .kpi {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 12px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 10px;
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .bar--label {
    width: 46%;
    height: 6px;
  }
  .bar--value {
    height: 12px;
    background-color: var(--md-sys-color-on-surface);
    opacity: 0.78;
  }
  .delta {
    width: 34px;
    height: 12px;
    border-radius: 9999px;
    background-color: color-mix(in srgb, var(--md-sys-color-success) 22%, var(--md-sys-color-surface-container-lowest));
  }
  .delta--down {
    background-color: color-mix(in srgb, var(--md-sys-color-error) 18%, var(--md-sys-color-surface-container-lowest));
  }
  .chart {
    position: relative;
    padding: 12px 12px 10px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 10px;
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .chart-head .bar--label {
    width: 22%;
  }
  .legend {
    display: flex;
    gap: 6px;
  }
  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-primary);
  }
  .legend-dot--muted {
    background-color: var(--md-sys-color-outline);
  }
  .chart-svg {
    display: block;
    width: 100%;
    height: clamp(84px, 9vw, 128px);
    overflow: visible;
  }
  .stop-a {
    stop-color: var(--md-sys-color-primary);
    stop-opacity: 0.22;
  }
  .stop-b {
    stop-color: var(--md-sys-color-primary);
    stop-opacity: 0;
  }
  .grid-line {
    fill: none;
    stroke: var(--md-sys-color-outline-variant);
    stroke-width: 1;
    stroke-dasharray: 3 4;
    vector-effect: non-scaling-stroke;
  }
  .line {
    fill: none;
    stroke: var(--md-sys-color-primary);
    stroke-width: 2.25;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
  .line--muted {
    stroke: var(--md-sys-color-outline);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 26px;
    margin-top: 8px;
  }
  .col {
    flex: 1;
    border-radius: 3px 3px 1px 1px;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 26%, var(--md-sys-color-surface-container-lowest));
  }
  .col:nth-child(4n) {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 55%, var(--md-sys-color-surface-container-lowest));
  }
  .rows {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 10px;
    overflow: hidden;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 12px;
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .row + .row {
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .row .bar {
    flex: 0 1 auto;
  }
  .avatar {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 9999px;
    background-color: var(--md-sys-color-primary-container);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent);
  }
  .bar--num {
    margin-left: auto;
    background-color: var(--md-sys-color-outline);
  }
  .pill {
    width: 40px;
    height: 14px;
    flex-shrink: 0;
    border-radius: 9999px;
  }
  .pill--success {
    background-color: color-mix(in srgb, var(--md-sys-color-success) 22%, var(--md-sys-color-surface-container-lowest));
  }
  .pill--primary {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 18%, var(--md-sys-color-surface-container-lowest));
  }
  .pill--warning {
    background-color: color-mix(in srgb, var(--md-sys-color-warning) 24%, var(--md-sys-color-surface-container-lowest));
  }

  .float-card {
    position: absolute;
    left: -1.25rem;
    bottom: 2.25rem;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(220px, 46%);
    padding: 12px 14px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 12px;
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 92%, transparent);
    box-shadow: var(--md-sys-elevation-level4);
    backdrop-filter: blur(8px);
  }
  .float-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 8px;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .float-lines {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 7px;
  }
  .bar--float-a {
    width: 82%;
    background-color: var(--md-sys-color-on-surface);
    opacity: 0.75;
  }
  .bar--float-b {
    width: 58%;
  }
  .layout--centered .float-card {
    left: auto;
    right: -1rem;
    bottom: 1.5rem;
  }

  @media (max-width: 1023px) {
    .float-card {
      left: 0.75rem;
      bottom: -1.25rem;
    }
    .layout--centered .float-card {
      right: 0.75rem;
      bottom: -1.25rem;
    }
  }
  @media (max-width: 639px) {
    .app {
      grid-template-columns: minmax(0, 1fr);
    }
    .side {
      display: none;
    }
    .main {
      padding: 14px;
      gap: 12px;
    }
    .kpi {
      padding: 10px;
    }
    .rows .row:nth-child(3) {
      display: none;
    }
    .float-card {
      display: none;
    }
  }
</style>
