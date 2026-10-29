<script lang="ts">
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';

  interface Props {
    message: string;
    tone?: 'error' | 'warning' | 'info';
    /** Align with the control column of a `row` Field (92px label + 8px gap). */
    indent?: boolean;
    id?: string;
  }

  let { message, tone = 'error', indent = false, id }: Props = $props();
</script>

<p {id} class={['msg', `msg--${tone}`, indent && 'msg--indent']} role={tone === 'error' ? 'alert' : 'status'}>
  {#if tone === 'error'}
    <WarningCircleIcon size={13} weight="bold" />
  {:else if tone === 'warning'}
    <WarningIcon size={13} weight="bold" />
  {:else}
    <InfoIcon size={13} weight="bold" />
  {/if}
  <span>{message}</span>
</p>

<style>
  .msg {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: -4px;
    font-size: var(--sx-text-sm);
    line-height: 1.4;
  }
  .msg :global(svg) {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .msg--indent {
    padding-left: 100px;
  }
  .msg--error {
    color: var(--sx-danger);
  }
  .msg--warning {
    color: var(--sx-warning);
  }
  .msg--info {
    color: var(--sx-text-2);
  }
</style>
