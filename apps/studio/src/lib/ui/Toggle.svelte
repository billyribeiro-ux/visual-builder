<script lang="ts">
  interface Props {
    checked: boolean;
    onchange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
  }

  let { checked, onchange, label, disabled = false }: Props = $props();
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  {disabled}
  class="toggle"
  onclick={() => onchange(!checked)}
>
  <span class="toggle__thumb"></span>
</button>

<style>
  .toggle {
    position: relative;
    width: 28px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--sx-border-strong);
    transition: background-color var(--sx-dur) var(--sx-ease);
  }
  .toggle[aria-checked='true'] {
    background: var(--sx-accent);
  }
  .toggle:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .toggle__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.25);
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .toggle[aria-checked='true'] .toggle__thumb {
    transform: translateX(12px);
  }
</style>
