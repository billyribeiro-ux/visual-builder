<script lang="ts">
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import Popover from './Popover.svelte';

  export interface ColorSwatch {
    name: string;
    /** The concrete color (used for the chip). */
    color: string;
    /** The value written when picked, e.g. `var(--md-sys-color-primary)`. */
    value: string;
  }

  interface Props {
    value: string | undefined | null;
    onchange: (value: string) => void;
    ariaLabel: string;
    swatches?: ColorSwatch[];
    placeholder?: string;
  }

  let { value, onchange, ariaLabel, swatches = [], placeholder = 'None' }: Props = $props();

  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);
  let draft = $state<string | null>(null);

  const current = $derived((value ?? '').trim());
  const token = $derived(swatches.find((s) => s.value === current));
  const chipColor = $derived(token ? token.color : current);
  const display = $derived(token ? token.name : current);
  // A native color input cannot be empty; start from the first global color (or white) instead of black.
  const hexForPicker = $derived(
    /^#[0-9a-f]{6}$/i.test(chipColor) ? chipColor : (swatches.find((s) => /^#[0-9a-f]{6}$/i.test(s.color))?.color ?? '#FFFFFF')
  );

  function commit(text: string) {
    draft = null;
    const t = text.trim();
    const byName = swatches.find((s) => s.name.toLowerCase() === t.toLowerCase());
    onchange(byName ? byName.value : t);
  }
</script>

<div
  class="color"
  {@attach (el) => {
    anchor = el;
  }}
>
  <button
    type="button"
    class="color__chip"
    aria-label="{ariaLabel}: open color picker"
    aria-haspopup="dialog"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    <span class="color__chip-fill" style:background={chipColor || 'transparent'}></span>
    {#if !chipColor}<span class="color__chip-empty"></span>{/if}
  </button>
  <input
    class="color__input"
    type="text"
    spellcheck="false"
    aria-label={ariaLabel}
    {placeholder}
    value={draft ?? display}
    oninput={(e) => (draft = (e.currentTarget as HTMLInputElement).value)}
    onblur={(e) => draft !== null && commit((e.currentTarget as HTMLInputElement).value)}
    onkeydown={(e) => {
      if (e.key === 'Enter') {
        commit((e.currentTarget as HTMLInputElement).value);
        (e.currentTarget as HTMLInputElement).blur();
      }
    }}
  />
  {#if current}
    <button type="button" class="color__clear" aria-label="Clear {ariaLabel}" onclick={() => onchange('')}>
      <XIcon size={11} weight="bold" />
    </button>
  {/if}
</div>

<Popover {open} {anchor} onclose={() => (open = false)} placement="bottom-end" width={232} role="dialog" label="{ariaLabel} picker">
  <div class="picker">
    <input
      class="picker__native"
      type="color"
      aria-label="{ariaLabel} custom color"
      value={hexForPicker}
      oninput={(e) => onchange((e.currentTarget as HTMLInputElement).value.toUpperCase())}
    />
    {#if swatches.length > 0}
      <div class="sx-menu-heading">Global colors</div>
      <div class="picker__grid">
        {#each swatches as s (s.value)}
          <button
            type="button"
            class={['picker__swatch', s.value === current && 'picker__swatch--on']}
            style:background={s.color}
            aria-label={s.name}
            title={s.name}
            onclick={() => {
              onchange(s.value);
              open = false;
            }}
          ></button>
        {/each}
      </div>
    {/if}
  </div>
</Popover>

<style>
  .color {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    height: var(--sx-control-h);
    padding-left: 4px;
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
  }
  .color:hover {
    border-color: var(--sx-border-strong);
  }
  .color:focus-within {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .color__chip {
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.12);
    background-image:
      linear-gradient(45deg, #e4e7ec 25%, transparent 25%),
      linear-gradient(-45deg, #e4e7ec 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e4e7ec 75%),
      linear-gradient(-45deg, transparent 75%, #e4e7ec 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0;
  }
  .color__chip-fill {
    position: absolute;
    inset: 0;
  }
  .color__chip-empty {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top right, transparent calc(50% - 1px), #f04438 calc(50% - 1px), #f04438 calc(50% + 1px), transparent calc(50% + 1px));
    background-color: #fff;
  }
  .color__input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0 6px 0 8px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    background: transparent;
    border: 0;
    outline: none;
    color: var(--sx-text);
  }
  .color__input::placeholder {
    color: var(--sx-text-3);
    font-family: var(--sx-font);
  }
  .color__clear {
    display: grid;
    place-items: center;
    width: 22px;
    height: 100%;
    color: var(--sx-text-3);
  }
  .color__clear:hover {
    color: var(--sx-text);
  }
  .picker {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
  }
  .picker__native {
    width: 100%;
    height: 120px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: none;
    cursor: crosshair;
  }
  .picker__native::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  .picker__native::-webkit-color-swatch {
    border: 0;
    border-radius: 6px;
  }
  .picker__grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
    padding: 0 2px 2px;
  }
  .picker__swatch {
    aspect-ratio: 1;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.14);
  }
  .picker__swatch:hover {
    transform: scale(1.08);
  }
  .picker__swatch--on {
    box-shadow:
      0 0 0 2px var(--sx-panel-raised),
      0 0 0 3.5px var(--sx-accent);
  }
</style>
