<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';

  type Level = 'h1' | 'h2' | 'h3' | 'h4';
  type Animation = 'typing' | 'fade' | 'slide' | 'highlight';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    before?: string;
    words?: string[];
    after?: string;
    level?: Level;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animation?: Animation;
    /** Time each word stays on screen, in ms. */
    interval?: number;
    loop?: boolean;
    align?: 'left' | 'center' | 'right';
    class?: string;
  }

  let {
    before = 'Build a website that',
    words = [],
    after = '',
    level = 'h2',
    size = 'lg',
    animation = 'slide',
    interval = 2500,
    loop = true,
    align = 'center',
    class: className = '',
    ...rest
  }: Props = $props();

  const LEVELS: readonly Level[] = ['h1', 'h2', 'h3', 'h4'];
  const TYPE_MS = 70;
  const DELETE_MS = 38;

  const tag = $derived(LEVELS.includes(level) ? level : 'h2');
  const list = $derived(Array.isArray(words) ? words.map((w) => (typeof w === 'string' ? w : '')) : []);
  /** Stable primitive key so the rotation only restarts when the words really change. */
  const wordsKey = $derived(list.join('\u0000'));
  const delay = $derived(typeof interval === 'number' && Number.isFinite(interval) ? Math.min(10000, Math.max(1000, interval)) : 2500);
  const srText = $derived(
    [before.trim(), list.filter((w) => w.trim()).join(', '), after.trim()].filter(Boolean).join(' ')
  );

  let index = $state(0);
  let previous = $state<number | null>(null);
  /** Characters of the current word shown by the typing animation; `null` = the whole word. */
  let typed = $state<number | null>(null);

  const typingText = $derived.by(() => {
    const word = list[index] ?? '';
    return typed === null ? word : word.slice(0, typed);
  });

  const rotate: Attachment<HTMLElement> = (node) => {
    const items = wordsKey ? wordsKey.split('\u0000') : [];
    const count = items.length;
    const mode = animation;
    const hold = delay;
    const repeat = loop;
    index = 0;
    previous = null;
    typed = null;
    if (count < 2) return;

    // Stacked modes: the rotator's width follows the active word (animated), so the phrase
    // never shows a gap where a longer word would fit.
    const rotator = mode === 'typing' ? null : node.querySelector<HTMLElement>('.rotator');
    const wordEls = rotator ? Array.from(rotator.querySelectorAll<HTMLElement>('.word')) : [];
    let shownIndex = 0;
    const fit = () => {
      const el = wordEls[shownIndex];
      if (rotator && el) rotator.style.setProperty('--rotator-width', `${Math.ceil(el.getBoundingClientRect().width)}px`);
    };
    const resize = rotator && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    for (const el of wordEls) resize?.observe(el);
    fit();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    const cleanup = () => {
      clearTimeout(timer);
      resize?.disconnect();
      rotator?.style.removeProperty('--rotator-width');
      node.removeEventListener('pointerenter', pause);
      node.removeEventListener('pointerleave', resume);
      node.removeEventListener('focusin', pause);
      node.removeEventListener('focusout', resume);
    };

    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return cleanup;

    const later = (fn: () => void, ms: number) => {
      timer = setTimeout(function run() {
        if (paused) timer = setTimeout(run, 200);
        else fn();
      }, ms);
    };
    const isLast = (i: number) => i === count - 1;

    if (mode === 'typing') {
      let shown = (items[0] ?? '').length;
      const typeNext = (i: number) => {
        const word = items[i] ?? '';
        if (shown < word.length) {
          shown += 1;
          typed = shown;
          later(() => typeNext(i), TYPE_MS);
        } else {
          typed = null;
          if (!repeat && isLast(i)) return;
          later(() => deleteCurrent(i), hold);
        }
      };
      const deleteCurrent = (i: number) => {
        if (shown > 0) {
          shown -= 1;
          typed = shown;
          later(() => deleteCurrent(i), DELETE_MS);
        } else {
          const next = (i + 1) % count;
          index = next;
          later(() => typeNext(next), TYPE_MS * 3);
        }
      };
      later(() => deleteCurrent(0), hold);
    } else {
      const advance = () => {
        const next = (shownIndex + 1) % count;
        previous = shownIndex;
        index = next;
        shownIndex = next;
        fit();
        if (!repeat && isLast(next)) return;
        later(advance, hold);
      };
      later(advance, hold);
    }

    node.addEventListener('pointerenter', pause);
    node.addEventListener('pointerleave', resume);
    node.addEventListener('focusin', pause);
    node.addEventListener('focusout', resume);
    return cleanup;
  };
