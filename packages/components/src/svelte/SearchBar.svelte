<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';
  import { requestNavigation } from './lib/navigation.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    placeholder?: string;
    buttonText?: string;
    variant?: 'inline' | 'pill' | 'minimal';
    /** Results page the query is sent to (GET). */
    actionHref?: string;
    /** Query-string parameter that carries the search term. */
    paramName?: string;
    suggestionsLabel?: string;
    suggestions?: string[];
    class?: string;
  }

  let {
    placeholder = 'Search',
    buttonText = 'Search',
    variant = 'pill',
    actionHref = '/search',
    paramName = 'q',
    suggestionsLabel = '',
    suggestions = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const fallbackId = $props.id();
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `search-${nodeId}` : fallbackId;
  });

  /** Only simple tokens are valid parameter names; anything else falls back to `q`. */
  const param = $derived(/^[A-Za-z_][A-Za-z0-9_.-]{0,39}$/.test(paramName) ? paramName : 'q');
  const action = $derived(safeHref(actionHref));
  const chips = $derived((Array.isArray(suggestions) ? suggestions : []).map((s) => String(s)).filter((s) => s.trim() !== ''));
  const accessibleLabel = $derived(buttonText.trim() || 'Search');

  let query = $state('');
  let inputEl: HTMLInputElement | undefined = $state();

  /** `/search` + `q` + `api keys` → `/search?q=api%20keys` (keeps an existing query/hash). */
  function resultsUrl(term: string): string {
    const encoded = `${encodeURIComponent(param)}=${encodeURIComponent(term)}`;
    if (action === '#') return `?${encoded}`;
    const hashIndex = action.indexOf('#');
    const base = hashIndex === -1 ? action : action.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : action.slice(hashIndex);
    return `${base}${base.includes('?') ? '&' : '?'}${encoded}${hash}`;
  }

  function go(form: HTMLFormElement, term: string) {
    const value = term.trim();
    if (!value) {
      inputEl?.focus();
      return;
    }
    requestNavigation(form, resultsUrl(value));
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    go(event.currentTarget as HTMLFormElement, query);
  }

  function pick(event: MouseEvent, term: string) {
    query = term;
    const form = (event.currentTarget as HTMLElement).closest('form');
    if (form) go(form, term);
  }
</script>

<form
  {...rest}
  role="search"
  class={['search', `search--${variant}`, className]}
  action={action === '#' ? undefined : action}
  method="get"
  aria-label={accessibleLabel}
  onsubmit={handleSubmit}
>
  <div class="field">
    <label for="{uid}-input" class="sr-only">{accessibleLabel}</label>
    <div class="box">
      <Icon name="MagnifyingGlass" size={18} class="lead" />
      <input
        bind:this={inputEl}
        bind:value={query}
        id="{uid}-input"
        class="input"
        type="search"
        name={param}
        {placeholder}
        autocomplete="off"
        enterkeyhint="search"
        spellcheck="false"
      />
    </div>
    {#if buttonText}
      <button type="submit" class={['submit', variant === 'minimal' ? 'submit--text' : 'md-btn md-btn--filled']}>
        <span data-prop="buttonText">{buttonText}</span>
        {#if variant === 'minimal'}<Icon name="ArrowRight" size={16} />{/if}
      </button>
    {:else}
      <button type="submit" class="submit submit--icon" aria-label="Search">
        <Icon name="ArrowRight" size={18} />
      </button>
    {/if}
  </div>

  {#if chips.length > 0}
    <div class="suggestions">
      {#if suggestionsLabel}
        <span class="suggestions-label" data-prop="suggestionsLabel">{suggestionsLabel}</span>
      {/if}
      <ul class="chips">
        {#each chips as chip, index (index)}
          <li>
            <button type="button" class="chip" onclick={(event) => pick(event, chip)} data-prop={`suggestions.${index}`}>{chip}</button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</form>

<style>
  .search {
    width: 100%;
    max-width: 42rem;
    margin-inline: auto;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
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

  .field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .box {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }
  .box :global(.lead) {
    position: absolute;
    left: 1rem;
    color: var(--md-sys-color-on-surface-variant);
    pointer-events: none;
  }
  .input {
    width: 100%;
    min-width: 0;
    height: 48px;
    padding: 0 1rem 0 2.75rem;
    font-size: 1rem;
    color: var(--md-sys-color-on-surface);
    background: transparent;
    border: none;
    outline: none;
  }
  .input::placeholder {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 78%, transparent);
  }
  .input::-webkit-search-cancel-button {
    cursor: pointer;
  }
  .submit {
    flex-shrink: 0;
    font-weight: 600;
  }

  /* inline: bordered input + separate button */
  .search--inline .box {
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 45%, var(--md-sys-color-outline-variant));
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .search--inline .box:focus-within {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  }
  .search--inline .submit {
    height: 50px;
    padding: 0 1.5rem;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
  }

  /* pill: one rounded surface with the button inside */
  .search--pill .field {
    gap: 0.25rem;
    padding: 0.3125rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 85%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 10px 30px -12px rgba(0, 0, 0, 0.14);
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .search--pill .field:focus-within {
    border-color: var(--md-sys-color-primary);
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent),
      0 10px 30px -12px rgba(0, 0, 0, 0.14);
  }
  .search--pill .input {
    height: 44px;
  }
  .search--pill .submit {
    height: 44px;
    padding: 0 1.375rem;
  }

  /* minimal: underline field with a text action */
  .search--minimal .field {
    border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline) 55%, var(--md-sys-color-outline-variant));
    transition: border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .search--minimal .field:focus-within {
    border-bottom-color: var(--md-sys-color-primary);
    box-shadow: 0 1px 0 0 var(--md-sys-color-primary);
  }
  .search--minimal .box :global(.lead) {
    left: 0.125rem;
  }
  .search--minimal .input {
    padding-left: 2rem;
  }
  .submit--text {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 44px;
    padding: 0 0.25rem;
    font-size: 0.9375rem;
    color: var(--md-sys-color-primary);
  }
  .submit--text:hover {
    color: var(--md-sys-color-primary-hover, var(--md-sys-color-primary));
  }
  .submit--icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .search--minimal .submit--icon {
    background: none;
    color: var(--md-sys-color-primary);
  }

  /* suggestions */
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem 0.75rem;
    margin-top: 1rem;
  }
  .search--minimal .suggestions {
    justify-content: flex-start;
  }
  .suggestions-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    list-style: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0 0.875rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 85%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    transition:
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .chip:hover {
    color: var(--md-sys-color-on-surface);
    border-color: var(--md-sys-color-outline);
    background-color: var(--md-sys-color-surface-container-low);
  }

  @media (max-width: 767px) {
    .chip {
      min-height: 40px;
    }
    .search--inline .field {
      flex-direction: column;
      align-items: stretch;
    }
    .search--inline .submit {
      width: 100%;
    }
    .search--pill .submit {
      padding: 0 1.125rem;
    }
  }
</style>
