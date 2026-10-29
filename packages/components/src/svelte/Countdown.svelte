<script lang="ts" module>
  const ISO_DATE_TIME =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;

  /**
   * Strict ISO 8601 parser (UTC epoch ms, or `null` when invalid). A date-time without an offset
   * is read as UTC so the server and every visitor compute the same instant.
   */
  export function parseCountdownTarget(value: unknown): number | null {
    if (typeof value !== 'string') return null;
    const match = ISO_DATE_TIME.exec(value.trim());
    if (!match) return null;
    const [, y, mo, d, h = '0', mi = '0', s = '0', frac = '0', offset] = match;
    const year = Number(y);
    const month = Number(mo);
    const day = Number(d);
    const hour = Number(h);
    const minute = Number(mi);
    const second = Number(s);
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return null;
    const midnight = new Date(Date.UTC(year, month - 1, day));
    if (midnight.getUTCDate() !== day || midnight.getUTCMonth() !== month - 1) return null;
    let time = Date.UTC(year, month - 1, day, hour, minute, second, Number(frac.slice(0, 3).padEnd(3, '0')));
    if (offset && offset.toUpperCase() !== 'Z') {
      const digits = offset.slice(1).replace(':', '');
      const offsetHours = Number(digits.slice(0, 2));
      const offsetMinutes = Number(digits.slice(2, 4));
      if (offsetHours > 18 || offsetMinutes > 59) return null;
      const sign = offset.startsWith('-') ? -1 : 1;
      time -= sign * (offsetHours * 60 + offsetMinutes) * 60_000;
    }
    return Number.isFinite(time) ? time : null;
  }

  export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

  const UNIT_SECONDS: Record<CountdownUnit, number> = { days: 86_400, hours: 3_600, minutes: 60, seconds: 1 };
  const UNIT_ORDER: CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds'];

  /**
   * Splits the remaining time over the visible units: the largest visible unit absorbs hidden
   * larger units, hidden smaller units are dropped. No visible unit means all four.
   */
  export function splitRemaining(remainingMs: number, visible: Record<CountdownUnit, boolean>): Array<{ unit: CountdownUnit; value: number }> {
    const units = UNIT_ORDER.filter((unit) => visible[unit]);
    const shown = units.length > 0 ? units : UNIT_ORDER;
    let rest = Math.max(0, Math.floor(remainingMs / 1000));
    return shown.map((unit) => {
      const value = Math.floor(rest / UNIT_SECONDS[unit]);
      rest -= value * UNIT_SECONDS[unit];
      return { unit, value };
    });
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** ISO 8601 date-time to count down to (no offset = UTC). */
    target?: string;
    showDays?: boolean;
    showHours?: boolean;
    showMinutes?: boolean;
    showSeconds?: boolean;
    daysLabel?: string;
    hoursLabel?: string;
    minutesLabel?: string;
    secondsLabel?: string;
    variant?: 'boxes' | 'inline' | 'minimal';
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'center' | 'right';
    expiredText?: string;
    class?: string;
  }

  let {
    target = '2027-03-31T17:00:00Z',
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    daysLabel = 'Days',
    hoursLabel = 'Hours',
    minutesLabel = 'Minutes',
    secondsLabel = 'Seconds',
    variant = 'boxes',
    size = 'md',
    align = 'center',
    expiredText = 'This offer has ended.',
    class: className = '',
    ...rest
  }: Props = $props();

  const targetMs = $derived(parseCountdownTarget(target));

  /** Current time; `null` until mounted so the server render and hydration match ("--" placeholders). */
  let now = $state<number | null>(null);

  /** Attachment: re-renders on every second boundary until the target passes (cleared on unmount). */
  const clock: Attachment = () => {
    const end = targetMs;
    if (end === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const t = Date.now();
      now = t;
      // Re-align to the next second boundary on every tick (self-correcting under throttling).
      if (t < end) timer = setTimeout(tick, 1000 - (t % 1000) + 5);
    };
    tick();
    return () => clearTimeout(timer);
  };

  const expired = $derived(targetMs !== null && now !== null && now >= targetMs);
  const parts = $derived(
    splitRemaining(targetMs !== null && now !== null ? targetMs - now : 0, {
      days: showDays,
      hours: showHours,
      minutes: showMinutes,
      seconds: showSeconds
    })
  );

  function display(unit: CountdownUnit, value: number): string {
    if (now === null) return '--';
    return unit === 'days' && value >= 100 ? String(value) : String(value).padStart(2, '0');
  }
</script>

