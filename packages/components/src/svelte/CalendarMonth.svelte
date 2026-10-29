<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

  interface CalendarEvent {
    /** YYYY-MM-DD */
    date: string;
    title: string;
    tone?: Tone;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Initially visible month, YYYY-MM. */
    month?: string;
    /** Reference "today", YYYY-MM-DD (fixed by default so server and client render identically). */
    today?: string;
    events?: CalendarEvent[];
    weekStartsOn?: 'sunday' | 'monday';
    class?: string;
  }

  let {
    month = '2026-10',
    today = '2026-10-28',
    events = [],
    weekStartsOn = 'sunday',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const TONES: readonly Tone[] = ['primary', 'success', 'warning', 'danger', 'neutral', 'violet'];
  const MAX_PILLS = 2;

  /* ------------------------------------------------------------------ UTC date helpers (no clock, no locale) */

  function pad(n: number): string {
    return String(n).padStart(2, '0');
  }
  function toIso(y: number, m: number, d: number): string {
    const date = new Date(Date.UTC(y, m, d));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }
  function parseIso(value: unknown): { y: number; m: number; d: number } | null {
    const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
    if (!match) return null;
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const d = Number(match[3]);
    return toIso(y, m, d) === value ? { y, m, d } : null;
  }
  function parseMonth(value: unknown): { y: number; m: number } | null {
    const match = typeof value === 'string' ? /^(\d{4})-(\d{2})$/.exec(value) : null;
    if (!match) return null;
    const m = Number(match[2]) - 1;
    return m >= 0 && m <= 11 ? { y: Number(match[1]), m } : null;
  }
  function addDays(iso: string, days: number): string {
    const p = parseIso(iso);
    return p ? toIso(p.y, p.m, p.d + days) : iso;
  }
  function addMonthsClamped(iso: string, months: number): string {
    const p = parseIso(iso);
    if (!p) return iso;
    const lastDay = new Date(Date.UTC(p.y, p.m + months + 1, 0)).getUTCDate();
    return toIso(p.y, p.m + months, Math.min(p.d, lastDay));
  }
  function weekday(iso: string): number {
    const p = parseIso(iso);
    return p ? new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay() : 0;
  }
  function longDate(iso: string): string {
    const p = parseIso(iso);
    return p ? `${DAYS[weekday(iso)]}, ${MONTHS[p.m]} ${p.d}, ${p.y}` : iso;
  }

  /* ------------------------------------------------------------------ state */

  const todayIso = $derived(parseIso(today) ? today : '2026-10-28');
  const startDay = $derived(weekStartsOn === 'monday' ? 1 : 0);

  /** Visible month: initialised from props, re-initialised when `month`/`today` change. */
  let view = $derived.by(() => {
    const fromProp = parseMonth(month);
    if (fromProp) return fromProp;
    const t = parseIso(todayIso)!;
    return { y: t.y, m: t.m };
  });
  let focusDate = $state<string | null>(null);
  let selectedDate = $state<string | null>(null);

  const viewKey = $derived(`${view.y}-${pad(view.m + 1)}`);
  const firstOfMonth = $derived(toIso(view.y, view.m, 1));
  const monthLabel = $derived(`${MONTHS[view.m]} ${view.y}`);

  type DayEvent = { title: string; tone: Tone; index: number };

  /** Valid events grouped by date (YYYY-MM-DD), in input order. */
  const eventsByDate = $derived.by(() => {
    const byDate: Record<string, DayEvent[]> = {};
    (Array.isArray(events) ? events : []).forEach((event, index) => {
      if (!event || !parseIso(event.date) || typeof event.title !== 'string') return;
      const tone: Tone = TONES.includes(event.tone as Tone) ? (event.tone as Tone) : 'primary';
      (byDate[event.date] ??= []).push({ title: event.title, tone, index });
    });
    return byDate;
  });

  const weeks = $derived.by(() => {
    const offset = (weekday(firstOfMonth) - startDay + 7) % 7;
    const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
    const start = addDays(firstOfMonth, -offset);
    const rows: Array<Array<{ iso: string; day: number; inMonth: boolean; events: DayEvent[] }>> = [];
    for (let i = 0; i < cellCount; i++) {
      const iso = addDays(start, i);
      const p = parseIso(iso)!;
      if (i % 7 === 0) rows.push([]);
      rows[rows.length - 1].push({ iso, day: p.d, inMonth: p.m === view.m && p.y === view.y, events: Object.hasOwn(eventsByDate, iso) ? eventsByDate[iso] : [] });
    }
    return rows;
  });

  const weekdayHeaders = $derived(Array.from({ length: 7 }, (_, i) => DAYS[(i + startDay) % 7]));

  /** The one date in the tab order (roving tabindex). */
  const activeDate = $derived.by(() => {
    if (focusDate && focusDate.startsWith(viewKey)) return focusDate;
    if (selectedDate && selectedDate.startsWith(viewKey)) return selectedDate;
    if (todayIso.startsWith(viewKey)) return todayIso;
    return firstOfMonth;
  });

  const agenda = $derived(
    Object.entries(eventsByDate)
      .filter(([iso]) => iso.startsWith(viewKey))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([iso, list]) => ({ iso, label: longDate(iso), events: list }))
  );

  /* ------------------------------------------------------------------ navigation */

  function showMonth(delta: number) {
    const next = new Date(Date.UTC(view.y, view.m + delta, 1));
    view = { y: next.getUTCFullYear(), m: next.getUTCMonth() };
    focusDate = null;
  }

  function goToday() {
    const t = parseIso(todayIso)!;
    view = { y: t.y, m: t.m };
    focusDate = todayIso;
    selectedDate = todayIso;
  }

  async function moveFocus(iso: string) {
    const p = parseIso(iso);
    if (!p) return;
    if (p.y !== view.y || p.m !== view.m) view = { y: p.y, m: p.m };
    focusDate = iso;
    await tick();
    document.getElementById(`${uid}-d-${iso}`)?.focus();
  }

  function select(iso: string) {
    selectedDate = iso;
    moveFocus(iso);
  }

  function handleCellKeydown(event: KeyboardEvent, iso: string) {
    const dow = (weekday(iso) - startDay + 7) % 7;
    let target: string | null = null;
    switch (event.key) {
      case 'ArrowLeft':
        target = addDays(iso, -1);
        break;
      case 'ArrowRight':
        target = addDays(iso, 1);
        break;
      case 'ArrowUp':
        target = addDays(iso, -7);
        break;
      case 'ArrowDown':
        target = addDays(iso, 7);
        break;
      case 'Home':
        target = addDays(iso, -dow);
        break;
      case 'End':
        target = addDays(iso, 6 - dow);
        break;
      case 'PageUp':
        target = addMonthsClamped(iso, -1);
        break;
      case 'PageDown':
        target = addMonthsClamped(iso, 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        select(iso);
        return;
      default:
        return;
    }
    event.preventDefault();
    moveFocus(target);
  }

  function cellLabel(iso: string, list: Array<{ title: string }>): string {
    const base = `${longDate(iso)}${iso === todayIso ? ', today' : ''}`;
    if (!list.length) return `${base}, no events`;
    return `${base}, ${list.length} ${list.length === 1 ? 'event' : 'events'}: ${list.map((e) => e.title).join(', ')}`;
  }
</script>

<section {...rest} class={['calendar', className]}>
  <header class="header">
    <h3 class="month" id="{uid}-label" aria-live="polite">{monthLabel}</h3>
    <div class="controls">
      <button type="button" class="today-btn" onclick={goToday}>Today</button>
      <button type="button" class="nav-btn" aria-label="Previous month" onclick={() => showMonth(-1)}>
        <Icon name="CaretLeft" size={16} />
      </button>
      <button type="button" class="nav-btn" aria-label="Next month" onclick={() => showMonth(1)}>
        <Icon name="CaretRight" size={16} />
      </button>
    </div>
  </header>

  <div class="grid" role="grid" aria-labelledby="{uid}-label">
    <div class="row weekdays" role="row">
      {#each weekdayHeaders as name (name)}
        <div class="weekday" role="columnheader">
          <abbr title={name}>{name.slice(0, 3)}</abbr>
        </div>
      {/each}
    </div>
    {#each weeks as week (week[0].iso)}
      <div class="row" role="row">
        {#each week as cell (cell.iso)}
          <div
            id="{uid}-d-{cell.iso}"
            class={['cell', !cell.inMonth && 'is-outside', cell.iso === todayIso && 'is-today', cell.iso === selectedDate && 'is-selected']}
            role="gridcell"
            tabindex={cell.iso === activeDate ? 0 : -1}
            aria-selected={cell.iso === selectedDate}
            aria-current={cell.iso === todayIso ? 'date' : undefined}
            aria-label={cellLabel(cell.iso, cell.events)}
            onclick={() => select(cell.iso)}
            onkeydown={(event) => handleCellKeydown(event, cell.iso)}
          >
            <span class="day" aria-hidden="true">{cell.day}</span>
            {#if cell.events.length}
              <span class="pills" aria-hidden="true">
                {#each cell.events.slice(0, MAX_PILLS) as event (event.index)}
                  <span class={['pill', `tone-${event.tone}`]} data-prop={`events.${event.index}.title`}>{event.title}</span>
                {/each}
                {#if cell.events.length > MAX_PILLS}
                  <span class="more">+{cell.events.length - MAX_PILLS} more</span>
                {/if}
              </span>
              <span class="dots" aria-hidden="true">
                {#each cell.events.slice(0, 3) as event (event.index)}
                  <span class={['dot', `tone-${event.tone}`]}></span>
                {/each}
              </span>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>

  <div class="agenda">
    <h4 class="agenda-title">Events in {MONTHS[view.m]}</h4>
    {#if agenda.length === 0}
      <p class="agenda-empty">No events this month.</p>
    {:else}
      <ol class="agenda-list">
        {#each agenda as day (day.iso)}
          <li class={['agenda-day', day.iso === selectedDate && 'is-selected']}>
            <p class="agenda-date">
              <time datetime={day.iso}>{day.label}</time>
              {#if day.iso === todayIso}<span class="today-tag">Today</span>{/if}
            </p>
            <ul class="agenda-events">
              {#each day.events as event (event.index)}
                <li class="agenda-event">
                  <span class={['bar', `tone-${event.tone}`]} aria-hidden="true"></span>
                  <span>{event.title}</span>
                </li>
              {/each}
            </ul>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</section>

<style>
  .calendar {
    --cal-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    min-width: 0;
    border: 1px solid var(--cal-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--cal-border);
  }
  .month {
    font-size: 1rem;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .today-btn,
  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2.25rem;
    border: 1px solid var(--cal-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    font-size: 0.8125rem;
    font-weight: 600;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .today-btn {
    padding: 0 0.875rem;
    margin-right: 0.25rem;
  }
  .nav-btn {
    width: 2.25rem;
  }
  .today-btn:hover,
  .nav-btn:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .grid {
    display: grid;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .weekdays {
    border-bottom: 1px solid var(--cal-border);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .weekday {
    padding: 0.5rem 0.75rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }
  .weekday abbr {
    text-decoration: none;
  }
  .cell {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    min-height: 6.5rem;
    padding: 0.375rem 0.5rem 0.5rem;
    border-right: 1px solid var(--cal-border);
    border-bottom: 1px solid var(--cal-border);
    cursor: pointer;
    outline: none;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .row .cell:last-child {
    border-right: 0;
  }
  .row:last-child .cell {
    border-bottom: 0;
  }
  .cell:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .cell:focus-visible {
    box-shadow: inset 0 0 0 2px var(--md-sys-color-primary);
  }
  .cell.is-selected {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 7%, transparent);
  }
  .cell.is-outside {
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-low) 60%, transparent);
  }
  .cell.is-outside .day {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 70%, transparent);
  }
  .day {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    min-width: 1.625rem;
    height: 1.625rem;
    padding: 0 0.25rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.8125rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .is-today .day {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-weight: 650;
  }
  .pills {
    display: flex;
    flex-direction: column;
    gap: 0.1875rem;
    min-width: 0;
  }
  .pill {
    position: relative;
    display: block;
    padding: 0.0625rem 0.375rem 0.0625rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: color-mix(in srgb, var(--tone) 11%, var(--md-sys-color-surface-container-lowest));
    color: var(--md-sys-color-on-surface);
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.125rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pill::before {
    content: '';
    position: absolute;
    left: 0.1875rem;
    top: 0.25rem;
    bottom: 0.25rem;
    width: 2px;
    border-radius: 1px;
    background-color: var(--tone);
  }
  .more {
    padding-left: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
  }
  .dots {
    display: none;
    gap: 0.1875rem;
    justify-content: center;
  }
  .dot {
    width: 0.3125rem;
    height: 0.3125rem;
    border-radius: 50%;
    background-color: var(--tone);
  }
  .tone-primary { --tone: var(--md-sys-color-primary); }
  .tone-success { --tone: var(--md-sys-color-success); }
  .tone-warning { --tone: var(--md-sys-color-warning, #B26A00); }
  .tone-danger { --tone: var(--md-sys-color-error); }
  .tone-neutral { --tone: var(--md-sys-color-outline); }
  .tone-violet { --tone: var(--md-sys-color-violet, #6E56CF); }

  .agenda {
    display: none;
    padding: 1rem 1.25rem 1.25rem;
    border-top: 1px solid var(--cal-border);
  }
  .agenda-title {
    margin-bottom: 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }
  .agenda-empty {
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .agenda-list {
    display: grid;
    gap: 0.75rem;
    list-style: none;
  }
  .agenda-day {
    padding: 0.5rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
  }
  .agenda-day.is-selected {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 7%, transparent);
  }
  .agenda-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .today-tag {
    padding: 0 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-size: 0.6875rem;
    line-height: 1.125rem;
  }
  .agenda-events {
    display: grid;
    gap: 0.25rem;
    list-style: none;
  }
  .agenda-event {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .bar {
    flex-shrink: 0;
    width: 3px;
    height: 1rem;
    border-radius: 2px;
    background-color: var(--tone);
  }

  @media (max-width: 767px) {
    .header {
      padding: 0.75rem 1rem;
    }
    .today-btn,
    .nav-btn {
      height: 2.5rem;
    }
    .nav-btn {
      width: 2.5rem;
    }
    .weekday {
      padding: 0.5rem 0;
      text-align: center;
    }
    .cell {
      align-items: center;
      min-height: 3rem;
      padding: 0.25rem 0;
      border-right: 0;
      border-bottom: 0;
    }
    .day {
      align-self: center;
      min-width: 2rem;
      height: 2rem;
    }
    .pills {
      display: none;
    }
    .dots {
      display: flex;
    }
    .cell.is-outside {
      background-color: transparent;
    }
    .cell.is-selected {
      background-color: transparent;
    }
    .cell.is-selected:not(.is-today) .day {
      box-shadow: inset 0 0 0 1.5px var(--md-sys-color-primary);
      color: var(--md-sys-color-primary);
    }
    .agenda {
      display: block;
    }
  }
</style>
