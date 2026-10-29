<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface StatItem {
    value: string;
    label: string;
    detail?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Small centered caption above the metrics. */
    sectionTitle?: string;
    stats?: StatItem[];
    class?: string;
  }

  let { sectionTitle = '', stats = [], class: className = '', ...rest }: Props = $props();
</script>

<section {...rest} class={['stats', className]}>
  <div class="md-container md-container--xl">
    {#if sectionTitle}
      <p class="caption" data-prop="sectionTitle">{sectionTitle}</p>
    {/if}
    {#if stats.length > 0}
      <dl class="panel">
        {#each stats as stat, index (index)}
          <div class="stat">
            <dt class="label" data-prop={`stats.${index}.label`}>{stat.label}</dt>
            <dd class="value" data-prop={`stats.${index}.value`}>{stat.value}</dd>
            {#if stat.detail}
              <dd class="detail" data-prop={`stats.${index}.detail`}>{stat.detail}</dd>
            {/if}
          </div>
        {/each}
      </dl>
    {/if}
  </div>
</section>

<style>
  .stats {
    width: 100%;
    padding: 4rem 0;
    background-color: var(--md-sys-color-surface);
  }
  .caption {
    margin: 0 auto 2rem;
    max-width: 40rem;
    text-align: center;
    font-size: 0.875rem;
    line-height: 1.5;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: balance;
  }
  .panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1);
  }
  .stat {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 1.75rem 1.5rem;
    /* Hairline dividers: every item draws a top + left rule; the panel clips the outer edges. */
    box-shadow:
      -1px 0 0 0 var(--md-sys-color-outline-variant),
      0 -1px 0 0 var(--md-sys-color-outline-variant);
  }
  /* Visual order: value first, then label and detail (the DOM keeps dt before dd). */
  .value {
    order: -1;
    font-family: var(--md-sys-font-heading);
    font-size: clamp(2.125rem, 1.8rem + 1vw, 2.625rem);
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: var(--md-sys-tracking-tight, -0.022em);
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 0.625rem;
  }
  .label {
    font-size: 0.9375rem;
    line-height: 1.4;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .detail {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
  @media (min-width: 640px) {
    .panel {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .stat {
      padding: 2rem 1.75rem;
    }
  }
  @media (min-width: 1024px) {
    .stats {
      padding: 4.5rem 0;
    }
    .panel {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .stat {
      padding: 2rem;
    }
  }
</style>
