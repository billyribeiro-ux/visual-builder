<script lang="ts">
  interface FeatureItem {
    icon?: string;
    title: string;
    description: string;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    columns?: number;
    features?: FeatureItem[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Capabilities',
    sectionTitle = 'Engineered for Performance',
    sectionDescription = 'Built using modern web standards.',
    columns = 3,
    features = [],
    style = ''
  }: Props = $props();

  let colClass = $derived(columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3');
</script>

<section class="py-16 bg-[var(--color-muted)]/40" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-12">
      {#if sectionEyebrow}
        <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">
          {sectionEyebrow}
        </span>
      {/if}
      <h2 class="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
        {sectionTitle}
      </h2>
      {#if sectionDescription}
        <p class="mt-4 text-base text-[var(--color-muted-foreground)]">
          {sectionDescription}
        </p>
      {/if}
    </div>

    <div class="grid grid-cols-1 gap-8 {colClass}">
      {#each features as feature}
        <div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold mb-4">
            ⚡
          </div>
          <h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
            {feature.title}
          </h3>
          <p class="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            {feature.description}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
