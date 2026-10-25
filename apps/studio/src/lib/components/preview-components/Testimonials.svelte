<script lang="ts">
  interface TestimonialItem {
    quote: string;
    author: string;
    role: string;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    testimonials?: TestimonialItem[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Testimonials',
    sectionTitle = 'Loved by Modern Founders and Developers',
    testimonials = [],
    style = ''
  }: Props = $props();
</script>

<section class="py-16 bg-[var(--color-muted)]/20" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-12">
      <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">{sectionEyebrow}</span>
      <h2 class="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">{sectionTitle}</h2>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      {#each testimonials as item}
        <div class="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
          <p class="text-base italic text-[var(--color-foreground)] leading-relaxed mb-6">
            "{item.quote}"
          </p>
          <div>
            <div class="font-bold text-[var(--color-foreground)]">{item.author}</div>
            <div class="text-xs text-[var(--color-muted-foreground)]">{item.role}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
