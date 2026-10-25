<script lang="ts">
  import Container from './Container.svelte';

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

<section class="md-accordion" {style}>
  <Container maxWidth="lg">
    <h2 style="font-size: 2.25rem; font-weight: 800; text-align: center; margin-bottom: 3rem;">{sectionTitle}</h2>
    <div>
      {#each items as item, idx (idx)}
        <div class="md-accordion__item">
          <button
            type="button"
            class="md-accordion__trigger"
            onclick={() => toggle(idx)}
            aria-expanded={openIndex === idx}
          >
            <span>{item.question}</span>
            <span style="font-weight: 700; display: inline-block; transform: {openIndex === idx ? 'rotate(180deg)' : 'rotate(0)'}; transition: transform var(--md-sys-motion-duration-short);">↓</span>
          </button>
          {#if openIndex === idx}
            <div class="md-accordion__content">
              {item.answer}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </Container>
</section>
