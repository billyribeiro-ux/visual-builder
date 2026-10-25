<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    initialName?: string;
    initialEmail?: string;
    notificationsEnabled?: boolean;
    style?: string;
  }

  let {
    initialName = 'Acme Workspace',
    initialEmail = 'team@acme.test',
    notificationsEnabled = true,
    style = ''
  }: Props = $props();

  let name = $state('');
  let email = $state('');
  let notifications = $state(true);
  let savedMessage = $state('');

  $effect(() => {
    name = initialName;
    email = initialEmail;
    notifications = notificationsEnabled;
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    savedMessage = 'Settings saved successfully! (Simulated mock validation passing)';
    setTimeout(() => {
      savedMessage = '';
    }, 4000);
  }
</script>

<div class="max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm" {style}>
  <h2 class="text-lg font-bold text-[var(--color-foreground)] mb-4">Workspace Preferences</h2>

  {#if savedMessage}
    <div class="mb-4 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 font-medium">
      {savedMessage}
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="workspace-name" class="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
        Workspace Name
      </label>
      <input
        id="workspace-name"
        type="text"
        bind:value={name}
        required
        class="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
    </div>

    <div>
      <label for="workspace-email" class="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
        Notification Email
      </label>
      <input
        id="workspace-email"
        type="email"
        bind:value={email}
        required
        class="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
    </div>

    <div class="flex items-center gap-2 pt-2">
      <input
        id="notifications-toggle"
        type="checkbox"
        bind:checked={notifications}
        class="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
      />
      <label for="notifications-toggle" class="text-sm font-medium text-[var(--color-foreground)]">
        Enable deployment and build notification webhooks
      </label>
    </div>

    <div class="pt-4 border-t border-[var(--color-border)] flex justify-end">
      <Button type="submit">Save Changes</Button>
    </div>
  </form>
</div>
