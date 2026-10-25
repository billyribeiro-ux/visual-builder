<script lang="ts">
  import Button from './Button.svelte';

  interface PlanItem {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaHref: string;
    isPopular?: boolean;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    plans?: PlanItem[];
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    sectionEyebrow = 'Pricing',
    sectionTitle = 'Predictable Pricing for High-Output Teams',
    sectionDescription = 'All plans include full source-code export.',
    plans = [],
    style = '',
    onNavigate
  }: Props = $props();
</script>

<section class="py-16" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">{sectionEyebrow}</span>
      <h2 class="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">{sectionTitle}</h2>
      <p class="mt-4 text-base text-[var(--color-muted-foreground)]">{sectionDescription}</p>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      {#each plans as plan}
        <div class="relative flex flex-col justify-between rounded-[var(--radius-xl)] border {plan.isPopular ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'} bg-[var(--color-card)] p-8 shadow-sm">
          {#if plan.isPopular}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white">
              Most Popular
            </div>
          {/if}
          <div>
            <h3 class="text-xl font-bold text-[var(--color-foreground)]">{plan.name}</h3>
            <p class="mt-2 text-sm text-[var(--color-muted-foreground)]">{plan.description}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-4xl font-extrabold text-[var(--color-foreground)]">{plan.price}</span>
              <span class="text-sm text-[var(--color-muted-foreground)]">/{plan.period}</span>
            </div>
            <ul class="mt-8 space-y-3 text-sm text-[var(--color-foreground)]">
              {#each plan.features as feat}
                <li class="flex items-center gap-2">
                  <span class="text-[var(--color-success)] font-bold">✓</span>
                  <span>{feat}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="mt-8">
            <Button
              href={plan.ctaHref}
              variant={plan.isPopular ? 'primary' : 'outline'}
              class="w-full text-center"
              {onNavigate}
            >
              {plan.ctaText}
            </Button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
