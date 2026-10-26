<script lang="ts">
  interface StatItem {
    label: string;
    value: string;
    subtext?: string;
  }

  interface Props {
    stats?: StatItem[];
    style?: string;
  }

  let { stats = [], style = '' }: Props = $props();
</script>

<section class="md-section" style="padding: 3rem 0; {style}">
  <div class="md-container md-container-xl">
    <div class="md-grid md-grid-cols-4">
      {#each stats as stat, idx (idx)}
        <div class="md-card md-card-outlined" style="text-align: center; padding: 1.75rem 1.25rem;">
          <div class="md-display-medium" style="color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">{stat.value}</div>
          <div class="md-title-medium" style="margin-bottom: 0.25rem;">{stat.label}</div>
          {#if stat.subtext}
            <div class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">{stat.subtext}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