<div {...rest} {@attach clock} class={['countdown', `countdown--${variant}`, `countdown--${size}`, `align-${align}`, className]}>
  {#if targetMs === null}
    <p class="notice" role="note">
      Countdown paused: set a valid end date and time in ISO 8601 format, for example 2026-12-31T17:00:00Z. Current value:
      <code class="raw" data-prop="target">{target}</code>
    </p>
  {:else}
    {#if !expired}
      <div class="units" role="timer" aria-label="Time remaining">
        {#each parts as part, index (part.unit)}
          {#if variant === 'minimal' && index > 0}
            <span class="colon" aria-hidden="true">:</span>
          {/if}
          <div class="unit">
            <span class={['value', now === null && 'value--pending']}>{display(part.unit, part.value)}</span>
            {#if part.unit === 'days'}
              <span class="label" data-prop="daysLabel">{daysLabel}</span>
            {:else if part.unit === 'hours'}
              <span class="label" data-prop="hoursLabel">{hoursLabel}</span>
            {:else if part.unit === 'minutes'}
              <span class="label" data-prop="minutesLabel">{minutesLabel}</span>
            {:else}
              <span class="label" data-prop="secondsLabel">{secondsLabel}</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    <div class="status" aria-live="polite">
      {#if expired}
        <p class="expired" data-prop="expiredText">{expiredText}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .countdown {
    --cd-value: 2.5rem;
    --cd-label: 0.75rem;
    --cd-box: 6rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    color: var(--md-sys-color-on-surface);
  }
  .countdown--sm {
    --cd-value: 1.75rem;
    --cd-label: 0.6875rem;
    --cd-box: 4.75rem;
  }
  .countdown--lg {
    --cd-value: 3.5rem;
    --cd-label: 0.8125rem;
    --cd-box: 7.5rem;
  }
  .align-left {
    align-items: flex-start;
    text-align: left;
  }
  .align-center {
    align-items: center;
    text-align: center;
  }
  .align-right {
    align-items: flex-end;
    text-align: right;
  }

  .units {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 0.75rem;
  }
  .align-center .units {
    justify-content: center;
  }
  .align-right .units {
    justify-content: flex-end;
  }

  .unit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
  }
  .value {
    font-family: var(--md-sys-font-heading, inherit);
    font-size: var(--cd-value);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }
  .value--pending {
    color: var(--md-sys-color-outline-variant);
  }
  .label {
    font-size: var(--cd-label);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* ---- Boxes ----------------------------------------------------------- */
  .countdown--boxes .unit {
    min-width: var(--cd-box);
    justify-content: center;
    padding: 1.125rem 0.875rem 1rem 0.875rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 20px -14px rgba(0, 0, 0, 0.18);
  }

  /* ---- Inline ---------------------------------------------------------- */
  .countdown--inline .units {
    gap: 0.25rem 1rem;
    align-items: baseline;
  }
  .countdown--inline .unit {
    flex-direction: row;
    align-items: baseline;
    gap: 0.3125rem;
  }
  .countdown--inline .value {
    font-size: calc(var(--cd-value) * 0.6);
    letter-spacing: -0.02em;
  }
  .countdown--inline .label {
    font-size: calc(var(--cd-label) * 1.2);
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }

  /* ---- Minimal --------------------------------------------------------- */
  .countdown--minimal .units {
    gap: 0.75rem;
  }
  .countdown--minimal .value {
    font-size: calc(var(--cd-value) * 1.15);
  }
  .colon {
    align-self: flex-start;
    font-family: var(--md-sys-font-heading, inherit);
    font-size: calc(var(--cd-value) * 1.15);
    font-weight: 600;
    line-height: 1;
    color: var(--md-sys-color-outline);
  }

  /* ---- Messages -------------------------------------------------------- */
  .expired {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--md-sys-color-on-surface);
  }
  .notice {
    max-width: 40rem;
    padding: 0.875rem 1rem;
    border: 1px dashed var(--md-sys-color-outline);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-low);
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
    text-align: left;
  }
  .raw {
    padding: 0.0625rem 0.375rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-surface-container-high);
    font-family: var(--md-sys-font-mono, ui-monospace, monospace);
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface);
    overflow-wrap: anywhere;
  }

  @media (max-width: 767px) {
    .countdown {
      --cd-value: 1.875rem;
      --cd-box: 0;
    }
    .countdown--sm {
      --cd-value: 1.5rem;
    }
    .countdown--lg {
      --cd-value: 2.25rem;
    }
    .countdown--boxes .units {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(4.25rem, 1fr));
      width: 100%;
      max-width: 26rem;
      gap: 0.5rem;
    }
    .countdown--boxes .unit {
      padding: 0.875rem 0.375rem 0.75rem 0.375rem;
      border-radius: var(--md-sys-shape-corner-medium, 12px);
    }
    .countdown--boxes .label {
      font-size: 0.625rem;
      letter-spacing: 0.06em;
    }
    .countdown--minimal .units {
      gap: 0.5rem;
    }
  }
</style>
