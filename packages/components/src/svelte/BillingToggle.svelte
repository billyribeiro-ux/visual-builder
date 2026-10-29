<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  type Period = 'monthly' | 'yearly';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    monthlyLabel?: string;
    yearlyLabel?: string;
    /** Savings badge next to the yearly option; hidden when empty. */
    badgeText?: string;
    defaultPeriod?: Period;
    align?: 'left' | 'center' | 'right';
    class?: string;
  }

  let {
    monthlyLabel = 'Monthly',
    yearlyLabel = 'Yearly',
    badgeText = 'Save 20%',
    defaultPeriod = 'monthly',
    align = 'center',
    class: className = '',
    ...rest
  }: Props = $props();

  /** Bubbling DOM event dispatched from the root on every change. */
  const EVENT_NAME = 'appviz:billing-period';

  const uid = $props.id();
  // Writable derived: follows `defaultPeriod` until the visitor picks a period.
  let period = $derived<Period>(defaultPeriod === 'yearly' ? 'yearly' : 'monthly');

  function select(event: Event, next: Period) {
    if (next === period) return;
    period = next;
    // The root carries data-period; the event is dispatched from it so listeners see the component.
    const root = (event.currentTarget as HTMLElement).closest('[data-period]');
    root?.dispatchEvent(new CustomEvent(EVENT_NAME, { bubbles: true, detail: { period: next } }));
  }
</script>

<div {...rest} class={['billing', `align-${align}`, className]} data-period={period}>
  <fieldset class="switch">
    <legend class="visually-hidden">Billing period</legend>
    <label class={['option', period === 'monthly' && 'option--active']}>
      <input
        class="radio"
        type="radio"
        name="{uid}-period"
        value="monthly"
        checked={period === 'monthly'}
        onchange={(event) => select(event, 'monthly')}
      />
      <span class="option-label" data-prop="monthlyLabel">{monthlyLabel}</span>
    </label>
    <label class={['option', period === 'yearly' && 'option--active']}>
      <input
        class="radio"
        type="radio"
        name="{uid}-period"
        value="yearly"
        checked={period === 'yearly'}
        onchange={(event) => select(event, 'yearly')}
      />
      <span class="option-label" data-prop="yearlyLabel">{yearlyLabel}</span>
      {#if badgeText}
        <span class="badge" data-prop="badgeText">{badgeText}</span>
      {/if}
    </label>
  </fieldset>
</div>

<style>
  .billing {
    display: flex;
    width: 100%;
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

  .switch {
    display: inline-flex;
    align-items: stretch;
    gap: 0.25rem;
    min-width: 0;
    margin: 0;
    padding: 0.25rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container);
  }

  .option {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.5rem;
    padding: 0 1.125rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .option:hover {
    color: var(--md-sys-color-on-surface);
  }
  .option--active {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.12);
  }
  .option:has(.radio:focus-visible) {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }

  /* Native radios stay in the accessibility tree and keyboard order; only the dot is hidden. */
  .radio {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1875rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.02em;
    color: var(--md-sys-color-on-success-container, var(--md-sys-color-on-tertiary-container));
    background-color: var(--md-sys-color-success-container, var(--md-sys-color-tertiary-container));
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 767px) {
    .option {
      padding: 0 0.875rem;
    }
  }
</style>
