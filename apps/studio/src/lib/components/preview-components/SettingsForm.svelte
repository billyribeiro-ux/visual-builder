<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    initialName?: string;
    initialEmail?: string;
    notificationsEnabled?: boolean;
    style?: string;
  }

  let {
    initialName = 'Jane Doe',
    initialEmail = 'jane.doe@company.internal',
    notificationsEnabled = true,
    style = ''
  }: Props = $props();

  let name = $state('');
  let email = $state('');
  let notifications = $state(true);

  $effect(() => {
    name = initialName;
    email = initialEmail;
    notifications = notificationsEnabled;
  });
  let isSaved = $state(false);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    isSaved = true;
    setTimeout(() => {
      isSaved = false;
    }, 3000);
  }
</script>

<div class="md-card md-card--elevated" style="max-width: 600px; {style}">
  <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem;">Workspace Preferences</h2>

  {#if isSaved}
    <div style="padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); font-size: 0.875rem; font-weight: 600; margin-bottom: 1.5rem;">
      ✓ Preferences saved successfully
    </div>
  {/if}

  <form onsubmit={handleSubmit}>
    <div class="md-form-group">
      <label for="pref-name" class="md-label">User Display Name</label>
      <input id="pref-name" type="text" bind:value={name} class="md-input" />
    </div>

    <div class="md-form-group">
      <label for="pref-email" class="md-label">Notification Email Address</label>
      <input id="pref-email" type="email" bind:value={email} class="md-input" />
    </div>

    <div class="md-form-group" style="display: flex; align-items: center; gap: 0.75rem; margin-top: 1.5rem;">
      <input
        id="pref-notif"
        type="checkbox"
        bind:checked={notifications}
        style="width: 18px; height: 18px; accent-color: var(--md-sys-color-primary);"
      />
      <label for="pref-notif" style="font-size: 0.875rem; font-weight: 500; cursor: pointer;">
        Enable email digest and alert notifications
      </label>
    </div>

    <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
      <Button type="submit">Save Changes</Button>
    </div>
  </form>
</div>
