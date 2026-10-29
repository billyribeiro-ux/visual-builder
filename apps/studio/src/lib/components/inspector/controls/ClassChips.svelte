<script lang="ts">
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import InlineMessage from './InlineMessage.svelte';

  interface Props {
    /** Space-separated class list. */
    value: string;
    onchange: (value: string) => void;
    id?: string;
  }

  let { value, onchange, id }: Props = $props();

  const CLASS_RE = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

  const classes = $derived([...new Set(value.split(/\s+/).filter(Boolean))]);
  let draft = $state('');
  let error = $state('');

  function add(raw: string) {
    const parts = raw.split(/[\s,]+/).map((p) => p.trim().replace(/^\./, '')).filter(Boolean);
    if (parts.length === 0) return;
    const bad = parts.find((p) => !CLASS_RE.test(p));
    if (bad) {
      error = `“${bad}” is not a valid class name. Use letters, numbers, - and _ (not starting with a number).`;
      return;
    }
    error = '';
    draft = '';
    onchange([...new Set([...classes, ...parts])].join(' '));
  }

  function remove(cls: string) {
    onchange(classes.filter((c) => c !== cls).join(' '));
  }
</script>

<div class="chips">
  <div class="chips__box">
    {#each classes as cls (cls)}
      <span class="chips__chip">
        <span class="chips__name">.{cls}</span>
        <button type="button" class="chips__remove" aria-label="Remove class {cls}" onclick={() => remove(cls)}>
          <XIcon size={10} weight="bold" />
        </button>
      </span>
    {/each}
    <input
      {id}
      class="chips__input"
      type="text"
      spellcheck="false"
      autocomplete="off"
      placeholder={classes.length ? 'Add class' : 'Add a class name and press Enter'}
      aria-label="Add CSS class"
      aria-invalid={error ? 'true' : undefined}
      value={draft}
      oninput={(e) => {
        draft = e.currentTarget.value;
        error = '';
      }}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          add(draft);
        } else if (e.key === 'Backspace' && draft === '' && classes.length > 0) {
          remove(classes[classes.length - 1]);
        }
      }}
      onblur={() => draft.trim() && add(draft)}
    />
  </div>
  {#if error}<InlineMessage message={error} />{/if}
</div>

<style>
  .chips {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .chips__box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-height: var(--sx-control-h);
    padding: 3px 4px;
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
  }
  .chips__box:focus-within {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .chips__chip {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 20px;
    padding: 0 2px 0 6px;
    border-radius: var(--sx-radius-xs);
    background: var(--sx-accent-soft);
    color: var(--sx-accent-text);
  }
  .chips__name {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    font-weight: 500;
  }
  .chips__remove {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: inherit;
    opacity: 0.7;
  }
  .chips__remove:hover {
    opacity: 1;
    background: var(--sx-accent-soft-2);
  }
  .chips__input {
    flex: 1;
    min-width: 80px;
    height: 20px;
    padding: 0 4px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    background: transparent;
    border: 0;
    outline: none;
    color: var(--sx-text);
  }
  .chips__input::placeholder {
    font-family: var(--sx-font);
    color: var(--sx-text-3);
  }
</style>