</script>

<svelte:element
  this={tag}
  {...rest}
  class={['headline', `headline--${size}`, `headline--${animation}`, `align-${align}`, className]}
  {@attach rotate}
>
  <span class="visually-hidden">{srText}</span>
  <span class="visual" aria-hidden="true">
    {#if before}
      <span class="static" data-prop="before">{before}</span>
    {/if}
    {#if animation === 'typing'}
      <span class="rotator rotator--typing">
        <span class="word word--active">{typingText}</span>
        <span class="caret"></span>
      </span>
    {:else}
      <span class="rotator">
        {#each list as word, i (i)}
          <span class={['word', i === index && 'word--active', i === previous && 'word--previous']} data-prop={`words.${i}`}>{word}</span>
        {/each}
      </span>
    {/if}
    {#if after}
      <span class="static" data-prop="after">{after}</span>
    {/if}
  </span>
</svelte:element>

<style>
  .headline {
    --headline-ease: cubic-bezier(0.22, 1, 0.36, 1);
    margin: 0;
    font-family: var(--md-sys-font-heading, inherit);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--md-sys-color-on-surface);
    text-wrap: balance;
  }
  .headline--sm {
    font-size: clamp(1.5rem, 1.5vw + 1rem, 1.875rem);
    letter-spacing: -0.02em;
  }
  .headline--md {
    font-size: clamp(1.875rem, 2.5vw + 1rem, 2.5rem);
  }
  .headline--lg {
    font-size: clamp(2.25rem, 4vw + 1rem, 3.5rem);
  }
  .headline--xl {
    font-size: clamp(2.5rem, 6vw + 1rem, 4.5rem);
    letter-spacing: -0.035em;
    line-height: 1.04;
  }
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }

  .rotator {
    position: relative;
    display: inline-grid;
    justify-items: start;
    width: var(--rotator-width, auto);
    vertical-align: bottom;
    white-space: nowrap;
    transition: width 450ms var(--headline-ease);
  }
  .word {
    grid-area: 1 / 1;
    position: relative;
    color: var(--md-sys-color-primary);
  }

  /* ---- Fade -------------------------------------------------------------- */
  .headline--fade .word,
  .headline--highlight .word {
    opacity: 0;
    transition: opacity 450ms var(--headline-ease);
  }
  .headline--fade .word--active,
  .headline--highlight .word--active {
    opacity: 1;
  }

  /* ---- Slide ------------------------------------------------------------- */
  .headline--slide .rotator {
    overflow: hidden;
    padding-bottom: 0.12em;
    margin-bottom: -0.12em;
  }
  .headline--slide .word {
    opacity: 0;
    transform: translateY(100%);
    transition: transform 600ms var(--headline-ease), opacity 400ms var(--headline-ease);
  }
  .headline--slide .word--active {
    opacity: 1;
    transform: translateY(0);
  }
  .headline--slide .word--previous {
    opacity: 0;
    transform: translateY(-100%);
  }

  /* ---- Highlight (marker stroke) ---------------------------------------- */
  .headline--highlight .word {
    isolation: isolate;
    color: var(--md-sys-color-on-surface);
  }
  .headline--highlight .word::after {
    content: '';
    position: absolute;
    z-index: -1;
    left: -0.06em;
    right: -0.06em;
    bottom: 0.06em;
    height: 0.36em;
    border-radius: 0.12em;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent);
    transform: scaleX(0);
    transform-origin: left center;
  }
  .headline--highlight .word--active::after {
    animation: headline-marker 700ms var(--headline-ease) 120ms forwards;
  }
  @keyframes headline-marker {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  /* ---- Typing ------------------------------------------------------------ */
  .rotator--typing {
    display: inline-flex;
    align-items: baseline;
  }
  .caret {
    display: inline-block;
    width: 0.06em;
    min-width: 2px;
    height: 0.9em;
    margin-left: 0.06em;
    align-self: center;
    border-radius: 1px;
    background-color: var(--md-sys-color-primary);
    animation: headline-caret 1s steps(1) infinite;
  }
  @keyframes headline-caret {
    50% {
      opacity: 0;
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .rotator,
    .word,
    .headline--slide .word {
      transition: none;
    }
    .headline--highlight .word--active::after {
      animation: none;
      transform: scaleX(1);
    }
    .caret {
      animation: none;
    }
  }
</style>
