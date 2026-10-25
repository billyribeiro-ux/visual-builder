<script lang="ts">
  interface FaqItem {
    question: string;
    answer: string;
  }

  interface Props {
    sectionTitle?: string;
    items?: FaqItem[];
    style?: string;
  }

  let {
    sectionTitle = 'Frequently Asked Questions',
    items = [],
    style = ''
  }: Props = $props();

  let openIndex = $state<number | null>(0);

  function toggle(idx: number) {
    openIndex = openIndex === idx ? null : idx;
  }
</script>

<section class="py-16" {style}>
  <div class="mx-auto max-w-screen-md px-4 sm:px-6">
    <h2 class="text-3xl font-bold text-center tracking-tight text-[var(--color-foreground)] mb-10">
      {sectionTitle}
    </h2>

    <div class="space-y-4">
      {#each items as item, idx}
        <div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <button
            type="button"
            onclick={() => toggle(idx)}
            aria-expanded={openIndex === idx}
            class="flex w-full items-center justify-between p-5 text-left font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <span>{item.question}</span>
            <span class="text-lg transition-transform duration-200 {openIndex === idx ? 'rotate-180' : ''}">
              ▼
            </span>
          </button>
          {#if openIndex === idx}
            <div class="px-5 pb-5 pt-1 text-sm text-[var(--color-muted-foreground)] leading-relaxed border-t border-[var(--color-border)]">
              {item.answer}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
